const fs = require('fs');
const readline = require('readline');
const csv = require('csv-parser');
const { chain } = require('stream-chain');
const { parser } = require('stream-json');
const { streamArray } = require('stream-json/streamers/StreamArray');
const { streamValues } = require('stream-json/streamers/StreamValues');

/**
 * Infer primitive data type of a value
 */
const inferPrimitiveType = (val) => {
  if (val === null || val === undefined || val === '') return 'null';
  if (typeof val === 'boolean') return 'boolean';
  if (typeof val === 'number') return 'number';
  if (typeof val === 'object') {
    return Array.isArray(val) ? 'array' : 'object';
  }

  const str = String(val).trim();
  if (str.toLowerCase() === 'true' || str.toLowerCase() === 'false') return 'boolean';
  if (!isNaN(str) && str !== '') return 'number';

  // Check if ISO / parseable date
  const dateAttempt = Date.parse(str);
  if (!isNaN(dateAttempt) && /^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(str)) {
    return 'date';
  }

  return 'string';
};

/**
 * Resolve dominant column type from a set of observed types
 */
const resolveDominantType = (typesSet) => {
  const filtered = Array.from(typesSet).filter(t => t !== 'null');
  if (filtered.length === 0) return 'string';
  if (filtered.length === 1) return filtered[0];
  if (filtered.includes('string')) return 'string';
  if (filtered.includes('number') && filtered.includes('boolean')) return 'mixed';
  return 'mixed';
};

/**
 * Detect CSV delimiter from the first line (comma, semicolon, tab, pipe)
 */
const detectDelimiter = async (filePath) => {
  const stream = fs.createReadStream(filePath, { encoding: 'utf8', highWaterMark: 1024 });
  let firstLine = '';

  for await (const chunk of stream) {
    const newlineIndex = chunk.indexOf('\n');
    if (newlineIndex !== -1) {
      firstLine += chunk.substring(0, newlineIndex);
      stream.destroy();
      break;
    }
    firstLine += chunk;
    if (firstLine.length > 4096) {
      stream.destroy();
      break;
    }
  }

  const delimiters = [',', ';', '\t', '|'];
  let bestDelimiter = ',';
  let maxCount = -1;

  for (const delim of delimiters) {
    const count = (firstLine.match(new RegExp(`\\${delim}`, 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      bestDelimiter = delim;
    }
  }

  return bestDelimiter;
};

/**
 * Parse a CSV file via Node.js Stream
 */
const parseCsvStream = async (filePath, maxPreviewRows = 50) => {
  const delimiter = await detectDelimiter(filePath);
  const readableStream = fs.createReadStream(filePath);

  return new Promise((resolve, reject) => {
    let rowCount = 0;
    const previewData = [];
    const columnStats = {};

    readableStream
      .pipe(csv({
        separator: delimiter,
        trim: true,
        skipEmptyLines: true
      }))
      .on('headers', (headers) => {
        headers.forEach((header) => {
          const cleanHeader = header.trim();
          columnStats[cleanHeader] = {
            name: cleanHeader,
            nullCount: 0,
            types: new Set(),
            sampleValues: []
          };
        });
      })
      .on('data', (row) => {
        rowCount++;
        if (previewData.length < maxPreviewRows) {
          previewData.push(row);
        }

        for (const [col, val] of Object.entries(row)) {
          const cleanCol = col.trim();
          if (!columnStats[cleanCol]) {
            columnStats[cleanCol] = {
              name: cleanCol,
              nullCount: 0,
              types: new Set(),
              sampleValues: []
            };
          }

          if (val === '' || val === null || val === undefined) {
            columnStats[cleanCol].nullCount++;
          } else {
            const type = inferPrimitiveType(val);
            columnStats[cleanCol].types.add(type);
            if (columnStats[cleanCol].sampleValues.length < 5) {
              columnStats[cleanCol].sampleValues.push(val);
            }
          }
        }
      })
      .on('end', () => {
        const columns = Object.values(columnStats).map(c => ({
          name: c.name,
          dataType: resolveDominantType(c.types),
          nullCount: c.nullCount,
          sampleValues: c.sampleValues
        }));

        resolve({
          rowCount,
          columnCount: columns.length,
          columns,
          previewData,
          delimiter
        });
      })
      .on('error', (err) => {
        reject(new Error(`CSV Parsing failed: ${err.message}`));
      });
  });
};

/**
 * Parse JSON or JSON Lines (.json / .jsonl) via Node.js Stream
 */
const parseJsonStream = async (filePath, isJsonLines = false, maxPreviewRows = 50) => {
  if (isJsonLines) {
    return parseJsonLinesStream(filePath, maxPreviewRows);
  }

  // Attempt streaming JSON array first
  return new Promise((resolve, reject) => {
    const readableStream = fs.createReadStream(filePath);
    let rowCount = 0;
    const previewData = [];
    const columnStats = {};
    let isArrayFormat = true;

    const pipeline = chain([
      readableStream,
      parser(),
      streamArray()
    ]);

    pipeline.on('data', ({ key, value }) => {
      rowCount++;
      if (previewData.length < maxPreviewRows) {
        previewData.push(value);
      }

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        for (const [col, val] of Object.entries(value)) {
          if (!columnStats[col]) {
            columnStats[col] = {
              name: col,
              nullCount: 0,
              types: new Set(),
              sampleValues: []
            };
          }

          if (val === null || val === undefined) {
            columnStats[col].nullCount++;
          } else {
            const type = inferPrimitiveType(val);
            columnStats[col].types.add(type);
            if (columnStats[col].sampleValues.length < 5) {
              columnStats[col].sampleValues.push(val);
            }
          }
        }
      }
    });

    pipeline.on('end', () => {
      const columns = Object.values(columnStats).map(c => ({
        name: c.name,
        dataType: resolveDominantType(c.types),
        nullCount: c.nullCount,
        sampleValues: c.sampleValues
      }));

      resolve({
        rowCount,
        columnCount: columns.length,
        columns,
        previewData,
        delimiter: null
      });
    });

    pipeline.on('error', (err) => {
      // Fallback: If not standard array of objects, parse as JSON Lines
      parseJsonLinesStream(filePath, maxPreviewRows)
        .then(resolve)
        .catch(() => reject(new Error(`JSON Parsing failed: ${err.message}`)));
    });
  });
};

/**
 * Parse JSON Lines (.jsonl / NDJSON) line by line
 */
const parseJsonLinesStream = async (filePath, maxPreviewRows = 50) => {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let rowCount = 0;
  const previewData = [];
  const columnStats = {};

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      const record = JSON.parse(trimmed);
      rowCount++;
      if (previewData.length < maxPreviewRows) {
        previewData.push(record);
      }

      if (typeof record === 'object' && record !== null && !Array.isArray(record)) {
        for (const [col, val] of Object.entries(record)) {
          if (!columnStats[col]) {
            columnStats[col] = {
              name: col,
              nullCount: 0,
              types: new Set(),
              sampleValues: []
            };
          }

          if (val === null || val === undefined) {
            columnStats[col].nullCount++;
          } else {
            const type = inferPrimitiveType(val);
            columnStats[col].types.add(type);
            if (columnStats[col].sampleValues.length < 5) {
              columnStats[col].sampleValues.push(val);
            }
          }
        }
      }
    } catch {
      // Ignore unparseable individual line in jsonl
    }
  }

  const columns = Object.values(columnStats).map(c => ({
    name: c.name,
    dataType: resolveDominantType(c.types),
    nullCount: c.nullCount,
    sampleValues: c.sampleValues
  }));

  return {
    rowCount,
    columnCount: columns.length,
    columns,
    previewData,
    delimiter: null
  };
};

module.exports = {
  parseCsvStream,
  parseJsonStream,
  detectDelimiter,
  inferPrimitiveType,
  resolveDominantType
};
