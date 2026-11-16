const fs = require('fs');
const readline = require('readline');
const csv = require('csv-parser');
const { chain } = require('stream-chain');
const { parser } = require('stream-json');
const { streamArray } = require('stream-json/streamers/StreamArray');

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
 * Detect CSV delimiter from the first line of a file (comma, semicolon, tab, pipe)
 */
const detectDelimiter = async (filePath) => {
  try {
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
  } catch {
    return ',';
  }
};

/**
 * Parse a CSV file or readable stream
 * @param {string|stream.Readable} filePathOrStream
 * @param {number} maxPreviewRows (default 50 for full parse, 10-20 for preview)
 * @param {string} customDelimiter
 */
const parseCsvStream = async (filePathOrStream, maxPreviewRows = 50, customDelimiter = null) => {
  let readableStream;
  let delimiter = customDelimiter || ',';

  if (typeof filePathOrStream === 'string') {
    if (!customDelimiter) {
      delimiter = await detectDelimiter(filePathOrStream);
    }
    readableStream = fs.createReadStream(filePathOrStream);
  } else {
    readableStream = filePathOrStream;
  }

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
          const cleanHeader = (header || '').trim();
          if (cleanHeader) {
            columnStats[cleanHeader] = {
              name: cleanHeader,
              nullCount: 0,
              types: new Set(),
              sampleValues: []
            };
          }
        });
      })
      .on('data', (row) => {
        rowCount++;
        if (previewData.length < maxPreviewRows) {
          previewData.push(row);
        }

        for (const [col, val] of Object.entries(row)) {
          const cleanCol = (col || '').trim();
          if (!cleanCol) continue;

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
 * @param {string|stream.Readable} filePathOrStream
 * @param {boolean} isJsonLines
 * @param {number} maxPreviewRows
 */
const parseJsonStream = async (filePathOrStream, isJsonLines = false, maxPreviewRows = 50) => {
  if (isJsonLines) {
    return parseJsonLinesStream(filePathOrStream, maxPreviewRows);
  }

  const readableStream = typeof filePathOrStream === 'string'
    ? fs.createReadStream(filePathOrStream)
    : filePathOrStream;

  return new Promise((resolve, reject) => {
    let rowCount = 0;
    const previewData = [];
    const columnStats = {};

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
      // If parsing as JSON array fails and input is a filePath, fallback to JSON Lines
      if (typeof filePathOrStream === 'string') {
        parseJsonLinesStream(filePathOrStream, maxPreviewRows)
          .then(resolve)
          .catch(() => reject(new Error(`JSON Parsing failed: ${err.message}`)));
      } else {
        reject(new Error(`JSON Parsing failed: ${err.message}`));
      }
    });
  });
};

/**
 * Parse JSON Lines (.jsonl / NDJSON) line by line
 */
const parseJsonLinesStream = async (filePathOrStream, maxPreviewRows = 50) => {
  const fileStream = typeof filePathOrStream === 'string'
    ? fs.createReadStream(filePathOrStream)
    : filePathOrStream;

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
      // Ignore unparseable line
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

/**
 * Fast preview reader: reads first 10-20 records directly from a stream
 * Destroys/closes the stream once limit is reached for memory and bandwidth efficiency
 */
const readPreviewRowsFromStream = async ({ stream, fileType, limit = 20, delimiter = ',' }) => {
  if (!stream) {
    return { rows: [], columns: [], count: 0 };
  }

  const validLimit = Math.max(1, Math.min(limit, 100));

  if (fileType === 'csv') {
    return new Promise((resolve, reject) => {
      const rows = [];
      const headers = [];

      stream
        .pipe(csv({
          separator: delimiter || ',',
          trim: true,
          skipEmptyLines: true
        }))
        .on('headers', (hdrs) => {
          headers.push(...hdrs);
        })
        .on('data', (data) => {
          if (rows.length < validLimit) {
            rows.push(data);
          }
          if (rows.length >= validLimit) {
            stream.destroy();
            resolve({
              rows,
              columns: headers.map(h => ({ name: h, dataType: 'string' })),
              count: rows.length
            });
          }
        })
        .on('end', () => {
          resolve({
            rows,
            columns: headers.map(h => ({ name: h, dataType: 'string' })),
            count: rows.length
          });
        })
        .on('error', (err) => {
          // If destroyed early, it might emit an error or close
          if (rows.length > 0) {
            resolve({
              rows,
              columns: headers.map(h => ({ name: h, dataType: 'string' })),
              count: rows.length
            });
          } else {
            reject(err);
          }
        });
    });
  } else {
    // JSON stream preview
    return new Promise((resolve, reject) => {
      const rows = [];

      const pipeline = chain([
        stream,
        parser(),
        streamArray()
      ]);

      pipeline.on('data', ({ value }) => {
        if (rows.length < validLimit) {
          rows.push(value);
        }
        if (rows.length >= validLimit) {
          pipeline.destroy();
          const cols = rows.length > 0 && typeof rows[0] === 'object'
            ? Object.keys(rows[0]).map(k => ({ name: k, dataType: typeof rows[0][k] }))
            : [];
          resolve({
            rows,
            columns: cols,
            count: rows.length
          });
        }
      });

      pipeline.on('end', () => {
        const cols = rows.length > 0 && typeof rows[0] === 'object'
          ? Object.keys(rows[0]).map(k => ({ name: k, dataType: typeof rows[0][k] }))
          : [];
        resolve({
          rows,
          columns: cols,
          count: rows.length
        });
      });

      pipeline.on('error', (err) => {
        if (rows.length > 0) {
          const cols = Object.keys(rows[0] || {}).map(k => ({ name: k, dataType: typeof rows[0][k] }));
          resolve({
            rows,
            columns: cols,
            count: rows.length
          });
        } else {
          reject(err);
        }
      });
    });
  }
};

module.exports = {
  parseCsvStream,
  parseJsonStream,
  detectDelimiter,
  inferPrimitiveType,
  resolveDominantType,
  readPreviewRowsFromStream
};
