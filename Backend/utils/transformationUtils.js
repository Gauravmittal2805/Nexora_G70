/**
 * Basic Transformation Utility Module
 *
 * Pure, standalone utility functions for tabular/JSON record transformations:
 *  - Column renaming (renameColumns)
 *  - Column selection: include / exclude (selectColumns)
 *  - Basic data type conversions: String, Number, Date (toString, toNumber, toDate, convertValue, convertColumnTypes)
 *  - Composable pipeline runner (applyTransformations)
 *
 * Designed to work independently on single records or arrays of records
 * and integrate cleanly with Nexora backend controllers and transformationEngine.
 */

const VALID_TARGET_TYPES = Object.freeze({
  STRING: 'String',
  NUMBER: 'Number',
  DATE: 'Date'
});

const TYPE_ALIASES = {
  string: VALID_TARGET_TYPES.STRING,
  str: VALID_TARGET_TYPES.STRING,
  text: VALID_TARGET_TYPES.STRING,
  categorical: VALID_TARGET_TYPES.STRING,

  number: VALID_TARGET_TYPES.NUMBER,
  num: VALID_TARGET_TYPES.NUMBER,
  int: VALID_TARGET_TYPES.NUMBER,
  integer: VALID_TARGET_TYPES.NUMBER,
  float: VALID_TARGET_TYPES.NUMBER,
  double: VALID_TARGET_TYPES.NUMBER,
  decimal: VALID_TARGET_TYPES.NUMBER,
  numerical: VALID_TARGET_TYPES.NUMBER,

  date: VALID_TARGET_TYPES.DATE,
  datetime: VALID_TARGET_TYPES.DATE,
  timestamp: VALID_TARGET_TYPES.DATE
};

/**
 * Check if a value is a plain object (excluding null, Arrays, and Date instances)
 * @param {*} value
 * @returns {boolean}
 */
const isPlainObject = (value) =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  !(value instanceof Date);

/**
 * Helper to apply a single-record transformer to either one record or an array of records.
 * Returns a new object or new array without mutating the input.
 *
 * @param {Object|Array<Object>} data
 * @param {Function} recordFn
 * @returns {Object|Array<Object>}
 */
const mapDataRecords = (data, recordFn) => {
  if (Array.isArray(data)) {
    return data.map((item) => (isPlainObject(item) ? recordFn(item) : item));
  }
  if (isPlainObject(data)) {
    return recordFn(data);
  }
  return data;
};

// =============================================================================
// 1. Column Renaming
// =============================================================================

/**
 * Normalize rename mapping input into a plain { sourceName: targetName } object.
 * Supports:
 *  - Plain object: { old_name: 'new_name' }
 *  - Array of mapping items: [{ from: 'old', to: 'new' }] or [{ sourceField: 'old', targetField: 'new' }]
 *
 * @param {Object|Array<Object>} renameMap
 * @returns {Object<string, string>}
 */
const normalizeRenameMap = (renameMap) => {
  const normalized = {};

  if (!renameMap) return normalized;

  if (Array.isArray(renameMap)) {
    for (const item of renameMap) {
      if (!item || typeof item !== 'object') continue;
      const from = String(item.from ?? item.source ?? item.sourceField ?? '').trim();
      const to = String(item.to ?? item.target ?? item.targetField ?? '').trim();
      if (from && to) {
        normalized[from] = to;
      }
    }
    return normalized;
  }

  if (isPlainObject(renameMap)) {
    for (const [from, to] of Object.entries(renameMap)) {
      const src = String(from).trim();
      const dst = to !== null && to !== undefined ? String(to).trim() : '';
      if (src && dst) {
        normalized[src] = dst;
      }
    }
  }

  return normalized;
};

/**
 * Rename columns on a single record or an array of records.
 * Pure function: does not mutate input data.
 * Handles key swaps (e.g., { a: 'b', b: 'a' }) safely.
 *
 * @param {Object|Array<Object>} data - Record object or array of record objects
 * @param {Object|Array<Object>} renameMap - { oldName: 'newName' } or [{ sourceField, targetField }]
 * @param {Object} [options]
 * @param {boolean} [options.overwrite=true] - Whether renamed key overwrites an unmapped existing key with same name
 * @returns {Object|Array<Object>}
 */
const renameColumns = (data, renameMap = {}, options = {}) => {
  const map = normalizeRenameMap(renameMap);
  const overwrite = options.overwrite !== false;

  if (Object.keys(map).length === 0) {
    return mapDataRecords(data, (record) => ({ ...record }));
  }

  return mapDataRecords(data, (record) => {
    const renamed = {};
    const explicitlyRenamedTargets = new Set();

    // First pass: place renamed keys and track claimed target names
    for (const [key, value] of Object.entries(record)) {
      if (Object.prototype.hasOwnProperty.call(map, key)) {
        const targetKey = map[key];
        renamed[targetKey] = value;
        explicitlyRenamedTargets.add(targetKey);
      }
    }

    // Second pass: preserve key ordering cleanly while respecting overwrite rules
    const orderedResult = {};
    for (const [key, value] of Object.entries(record)) {
      if (Object.prototype.hasOwnProperty.call(map, key)) {
        const targetKey = map[key];
        orderedResult[targetKey] = renamed[targetKey];
      } else {
        const hasCollision = explicitlyRenamedTargets.has(key);
        if (!hasCollision || !overwrite) {
          orderedResult[key] = value;
        }
      }
    }

    return orderedResult;
  });
};

// =============================================================================
// 2. Column Selection (Include / Exclude)
// =============================================================================

/**
 * Normalize column selection specification into { include: string[]|null, exclude: Set<string>, includeMissing: boolean, defaultValue: * }
 *
 * Supported selectionConfig shapes:
 *  - Array of column names: ['id', 'name'] (treated as include)
 *  - { include: ['id', 'name'] }
 *  - { exclude: ['internalNotes'] }
 *  - { include: ['id', 'name', 'temp'], exclude: ['temp'] }
 *  - { mode: 'include'|'exclude', columns: [...] }
 *
 * @param {Array<string>|Object} selectionConfig
 * @returns {Object}
 */
const normalizeSelectionConfig = (selectionConfig) => {
  if (Array.isArray(selectionConfig)) {
    return {
      include: selectionConfig.map((c) => String(c).trim()).filter(Boolean),
      exclude: new Set(),
      includeMissing: false,
      defaultValue: null
    };
  }

  if (!isPlainObject(selectionConfig)) {
    return {
      include: null,
      exclude: new Set(),
      includeMissing: false,
      defaultValue: null
    };
  }

  let includeList = Array.isArray(selectionConfig.include)
    ? selectionConfig.include.map((c) => String(c).trim()).filter(Boolean)
    : null;

  let excludeList = Array.isArray(selectionConfig.exclude)
    ? selectionConfig.exclude.map((c) => String(c).trim()).filter(Boolean)
    : [];

  if (Array.isArray(selectionConfig.columns)) {
    const cols = selectionConfig.columns.map((c) => String(c).trim()).filter(Boolean);
    const mode = String(selectionConfig.mode || 'include').toLowerCase();
    if (mode === 'exclude') {
      excludeList = excludeList.concat(cols);
    } else {
      includeList = includeList ? includeList.concat(cols) : cols;
    }
  }

  return {
    include: includeList,
    exclude: new Set(excludeList),
    includeMissing: Boolean(selectionConfig.includeMissing),
    defaultValue: selectionConfig.defaultValue !== undefined ? selectionConfig.defaultValue : null
  };
};

/**
 * Select (include and/or exclude) columns from a single record or an array of records.
 * Pure function: does not mutate input data.
 *
 * @param {Object|Array<Object>} data - Record object or array of record objects
 * @param {Array<string>|Object} selectionConfig - Include/exclude configuration
 * @returns {Object|Array<Object>}
 */
const selectColumns = (data, selectionConfig = {}) => {
  const { include, exclude, includeMissing, defaultValue } = normalizeSelectionConfig(selectionConfig);

  return mapDataRecords(data, (record) => {
    const selected = {};

    if (include !== null) {
      for (const col of include) {
        if (exclude.has(col)) continue;
        if (Object.prototype.hasOwnProperty.call(record, col)) {
          selected[col] = record[col];
        } else if (includeMissing) {
          selected[col] = defaultValue;
        }
      }
      return selected;
    }

    for (const [key, value] of Object.entries(record)) {
      if (!exclude.has(key)) {
        selected[key] = value;
      }
    }

    return selected;
  });
};

// =============================================================================
// 3. Basic Data Type Conversions (String, Number, Date)
// =============================================================================

/**
 * Convert a value to String.
 *
 * @param {*} value
 * @param {Object} [options]
 * @param {string|null} [options.defaultValue=null] - Fallback for null/undefined/invalid Date
 * @param {boolean} [options.trim=false] - Trim whitespace on resulting string
 * @returns {string|null}
 */
const toString = (value, options = {}) => {
  const defaultValue = options.defaultValue !== undefined ? options.defaultValue : null;

  if (value === null || value === undefined) {
    return defaultValue;
  }

  let result;
  if (typeof value === 'string') {
    result = value;
  } else if (value instanceof Date) {
    if (isNaN(value.getTime())) {
      return defaultValue;
    }
    result = value.toISOString();
  } else if (typeof value === 'object') {
    result = JSON.stringify(value);
  } else {
    result = String(value);
  }

  return options.trim ? result.trim() : result;
};

/**
 * Convert a value to Number.
 * Handles numeric strings with whitespace, commas ("1,250.50"), currency ("$99.95"), and percentages ("85%").
 *
 * @param {*} value
 * @param {Object} [options]
 * @param {number|null} [options.defaultValue=null] - Fallback when value cannot be converted
 * @param {boolean} [options.strict=false] - Throw an Error if conversion fails on non-empty values
 * @returns {number|null}
 */
const toNumber = (value, options = {}) => {
  const defaultValue = options.defaultValue !== undefined ? options.defaultValue : null;

  if (value === null || value === undefined) {
    return defaultValue;
  }

  if (typeof value === 'number') {
    if (Number.isFinite(value)) return value;
    if (options.strict) {
      throw new Error(`Cannot convert non-finite number "${value}" to Number`);
    }
    return defaultValue;
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }

  if (value instanceof Date) {
    const ms = value.getTime();
    if (!isNaN(ms)) return ms;
    if (options.strict) {
      throw new Error('Cannot convert Invalid Date to Number');
    }
    return defaultValue;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return defaultValue;
    }

    const cleaned = trimmed
      .replace(/[$€£₹%]/g, '')
      .replace(/,/g, '')
      .trim();

    if (cleaned === '' || cleaned === '-' || cleaned === '+') {
      if (options.strict) {
        throw new Error(`Cannot convert string "${value}" to Number`);
      }
      return defaultValue;
    }

    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) {
      return parsed;
    }

    if (options.strict) {
      throw new Error(`Cannot convert string "${value}" to Number`);
    }
    return defaultValue;
  }

  if (options.strict) {
    throw new Error(`Cannot convert value of type "${typeof value}" to Number`);
  }
  return defaultValue;
};

/**
 * Parse common date formats safely into a valid Date instance.
 * Supports:
 *  - Date instances
 *  - Epoch millisecond numbers
 *  - ISO-8601 strings (e.g., "2026-11-25", "2026-11-25T10:30:00Z")
 *  - YYYY/MM/DD or YYYY.MM.DD
 *  - DD-MM-YYYY / DD/MM/YYYY (when day > 12) and MM/DD/YYYY
 *  - Standard JS Date.parse strings (e.g., "Nov 25, 2026")
 *
 * @param {*} value
 * @param {Object} [options]
 * @param {Date|string|null} [options.defaultValue=null] - Fallback when value cannot be converted
 * @param {boolean} [options.strict=false] - Throw an Error if conversion fails on non-empty values
 * @param {boolean} [options.asISOString=false] - Return ISO-8601 string instead of Date instance
 * @returns {Date|string|null}
 */
const toDate = (value, options = {}) => {
  const defaultValue = options.defaultValue !== undefined ? options.defaultValue : null;
  const formatOutput = (dateObj) => (options.asISOString ? dateObj.toISOString() : dateObj);

  if (value === null || value === undefined) {
    return defaultValue;
  }

  if (value instanceof Date) {
    if (!isNaN(value.getTime())) {
      return formatOutput(new Date(value.getTime()));
    }
    if (options.strict) {
      throw new Error('Cannot convert Invalid Date to Date');
    }
    return defaultValue;
  }

  if (typeof value === 'number') {
    if (Number.isFinite(value)) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        return formatOutput(parsed);
      }
    }
    if (options.strict) {
      throw new Error(`Cannot convert number "${value}" to Date`);
    }
    return defaultValue;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return defaultValue;
    }

    // Handle pure numeric timestamp strings (e.g., "1732531200000")
    if (/^-?\d+$/.test(trimmed)) {
      const ts = Number(trimmed);
      const parsed = new Date(ts);
      if (!isNaN(parsed.getTime())) {
        return formatOutput(parsed);
      }
    }

    // Handle YYYY-MM-DD, YYYY/MM/DD, or YYYY.MM.DD -> validate calendar date (UTC midnight)
    const ymdMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (ymdMatch) {
      const [, year, month, day] = ymdMatch;
      const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`;
      const parsed = new Date(iso);
      if (!isNaN(parsed.getTime()) && parsed.getUTCMonth() + 1 === Number(month) && parsed.getUTCDate() === Number(day)) {
        return formatOutput(parsed);
      }
      if (options.strict) {
        throw new Error(`Cannot convert string "${value}" to Date`);
      }
      return defaultValue;
    }

    // Handle DD-MM-YYYY or DD/MM/YYYY when first segment > 12 (unambiguous day-first)
    const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (dmyMatch) {
      const first = Number(dmyMatch[1]);
      const second = Number(dmyMatch[2]);
      const year = Number(dmyMatch[3]);
      let month;
      let day;

      if (first > 12 && second <= 12) {
        day = first;
        month = second;
      } else {
        month = first;
        day = second;
      }

      const iso = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00.000Z`;
      const parsed = new Date(iso);
      if (!isNaN(parsed.getTime()) && parsed.getUTCMonth() + 1 === month && parsed.getUTCDate() === day) {
        return formatOutput(parsed);
      }
      if (options.strict) {
        throw new Error(`Cannot convert string "${value}" to Date`);
      }
      return defaultValue;
    }

    // Fallback to standard Date parsing (handles ISO-8601 and RFC2822 strings)
    const timestamp = Date.parse(trimmed);
    if (!isNaN(timestamp)) {
      return formatOutput(new Date(timestamp));
    }

    if (options.strict) {
      throw new Error(`Cannot convert string "${value}" to Date`);
    }
    return defaultValue;
  }

  if (options.strict) {
    throw new Error(`Cannot convert value of type "${typeof value}" to Date`);
  }
  return defaultValue;
};

/**
 * Normalize a type name to one of: 'String', 'Number', 'Date'.
 * Returns null if unrecognized.
 *
 * @param {string} targetType
 * @returns {'String'|'Number'|'Date'|null}
 */
const normalizeTargetType = (targetType) => {
  if (!targetType || typeof targetType !== 'string') return null;
  return TYPE_ALIASES[targetType.trim().toLowerCase()] || null;
};

/**
 * Convert a single value to the specified basic data type ('String', 'Number', or 'Date').
 *
 * @param {*} value
 * @param {'String'|'Number'|'Date'|string} targetType
 * @param {Object} [options]
 * @returns {*}
 */
const convertValue = (value, targetType, options = {}) => {
  const canonicalType = normalizeTargetType(targetType);

  switch (canonicalType) {
    case VALID_TARGET_TYPES.STRING:
      return toString(value, options);
    case VALID_TARGET_TYPES.NUMBER:
      return toNumber(value, options);
    case VALID_TARGET_TYPES.DATE:
      return toDate(value, options);
    default:
      if (options.strict) {
        throw new Error(`Unsupported target data type "${targetType}". Supported types: String, Number, Date.`);
      }
      return value;
  }
};

/**
 * Convert column data types across a single record or an array of records.
 *
 * @param {Object|Array<Object>} data - Record object or array of records
 * @param {Object<string, string|Object>} typeMap - e.g., { age: 'Number', joinedAt: { type: 'Date', asISOString: true } }
 * @param {Object} [defaultOptions] - Shared options passed to each converter unless overridden per column
 * @returns {Object|Array<Object>}
 */
const convertColumnTypes = (data, typeMap = {}, defaultOptions = {}) => {
  if (!isPlainObject(typeMap) || Object.keys(typeMap).length === 0) {
    return mapDataRecords(data, (record) => ({ ...record }));
  }

  return mapDataRecords(data, (record) => {
    const result = { ...record };

    for (const [col, spec] of Object.entries(typeMap)) {
      if (!Object.prototype.hasOwnProperty.call(result, col)) continue;

      if (typeof spec === 'string') {
        result[col] = convertValue(result[col], spec, defaultOptions);
      } else if (isPlainObject(spec)) {
        const targetType = spec.type || spec.targetType || spec.dataType;
        const colOptions = { ...defaultOptions, ...spec };
        result[col] = convertValue(result[col], targetType, colOptions);
      }
    }

    return result;
  });
};

// =============================================================================
// 4. Composable Pipeline Helper (Backend Integration Ready)
// =============================================================================

/**
 * Apply a combined transformation config (column selection, column renaming, and type conversions)
 * to a single record or an array of records.
 *
 * Default execution order:
 *  1. select  (include / exclude columns)
 *  2. rename  (rename source columns to target columns)
 *  3. types   (convert column values to String, Number, Date)
 *
 * Alternatively, pass `config.steps` as an ordered array of step objects:
 *  [
 *    { action: 'select', include: [...] },
 *    { action: 'rename', map: { ... } },
 *    { action: 'convertTypes', types: { ... } }
 *  ]
 *
 * @param {Object|Array<Object>} data
 * @param {Object} [config]
 * @returns {Object|Array<Object>}
 */
const applyTransformations = (data, config = {}) => {
  if (!config || !isPlainObject(config)) {
    return mapDataRecords(data, (record) => ({ ...record }));
  }

  if (Array.isArray(config.steps)) {
    return config.steps.reduce((current, step) => {
      if (!step || typeof step !== 'object') return current;
      const action = String(step.action || step.type || '').toLowerCase();

      if (action === 'select' || action === 'selectcolumns') {
        return selectColumns(current, step.config || step);
      }
      if (action === 'rename' || action === 'renamecolumns') {
        return renameColumns(current, step.map || step.rename || step.columns || {}, step.options);
      }
      if (action === 'converttypes' || action === 'cast' || action === 'types') {
        return convertColumnTypes(current, step.types || step.columns || step.map || {}, step.options);
      }
      return current;
    }, data);
  }

  let result = mapDataRecords(data, (record) => ({ ...record }));

  if (config.select) {
    result = selectColumns(result, config.select);
  }

  if (config.rename) {
    result = renameColumns(result, config.rename, config.renameOptions);
  }

  if (config.types || config.cast) {
    result = convertColumnTypes(result, config.types || config.cast, config.typeOptions);
  }

  return result;
};

module.exports = {
  VALID_TARGET_TYPES,
  // Column renaming
  normalizeRenameMap,
  renameColumns,
  // Column selection
  normalizeSelectionConfig,
  selectColumns,
  // Basic data type conversion (String, Number, Date)
  toString,
  toNumber,
  toDate,
  normalizeTargetType,
  convertValue,
  convertColumnTypes,
  // Pipeline helper for backend integration
  applyTransformations
};
