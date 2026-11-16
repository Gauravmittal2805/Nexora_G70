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

  // Check if ISO / parseable date (YYYY-MM-DD or similar)
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
 * Parse a CSV file or readable stream with full schema inference & summary
 * Memory-bounded: reads via stream without buffering the whole file in memory
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
    let isHeaderSeen = false;

    const csvStream = csv({
      separator: delimiter,
      trim: true,
      skipEmptyLines: true,
      strict: false // Gracefully accept ragged or malformed lines without crashing
    });

    readableStream
      .pipe(csvStream)
      .on('headers', (headers) => {
        isHeaderSeen = true;
        headers.forEach((header) => {
          let cleanHeader = (header || '').trim();
          // Remove BOM if present on first header
          if (cleanHeader.charCodeAt(0) === 0xFEFF) {
            cleanHeader = cleanHeader.slice(1);
          }
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
        if (!isHeaderSeen && rowCount === 0) {
          return reject(new Error('CSV file appears to be empty or contains no parseable data.'));
        }

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
        // If some rows were parsed before error, resolve with what was recovered
        if (rowCount > 0 && previewData.length > 0) {
          const columns = Object.values(columnStats).map(c => ({
            name: c.name,
            dataType: resolveDominantType(c.types),
            nullCount: c.nullCount,
            sampleValues: c.sampleValues
          }));
          return resolve({
            rowCount,
            columnCount: columns.length,
            columns,
            previewData,
            delimiter,
            warning: `CSV parsing completed with warning: ${err.message}`
          });
        }
        reject(new Error(`CSV Parsing failed: ${err.message}`));
      });

    readableStream.on('error', (err) => {
      reject(new Error(`File read stream error: ${err.message}`));
    });
  });
};

/**
 * Parse JSON or JSON Lines (.json / .jsonl) via Node.js Stream
 */
const parseJsonStream = async (filePathOrStream, isJsonLines = false, maxPreviewRows = 50) => {
  if (isJsonLines) {
    return parseJsonLinesStream(filePathOrStream, maxPreviewRows);
  }

  // Handle stream vs file path input
  let readableStream;
  let tempBuffer = null;

  if (typeof filePathOrStream === 'string') {
    readableStream = fs.createReadStream(filePathOrStream);
  } else {
    readableStream = filePathOrStream;
  }

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
          .catch(() => reject(new Error(`Malformed JSON file: ${err.message}`)));
      } else {
        reject(new Error(`Malformed JSON file: ${err.message}`));
      }
    });

    readableStream.on('error', (err) => {
      reject(new Error(`JSON read stream error: ${err.message}`));
    });
  });
};

/**
 * Parse JSON Lines (.jsonl / NDJSON) line by line using readline
 * Tolerates malformed individual lines without aborting the entire stream
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
  let malformedLineCount = 0;
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
      malformedLineCount++;
      // Skip corrupt individual line and continue
    }
  }

  if (rowCount === 0 && malformedLineCount > 0) {
    throw new Error('Malformed JSON Lines file: None of the lines could be parsed as valid JSON.');
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
    delimiter: null,
    malformedLines: malformedLineCount
  };
};

/**
 * High-performance paginated preview reader using Node.js Streams
 * - Skips the first (page - 1) * limit rows without buffering them
 * - Collects exactly 'limit' rows
 * - Destroys the stream immediately as soon as the limit is satisfied
 * - Handles malformed rows gracefully
 * - Memory complexity: O(limit), regardless of file size (handles 10GB+ files cleanly)
 *
 * @param {Object} options
 * @param {stream.Readable} options.stream - Readable stream from B2 or local file
 * @param {string} options.fileType - 'csv' | 'json' | 'jsonl'
 * @param {number} options.page - 1-based page number (default 1)
 * @param {number} options.limit - Number of preview records requested (default 20)
 * @param {string} options.delimiter - CSV separator (default ',')
 */
const readPreviewRowsFromStream = async ({
  stream,
  fileType = 'csv',
  page = 1,
  limit = 20,
  delimiter = ','
}) => {
  if (!stream) {
    return { rows: [], columns: [], count: 0, hasNextPage: false };
  }

  const validLimit = Math.max(1, Math.min(limit, 500));
  const validPage = Math.max(1, page);
  const skipCount = (validPage - 1) * validLimit;
  const targetEndIndex = skipCount + validLimit;

  if (fileType === 'csv') {
    return new Promise((resolve, reject) => {
      const rows = [];
      const headers = [];
      let currentRowIndex = 0;
      let hasNextPage = false;
      let isDone = false;

      const csvParser = csv({
        separator: delimiter || ',',
        trim: true,
        skipEmptyLines: true,
        strict: false // Gracefully skip/tolerate irregular columns
      });

      const finish = () => {
        if (isDone) return;
        isDone = true;
        try { stream.destroy(); } catch {}
        try { csvParser.destroy(); } catch {}

        const cols = headers.map(h => ({ name: h, dataType: 'string' }));
        resolve({
          rows,
          columns: cols,
          count: rows.length,
          page: validPage,
          limit: validLimit,
          hasNextPage
        });
      };

      csvParser
        .on('headers', (hdrs) => {
          hdrs.forEach((h) => {
            let clean = (h || '').trim();
            if (clean.charCodeAt(0) === 0xFEFF) {
              clean = clean.slice(1);
            }
            if (clean) headers.push(clean);
          });
        })
        .on('data', (data) => {
          if (isDone) return;
          currentRowIndex++;

          if (currentRowIndex > skipCount && rows.length < validLimit) {
            rows.push(data);
          } else if (currentRowIndex > targetEndIndex) {
            hasNextPage = true;
            finish();
          }
        })
        .on('end', () => {
          finish();
        })
        .on('error', (err) => {
          // If rows were collected before malformed line, return them safely
          if (rows.length > 0) {
            finish();
          } else {
            isDone = true;
            try { stream.destroy(); } catch {}
            reject(new Error(`Malformed CSV format: ${err.message}`));
          }
        });

      stream.on('error', (err) => {
        if (rows.length > 0) {
          finish();
        } else {
          isDone = true;
          reject(new Error(`Stream error: ${err.message}`));
        }
      });

      stream.pipe(csvParser);
    });
  } else if (fileType === 'jsonl') {
    // JSON Lines streaming pagination
    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Infinity
    });

    const rows = [];
    let currentRowIndex = 0;
    let hasNextPage = false;

    for await (const line of rl) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const record = JSON.parse(trimmed);
        currentRowIndex++;

        if (currentRowIndex > skipCount && rows.length < validLimit) {
          rows.push(record);
        } else if (currentRowIndex > targetEndIndex) {
          hasNextPage = true;
          rl.close();
          stream.destroy();
          break;
        }
      } catch {
        // Tolerate single malformed line in JSONL
      }
    }

    const cols = rows.length > 0 && typeof rows[0] === 'object'
      ? Object.keys(rows[0]).map(k => ({ name: k, dataType: typeof rows[0][k] }))
      : [];

    return {
      rows,
      columns: cols,
      count: rows.length,
      page: validPage,
      limit: validLimit,
      hasNextPage
    };
  } else {
    // Standard JSON array streaming pagination
    return new Promise((resolve, reject) => {
      const rows = [];
      let currentRowIndex = 0;
      let hasNextPage = false;
      let isDone = false;

      const pipeline = chain([
        stream,
        parser(),
        streamArray()
      ]);

      const finish = () => {
        if (isDone) return;
        isDone = true;
        try { stream.destroy(); } catch {}
        try { pipeline.destroy(); } catch {}

        const cols = rows.length > 0 && typeof rows[0] === 'object'
          ? Object.keys(rows[0]).map(k => ({ name: k, dataType: typeof rows[0][k] }))
          : [];

        resolve({
          rows,
          columns: cols,
          count: rows.length,
          page: validPage,
          limit: validLimit,
          hasNextPage
        });
      };

      pipeline.on('data', ({ value }) => {
        if (isDone) return;
        currentRowIndex++;

        if (currentRowIndex > skipCount && rows.length < validLimit) {
          rows.push(value);
        } else if (currentRowIndex > targetEndIndex) {
          hasNextPage = true;
          finish();
        }
      });

      pipeline.on('end', () => {
        finish();
      });

      pipeline.on('error', (err) => {
        if (rows.length > 0) {
          finish();
        } else {
          isDone = true;
          try { stream.destroy(); } catch {}
          reject(new Error(`Malformed JSON file: ${err.message}`));
        }
      });

      stream.on('error', (err) => {
        if (rows.length > 0) {
          finish();
        } else {
          isDone = true;
          reject(new Error(`Stream error: ${err.message}`));
        }
      });
    });
  }
};

module.exports = {
  parseCsvStream,
  parseJsonStream,
  parseJsonLinesStream,
  detectDelimiter,
  inferPrimitiveType,
  resolveDominantType,
  readPreviewRowsFromStream
};
