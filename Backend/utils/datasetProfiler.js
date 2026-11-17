const fs = require('fs');
const path = require('path');
const readline = require('readline');
const csv = require('csv-parser');
const { chain } = require('stream-chain');
const { parser } = require('stream-json');
const { streamArray } = require('stream-json/streamers/StreamArray');
const { detectDelimiter } = require('./streamParsers');

/**
 * Standard missing/null representations
 */
const MISSING_STRINGS = new Set([
  '',
  'null',
  'none',
  'nan',
  'na',
  'n/a',
  '#n/a',
  'nil',
  'undefined',
  '?',
  '-'
]);

/**
 * Checks if a value is considered missing or null
 */
const isNullOrMissing = (val) => {
  if (val === null || val === undefined) return true;
  if (typeof val === 'string') {
    const trimmed = val.trim().toLowerCase();
    return MISSING_STRINGS.has(trimmed);
  }
  return false;
};

/**
 * Detects the data type of an individual value
 * Returns one of: 'Number', 'Boolean', 'Date', 'String'
 */
const detectValueType = (val) => {
  if (isNullOrMissing(val)) return 'Null';

  if (typeof val === 'boolean') return 'Boolean';
  if (typeof val === 'number') {
    return isNaN(val) ? 'Null' : 'Number';
  }
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? 'Null' : 'Date';
  }

  const str = String(val).trim();
  const lower = str.toLowerCase();

  // Boolean check
  if (lower === 'true' || lower === 'false') {
    return 'Boolean';
  }

  // Number check (integer, decimal, scientific notation)
  if (/^[-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?$/.test(str) && !isNaN(Number(str))) {
    return 'Number';
  }

  // Date check
  if (
    /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/.test(str) ||
    /^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(str) ||
    /^\d{1,2}[-/.]\d{1,2}[-/.]\d{4}/.test(str)
  ) {
    const timestamp = Date.parse(str);
    if (!isNaN(timestamp)) {
      const year = new Date(timestamp).getFullYear();
      if (year >= 1900 && year <= 2100) {
        return 'Date';
      }
    }
  }

  return 'String';
};

/**
 * Resolves the dominant data type for a column from observed types
 */
const resolveDominantType = (typeCounts, nonNullCount) => {
  if (nonNullCount === 0) return 'String';

  const types = ['Number', 'Boolean', 'Date', 'String'];
  let dominant = 'String';
  let maxCount = 0;

  for (const t of types) {
    const count = typeCounts[t] || 0;
    if (count > maxCount) {
      maxCount = count;
      dominant = t;
    }
  }

  // If Number, Boolean or Date makes up at least 80% of non-null values, adopt it
  for (const t of ['Number', 'Boolean', 'Date']) {
    const count = typeCounts[t] || 0;
    if (count / nonNullCount >= 0.8) {
      return t;
    }
  }

  return dominant;
};

/**
 * Creates an empty column profile tracker
 */
const createColumnTracker = (name) => ({
  name,
  totalCount: 0,
  nullCount: 0,
  typeCounts: {
    Number: 0,
    Boolean: 0,
    Date: 0,
    String: 0
  },
  uniqueSet: new Set(),
  maxUniqueTracked: 10000,
  hasExceededUniqueLimit: false,
  sampleValues: [],
  // Stats
  numMin: Infinity,
  numMax: -Infinity,
  numSum: 0,
  numValidCount: 0,
  strMinLen: Infinity,
  strMaxLen: 0,
  strTotalLen: 0,
  boolTrueCount: 0,
  boolFalseCount: 0,
  dateMin: null,
  dateMax: null
});

/**
 * Updates a column's profile tracker with a new value
 */
const updateColumnTracker = (col, rawVal) => {
  col.totalCount++;

  if (isNullOrMissing(rawVal)) {
    col.nullCount++;
    return;
  }

  const detectedType = detectValueType(rawVal);
  if (col.typeCounts[detectedType] !== undefined) {
    col.typeCounts[detectedType]++;
  } else {
    col.typeCounts.String++;
  }

  // Track sample values (up to 5)
  if (col.sampleValues.length < 5) {
    col.sampleValues.push(rawVal);
  }

  // Track unique values (capped at maxUniqueTracked for memory safety)
  const strVal = String(rawVal).trim();
  if (!col.hasExceededUniqueLimit) {
    col.uniqueSet.add(strVal);
    if (col.uniqueSet.size > col.maxUniqueTracked) {
      col.hasExceededUniqueLimit = true;
    }
  }

  // Update type-specific stats
  if (detectedType === 'Number') {
    const num = Number(rawVal);
    if (!isNaN(num)) {
      if (num < col.numMin) col.numMin = num;
      if (num > col.numMax) col.numMax = num;
      col.numSum += num;
      col.numValidCount++;
    }
  } else if (detectedType === 'Boolean') {
    const lower = strVal.toLowerCase();
    if (lower === 'true' || rawVal === true) col.boolTrueCount++;
    if (lower === 'false' || rawVal === false) col.boolFalseCount++;
  } else if (detectedType === 'Date') {
    const d = new Date(rawVal);
    if (!isNaN(d.getTime())) {
      if (!col.dateMin || d < col.dateMin) col.dateMin = d;
      if (!col.dateMax || d > col.dateMax) col.dateMax = d;
    }
  } else {
    const len = strVal.length;
    if (len < col.strMinLen) col.strMinLen = len;
    if (len > col.strMaxLen) col.strMaxLen = len;
    col.strTotalLen += len;
  }
};

/**
 * Formats column tracking statistics into the final JSON output
 */
const finalizeColumnProfile = (col, totalRecords) => {
  const missingCount = col.nullCount;
  const nonNullCount = totalRecords - missingCount;
  const missingPercentage = totalRecords > 0
    ? Number(((missingCount / totalRecords) * 100).toFixed(2))
    : 0;

  const resolvedType = resolveDominantType(col.typeCounts, nonNullCount);
  const distinctCount = col.uniqueSet.size;
  const isUnique = nonNullCount > 0 && distinctCount === nonNullCount;

  // Practical unique values array:
  // If cardinality is reasonable (<= 50), return all unique values.
  // Otherwise, return first 50 as a sample slice.
  const uniqueArray = Array.from(col.uniqueSet);
  const uniqueValues = uniqueArray.slice(0, 50).map((v) => {
    if (resolvedType === 'Number') {
      const n = Number(v);
      return !isNaN(n) ? n : v;
    }
    if (resolvedType === 'Boolean') {
      return v.toLowerCase() === 'true';
    }
    return v;
  });

  const stats = {};

  if (resolvedType === 'Number' && col.numValidCount > 0) {
    stats.min = col.numMin !== Infinity ? col.numMin : null;
    stats.max = col.numMax !== -Infinity ? col.numMax : null;
    stats.sum = Number(col.numSum.toFixed(4));
    stats.mean = Number((col.numSum / col.numValidCount).toFixed(4));
  } else if (resolvedType === 'Boolean') {
    stats.trueCount = col.boolTrueCount;
    stats.falseCount = col.boolFalseCount;
  } else if (resolvedType === 'Date') {
    stats.earliest = col.dateMin ? col.dateMin.toISOString() : null;
    stats.latest = col.dateMax ? col.dateMax.toISOString() : null;
  } else {
    stats.minLength = col.strMinLen !== Infinity ? col.strMinLen : 0;
    stats.maxLength = col.strMaxLen;
    stats.averageLength = nonNullCount > 0
      ? Number((col.strTotalLen / nonNullCount).toFixed(2))
      : 0;
  }

  return {
    name: col.name,
    dataType: resolvedType,
    totalRecords,
    nonNullCount,
    nullCount: missingCount,
    missingCount,
    missingPercentage,
    distinctCount,
    isUnique,
    uniqueValues,
    uniqueValuesCount: uniqueValues.length,
    hasMoreUniqueValues: distinctCount > 50,
    stats,
    sampleValues: col.sampleValues
  };
};

/**
 * Profiles a CSV file
 */
const profileCsvFile = async (filePath) => {
  const delimiter = await detectDelimiter(filePath);
  const readableStream = fs.createReadStream(filePath);

  return new Promise((resolve, reject) => {
    let rowCount = 0;
    const columnsMap = new Map();

    readableStream
      .pipe(csv({
        separator: delimiter,
        trim: true,
        skipEmptyLines: true
      }))
      .on('headers', (headers) => {
        headers.forEach((h) => {
          const clean = h.trim();
          if (clean && !columnsMap.has(clean)) {
            columnsMap.set(clean, createColumnTracker(clean));
          }
        });
      })
      .on('data', (row) => {
        rowCount++;
        for (const [colName, val] of Object.entries(row)) {
          const cleanName = colName.trim();
          if (!columnsMap.has(cleanName)) {
            columnsMap.set(cleanName, createColumnTracker(cleanName));
          }
          updateColumnTracker(columnsMap.get(cleanName), val);
        }
      })
      .on('end', () => {
        const columns = Array.from(columnsMap.values()).map((c) =>
          finalizeColumnProfile(c, rowCount)
        );

        let totalMissing = 0;
        const typeSummary = { String: 0, Number: 0, Boolean: 0, Date: 0 };

        columns.forEach((col) => {
          totalMissing += col.missingCount;
          typeSummary[col.dataType] = (typeSummary[col.dataType] || 0) + 1;
        });

        const totalCells = rowCount * columns.length;
        const overallMissingPercentage = totalCells > 0
          ? Number(((totalMissing / totalCells) * 100).toFixed(2))
          : 0;

        resolve({
          totalRecords: rowCount,
          totalColumns: columns.length,
          columns,
          summary: {
            totalRecords: rowCount,
            totalColumns: columns.length,
            totalCells,
            missingCells: totalMissing,
            overallMissingPercentage,
            columnDataTypes: typeSummary,
            delimiter
          }
        });
      })
      .on('error', (err) => {
        reject(new Error(`Failed to profile CSV: ${err.message}`));
      });
  });
};

/**
 * Profiles a JSON or JSON Lines file
 */
const profileJsonFile = async (filePath, isJsonLines = false) => {
  if (isJsonLines || filePath.endsWith('.jsonl')) {
    return profileJsonLinesFile(filePath);
  }

  // Attempt streaming JSON array
  return new Promise((resolve, reject) => {
    const readableStream = fs.createReadStream(filePath);
    let rowCount = 0;
    const columnsMap = new Map();

    const pipeline = chain([
      readableStream,
      parser(),
      streamArray()
    ]);

    pipeline.on('data', ({ key, value }) => {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        rowCount++;
        for (const [colName, val] of Object.entries(value)) {
          if (!columnsMap.has(colName)) {
            columnsMap.set(colName, createColumnTracker(colName));
          }
          updateColumnTracker(columnsMap.get(colName), val);
        }
      }
    });

    pipeline.on('end', () => {
      const columns = Array.from(columnsMap.values()).map((c) =>
        finalizeColumnProfile(c, rowCount)
      );

      let totalMissing = 0;
      const typeSummary = { String: 0, Number: 0, Boolean: 0, Date: 0 };

      columns.forEach((col) => {
        totalMissing += col.missingCount;
        typeSummary[col.dataType] = (typeSummary[col.dataType] || 0) + 1;
      });

      const totalCells = rowCount * columns.length;
      const overallMissingPercentage = totalCells > 0
        ? Number(((totalMissing / totalCells) * 100).toFixed(2))
        : 0;

      resolve({
        totalRecords: rowCount,
        totalColumns: columns.length,
        columns,
        summary: {
          totalRecords: rowCount,
          totalColumns: columns.length,
          totalCells,
          missingCells: totalMissing,
          overallMissingPercentage,
          columnDataTypes: typeSummary
        }
      });
    });

    pipeline.on('error', async () => {
      // Fallback: Read whole file if it's an object wrapping an array (e.g. { data: [...] })
      try {
        const content = await fs.promises.readFile(filePath, 'utf8');
        const parsed = JSON.parse(content);
        const array = Array.isArray(parsed)
          ? parsed
          : parsed.data || parsed.records || parsed.items || [parsed];

        const fallbackResult = profileInMemoryRecords(array);
        resolve(fallbackResult);
      } catch (fallbackErr) {
        reject(new Error(`Failed to profile JSON: ${fallbackErr.message}`));
      }
    });
  });
};

/**
 * Profiles a JSON Lines (.jsonl) file
 */
const profileJsonLinesFile = async (filePath) => {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let rowCount = 0;
  const columnsMap = new Map();

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      const record = JSON.parse(trimmed);
      if (typeof record === 'object' && record !== null && !Array.isArray(record)) {
        rowCount++;
        for (const [colName, val] of Object.entries(record)) {
          if (!columnsMap.has(colName)) {
            columnsMap.set(colName, createColumnTracker(colName));
          }
          updateColumnTracker(columnsMap.get(colName), val);
        }
      }
    } catch {
      // Skip invalid JSON lines
    }
  }

  const columns = Array.from(columnsMap.values()).map((c) =>
    finalizeColumnProfile(c, rowCount)
  );

  let totalMissing = 0;
  const typeSummary = { String: 0, Number: 0, Boolean: 0, Date: 0 };

  columns.forEach((col) => {
    totalMissing += col.missingCount;
    typeSummary[col.dataType] = (typeSummary[col.dataType] || 0) + 1;
  });

  const totalCells = rowCount * columns.length;
  const overallMissingPercentage = totalCells > 0
    ? Number(((totalMissing / totalCells) * 100).toFixed(2))
    : 0;

  return {
    totalRecords: rowCount,
    totalColumns: columns.length,
    columns,
    summary: {
      totalRecords: rowCount,
      totalColumns: columns.length,
      totalCells,
      missingCells: totalMissing,
      overallMissingPercentage,
      columnDataTypes: typeSummary
    }
  };
};

/**
 * Helper to profile an array of in-memory object records
 */
const profileInMemoryRecords = (records) => {
  const rowCount = records.length;
  const columnsMap = new Map();

  for (const row of records) {
    if (typeof row === 'object' && row !== null) {
      for (const [colName, val] of Object.entries(row)) {
        if (!columnsMap.has(colName)) {
          columnsMap.set(colName, createColumnTracker(colName));
        }
        updateColumnTracker(columnsMap.get(colName), val);
      }
    }
  }

  const columns = Array.from(columnsMap.values()).map((c) =>
    finalizeColumnProfile(c, rowCount)
  );

  let totalMissing = 0;
  const typeSummary = { String: 0, Number: 0, Boolean: 0, Date: 0 };

  columns.forEach((col) => {
    totalMissing += col.missingCount;
    typeSummary[col.dataType] = (typeSummary[col.dataType] || 0) + 1;
  });

  const totalCells = rowCount * columns.length;
  const overallMissingPercentage = totalCells > 0
    ? Number(((totalMissing / totalCells) * 100).toFixed(2))
    : 0;

  return {
    totalRecords: rowCount,
    totalColumns: columns.length,
    columns,
    summary: {
      totalRecords: rowCount,
      totalColumns: columns.length,
      totalCells,
      missingCells: totalMissing,
      overallMissingPercentage,
      columnDataTypes: typeSummary
    }
  };
};

/**
 * Master profiler dispatch function
 */
const profileDataset = async (filePath, fileType = 'csv') => {
  const normalizedType = fileType.toLowerCase();

  if (normalizedType === 'csv') {
    return await profileCsvFile(filePath);
  } else if (normalizedType === 'json') {
    return await profileJsonFile(filePath, false);
  } else if (normalizedType === 'jsonl') {
    return await profileJsonFile(filePath, true);
  } else {
    // Default to CSV
    return await profileCsvFile(filePath);
  }
};

module.exports = {
  profileDataset,
  profileCsvFile,
  profileJsonFile,
  profileInMemoryRecords,
  detectValueType,
  isNullOrMissing
};
