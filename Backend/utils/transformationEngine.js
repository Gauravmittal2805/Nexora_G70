/**
 * Transformation Engine Module for Nexora
 *
 * Provides core transformation primitives, multi-step pipeline execution on records,
 * and seamless integration with dataset field-mapping configurations.
 */

// =============================================================================
// 1. Basic Transformation Functions
// =============================================================================

/**
 * Trim leading and trailing whitespace from string values
 * @param {*} value
 * @returns {*}
 */
const trimWhitespace = (value) => {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (value === null || value === undefined) {
    return value;
  }
  return value;
};

/**
 * Convert string value to uppercase
 * @param {*} value
 * @returns {*}
 */
const toUpperCase = (value) => {
  if (typeof value === 'string') {
    return value.toUpperCase();
  }
  if (value === null || value === undefined) {
    return value;
  }
  return String(value).toUpperCase();
};

/**
 * Convert string value to lowercase
 * @param {*} value
 * @returns {*}
 */
const toLowerCase = (value) => {
  if (typeof value === 'string') {
    return value.toLowerCase();
  }
  if (value === null || value === undefined) {
    return value;
  }
  return String(value).toLowerCase();
};

/**
 * Convert string or primitive value to number (integer or float)
 * Handles commas in numbers (e.g. "1,234.56"), currency symbols ("$100"), percentages ("85%")
 *
 * @param {*} value
 * @param {Object} [options]
 * @param {number|null} [options.defaultValue=null] - Value returned if parsing fails
 * @param {boolean} [options.strict=false] - If true, throws Error on unparseable values
 * @returns {number|null}
 */
const stringToNumber = (value, options = {}) => {
  const defaultValue = options.defaultValue !== undefined ? options.defaultValue : null;

  if (typeof value === 'number') {
    return isNaN(value) ? defaultValue : value;
  }
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }

  if (typeof value === 'string') {
    // Clean currency symbols, commas, and percentage signs
    const cleaned = value
      .trim()
      .replace(/[$€£₹%]/g, '')
      .replace(/,/g, '');

    if (cleaned === '' || cleaned === '-' || cleaned === '+') {
      return defaultValue;
    }

    const num = Number(cleaned);
    if (!isNaN(num)) {
      return num;
    }

    if (options.strict) {
      throw new Error(`Cannot convert string "${value}" to number`);
    }
    return defaultValue;
  }

  return defaultValue;
};

/**
 * Check if a value is considered "empty" (null, undefined, or empty/whitespace-only string)
 * @param {*} value
 * @returns {boolean}
 */
const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  return false;
};

/**
 * Remove empty values
 * - If applied to an Object (record): returns a new object with empty keys omitted
 * - If applied to an Array: returns array with empty elements filtered out
 * - If applied to a single value: returns null if empty, otherwise returns the value
 *
 * @param {*} target
 * @returns {*}
 */
const removeEmptyValues = (target) => {
  if (target === null || target === undefined) {
    return null;
  }

  if (Array.isArray(target)) {
    return target
      .filter((item) => !isEmpty(item))
      .map((item) => (typeof item === 'object' ? removeEmptyValues(item) : item));
  }

  if (typeof target === 'object' && !(target instanceof Date)) {
    const result = {};
    for (const [key, val] of Object.entries(target)) {
      if (!isEmpty(val)) {
        if (typeof val === 'object' && val !== null && !(val instanceof Date)) {
          const nested = removeEmptyValues(val);
          if (nested !== null && (typeof nested !== 'object' || Object.keys(nested).length > 0)) {
            result[key] = nested;
          }
        } else {
          result[key] = val;
        }
      }
    }
    return result;
  }

  return isEmpty(target) ? null : target;
};

// Map of canonical operation names to transformation functions
const TRANSFORMATION_REGISTRY = {
  trim: trimWhitespace,
  trimwhitespace: trimWhitespace,
  trim_whitespace: trimWhitespace,

  uppercase: toUpperCase,
  touppercase: toUpperCase,
  to_uppercase: toUpperCase,

  lowercase: toLowerCase,
  tolowercase: toLowerCase,
  to_lowercase: toLowerCase,

  number: stringToNumber,
  tonumber: stringToNumber,
  stringtonumber: stringToNumber,
  string_to_number: stringToNumber,

  removeempty: removeEmptyValues,
  removeemptyvalues: removeEmptyValues,
  remove_empty_values: removeEmptyValues
};

// =============================================================================
// 2. Common Transformation Configuration Format
// =============================================================================

/**
 * Normalize and validate a transformation configuration object
 *
 * Standard Configuration Schema:
 * {
 *   columns: {
 *     "columnName": ["trim", "uppercase"],
 *     "salary": [{ type: "toNumber", defaultValue: 0 }]
 *   },
 *   options: {
 *     removeEmptyValues: false,
 *     trimAllStrings: false,
 *     dropUnconfiguredColumns: false
 *   }
 * }
 *
 * @param {Object} rawConfig
 * @returns {Object} Normalized transformation configuration
 */
const normalizeConfig = (rawConfig = {}) => {
  const normalized = {
    columns: {},
    options: {
      removeEmptyValues: Boolean(rawConfig.options?.removeEmptyValues),
      trimAllStrings: Boolean(rawConfig.options?.trimAllStrings),
      dropUnconfiguredColumns: Boolean(rawConfig.options?.dropUnconfiguredColumns)
    }
  };

  // Support config.columns as an object: { colName: ['trim', 'uppercase'] }
  if (rawConfig.columns && typeof rawConfig.columns === 'object' && !Array.isArray(rawConfig.columns)) {
    for (const [col, ops] of Object.entries(rawConfig.columns)) {
      normalized.columns[col] = Array.isArray(ops) ? ops : [ops];
    }
  }

  // Support config.rules as an array: [ { column: 'name', operations: ['trim'] } ]
  if (Array.isArray(rawConfig.rules)) {
    for (const rule of rawConfig.rules) {
      const col = rule.column || rule.field;
      if (col) {
        const ops = rule.operations || rule.transformations || [];
        normalized.columns[col] = Array.isArray(ops) ? ops : [ops];
      }
    }
  }

  // Support config.transformations array format: [ { field: 'name', type: 'uppercase' } ]
  if (Array.isArray(rawConfig.transformations)) {
    for (const item of rawConfig.transformations) {
      const col = item.column || item.field;
      if (col) {
        if (!normalized.columns[col]) normalized.columns[col] = [];
        normalized.columns[col].push(item.operation || item.type || item);
      }
    }
  }

  return normalized;
};

// =============================================================================
// 3. Apply Multiple Transformations to Single Record
// =============================================================================

/**
 * Apply a single transformation operation to a field value
 * @param {*} value
 * @param {string|Object|Function} operation
 * @returns {*} Transformed value
 */
const applyOperation = (value, operation) => {
  if (typeof operation === 'function') {
    return operation(value);
  }

  let opName = '';
  let opParams = {};

  if (typeof operation === 'string') {
    opName = operation.toLowerCase().trim();
  } else if (typeof operation === 'object' && operation !== null) {
    opName = (operation.type || operation.operation || operation.name || '').toLowerCase().trim();
    opParams = operation.params || operation.options || operation;
  }

  const fn = TRANSFORMATION_REGISTRY[opName];
  if (!fn) {
    // Unregistered custom transformation name: return value untouched
    return value;
  }

  if (opName.includes('number')) {
    return fn(value, opParams);
  }

  return fn(value);
};

/**
 * Apply multiple transformations to a single record
 * Pure function: does not mutate the input record.
 *
 * @param {Object} record - Plain object representing a single row/item
 * @param {Object} config - Normalized or raw transformation configuration
 * @returns {Object} Transformed record
 */
const transformRecord = (record, config = {}) => {
  if (!record || typeof record !== 'object') {
    return record;
  }

  const parsedConfig = normalizeConfig(config);
  const result = { ...record };

  // Step 1: Optional global trim for all string values
  if (parsedConfig.options.trimAllStrings) {
    for (const key of Object.keys(result)) {
      if (typeof result[key] === 'string') {
        result[key] = result[key].trim();
      }
    }
  }

  // Step 2: Apply column-specific transformation pipelines in order
  for (const [col, operations] of Object.entries(parsedConfig.columns)) {
    if (Object.prototype.hasOwnProperty.call(result, col)) {
      let currentVal = result[col];

      for (const op of operations) {
        currentVal = applyOperation(currentVal, op);
      }

      result[col] = currentVal;
    }
  }

  // Step 3: Optional removal of unconfigured columns
  if (parsedConfig.options.dropUnconfiguredColumns) {
    const configuredCols = new Set(Object.keys(parsedConfig.columns));
    for (const key of Object.keys(result)) {
      if (!configuredCols.has(key)) {
        delete result[key];
      }
    }
  }

  // Step 4: Optional global empty-value cleanup
  if (parsedConfig.options.removeEmptyValues) {
    return removeEmptyValues(result);
  }

  return result;
};

/**
 * Apply transformations to an array of records (batch / dataset)
 *
 * @param {Array<Object>} records - Array of row objects
 * @param {Object} config - Transformation configuration
 * @returns {Array<Object>} Transformed records
 */
const transformDataset = (records = [], config = {}) => {
  if (!Array.isArray(records)) {
    return [];
  }
  return records.map((record) => transformRecord(record, config));
};

// =============================================================================
// 4. Connect Transformation Module with Field-Mapping Configuration
// =============================================================================

/**
 * Generate a complete transformation configuration from a dataset's field mapping
 *
 * Mapping Schema:
 * {
 *   target: 'Churn',
 *   id: 'CustomerID',
 *   numerical: ['Age', 'Tenure_Months', 'Monthly_Charges'],
 *   categorical: ['Gender', 'Contract_Type'],
 *   datetime: ['JoinedDate'],
 *   ignored: ['Notes']
 * }
 *
 * Rules automatically established:
 * - Numerical columns: ['trim', 'toNumber']
 * - Categorical columns: ['trim'] (plus optional normalization)
 * - ID columns: ['trim']
 * - Target column: ['trim'] (or cast to number if in numerical)
 * - Ignored columns: dropped or marked
 *
 * @param {Object} mapping - Dataset field mapping
 * @param {Object} [overrides] - Custom overrides per column or options
 * @returns {Object} Ready-to-use transformation configuration
 */
const generateTransformConfigFromMapping = (mapping = {}, overrides = {}) => {
  const config = {
    columns: {},
    options: {
      removeEmptyValues: overrides.removeEmptyValues ?? false,
      trimAllStrings: overrides.trimAllStrings ?? true,
      excludeIgnored: overrides.excludeIgnored ?? true
    }
  };

  // 1. Numerical predictors: trim and convert string to number
  if (Array.isArray(mapping.numerical)) {
    for (const col of mapping.numerical) {
      config.columns[col] = ['trim', 'toNumber'];
    }
  }

  // 2. Categorical predictors: trim whitespace
  if (Array.isArray(mapping.categorical)) {
    for (const col of mapping.categorical) {
      config.columns[col] = ['trim'];
    }
  }

  // 3. Datetime predictors: trim whitespace
  if (Array.isArray(mapping.datetime)) {
    for (const col of mapping.datetime) {
      config.columns[col] = ['trim'];
    }
  }

  // 4. Entity Key / Primary ID: trim whitespace
  if (mapping.id) {
    config.columns[mapping.id] = ['trim'];
  }

  // 5. Prediction Target: trim whitespace (and number cast if target is numeric)
  if (mapping.target) {
    const isTargetNumeric = Array.isArray(mapping.numerical) && mapping.numerical.includes(mapping.target);
    config.columns[mapping.target] = isTargetNumeric ? ['trim', 'toNumber'] : ['trim'];
  }

  // 6. Merge custom overrides provided by user
  if (overrides.columns) {
    for (const [col, ops] of Object.entries(overrides.columns)) {
      config.columns[col] = Array.isArray(ops) ? ops : [ops];
    }
  }

  return normalizeConfig(config);
};

/**
 * Apply field-mapping roles and column transformations to a single record
 * Handles feature extraction and exclusion of ignored fields.
 *
 * @param {Object} record - Input record
 * @param {Object} mapping - Dataset field mapping
 * @param {Object} [customOverrides] - Custom transformation overrides
 * @returns {Object} Transformed and mapped record
 */
const applyMappingAndTransformations = (record, mapping = {}, customOverrides = {}) => {
  if (!record || typeof record !== 'object') {
    return record;
  }

  // Generate transformation configuration aligned with mapping roles
  const config = generateTransformConfigFromMapping(mapping, customOverrides);

  // Apply transformations
  const transformed = transformRecord(record, config);

  // Exclude ignored columns if configured
  if (customOverrides.excludeIgnored !== false && Array.isArray(mapping.ignored)) {
    for (const ignoredCol of mapping.ignored) {
      delete transformed[ignoredCol];
    }
  }

  return transformed;
};

module.exports = {
  // Basic transformation functions
  trimWhitespace,
  toUpperCase,
  toLowerCase,
  stringToNumber,
  removeEmptyValues,
  isEmpty,

  // Common registry and normalization
  TRANSFORMATION_REGISTRY,
  normalizeConfig,

  // Record and dataset transformations
  transformRecord,
  transformDataset,

  // Field mapping integration
  generateTransformConfigFromMapping,
  applyMappingAndTransformations
};
