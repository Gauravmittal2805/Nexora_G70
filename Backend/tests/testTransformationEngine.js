const assert = require('assert');
const {
  trimWhitespace,
  toUpperCase,
  toLowerCase,
  stringToNumber,
  removeEmptyValues,
  isEmpty,
  normalizeConfig,
  transformRecord,
  transformDataset,
  generateTransformConfigFromMapping,
  applyMappingAndTransformations
} = require('../utils/transformationEngine');

async function runTransformationTests() {
  console.log('🚀 Running Task Verification: Transformation Engine Foundation\n');

  // =========================================================================
  // 1. Basic Transformation Functions
  // =========================================================================
  console.log('--- [1] Testing Basic Transformation Functions ---');

  // 1a. Trim Whitespace
  assert.strictEqual(trimWhitespace('  hello world  '), 'hello world', 'Should trim leading and trailing spaces');
  assert.strictEqual(trimWhitespace('\t\n Nexora AI \r\n'), 'Nexora AI', 'Should trim tabs and newlines');
  assert.strictEqual(trimWhitespace(null), null, 'Null should return null');
  assert.strictEqual(trimWhitespace(undefined), undefined, 'Undefined should return undefined');
  assert.strictEqual(trimWhitespace(12345), 12345, 'Numbers should pass through untransformed');
  console.log('  ✅ trimWhitespace: passed all string, whitespace, and non-string tests');

  // 1b. Convert to Uppercase
  assert.strictEqual(toUpperCase('active'), 'ACTIVE', 'Should convert to uppercase');
  assert.strictEqual(toUpperCase('month-to-month'), 'MONTH-TO-MONTH');
  assert.strictEqual(toUpperCase(null), null);
  assert.strictEqual(toUpperCase(undefined), undefined);
  console.log('  ✅ toUpperCase: passed uppercase conversion tests');

  // 1c. Convert to Lowercase
  assert.strictEqual(toLowerCase('ONLINE'), 'online', 'Should convert to lowercase');
  assert.strictEqual(toLowerCase('Customer_ID'), 'customer_id');
  assert.strictEqual(toLowerCase(null), null);
  assert.strictEqual(toLowerCase(undefined), undefined);
  console.log('  ✅ toLowerCase: passed lowercase conversion tests');

  // 1d. Convert String to Number
  assert.strictEqual(stringToNumber('42'), 42, 'Integer string should convert to integer');
  assert.strictEqual(stringToNumber('-15'), -15, 'Negative integer should parse correctly');
  assert.strictEqual(stringToNumber('99.95'), 99.95, 'Float string should convert to float');
  assert.strictEqual(stringToNumber('1,250,500.50'), 1250500.5, 'Formatted number with commas should parse correctly');
  assert.strictEqual(stringToNumber('$149.99'), 149.99, 'Currency strings with $ should parse correctly');
  assert.strictEqual(stringToNumber(' 85.5% '), 85.5, 'Percentages should parse correctly');
  assert.strictEqual(stringToNumber(''), null, 'Empty string should default to null');
  assert.strictEqual(stringToNumber('N/A', { defaultValue: 0 }), 0, 'Unparseable string should return custom defaultValue');
  assert.strictEqual(stringToNumber(100), 100, 'Existing numbers should pass through');
  assert.strictEqual(stringToNumber(true), 1, 'Boolean true should convert to 1');
  assert.strictEqual(stringToNumber(false), 0, 'Boolean false should convert to 0');
  console.log('  ✅ stringToNumber: passed integer, float, currency, comma, and fallback tests');

  // 1e. Remove Empty Values
  const dirtyRecord = {
    id: 'CUST-101',
    name: 'Alice',
    email: '',
    phone: '   ',
    secondaryContact: null,
    metadata: undefined,
    score: 0, // 0 is a valid number, not empty!
    active: false // false is a valid boolean, not empty!
  };
  const cleaned = removeEmptyValues(dirtyRecord);
  assert.deepStrictEqual(cleaned, {
    id: 'CUST-101',
    name: 'Alice',
    score: 0,
    active: false
  }, 'Should omit null, undefined, and empty string fields while preserving 0 and false');

  const dirtyArray = ['apple', '', null, 'banana', undefined, '   '];
  assert.deepStrictEqual(removeEmptyValues(dirtyArray), ['apple', 'banana'], 'Should filter empty array items');
  console.log('  ✅ removeEmptyValues: passed object and array empty-value filtering\n');

  // =========================================================================
  // 2. Common Transformation Configuration Format
  // =========================================================================
  console.log('--- [2] Testing Common Transformation Configuration Format ---');

  const rawConfig = {
    columns: {
      fullName: ['trim', 'uppercase'],
      annualSalary: ['trim', 'toNumber'],
      status: 'lowercase'
    },
    options: {
      removeEmptyValues: true,
      trimAllStrings: true
    }
  };

  const normalized = normalizeConfig(rawConfig);
  assert(normalized.columns.fullName, 'Normalized config must include fullName column');
  assert.deepStrictEqual(normalized.columns.fullName, ['trim', 'uppercase']);
  assert.deepStrictEqual(normalized.columns.annualSalary, ['trim', 'toNumber']);
  assert.deepStrictEqual(normalized.columns.status, ['lowercase'], 'Single string op should normalize to array');
  assert.strictEqual(normalized.options.removeEmptyValues, true);
  assert.strictEqual(normalized.options.trimAllStrings, true);

  // Also test array rule format: [{ field: 'col1', operations: [...] }]
  const arrayConfig = {
    rules: [
      { field: 'category', operations: ['trim', 'uppercase'] }
    ]
  };
  const normalizedFromRules = normalizeConfig(arrayConfig);
  assert.deepStrictEqual(normalizedFromRules.columns.category, ['trim', 'uppercase']);
  console.log('  ✅ Common config format: validated object mapping and array rule normalization\n');

  // =========================================================================
  // 3. Apply Multiple Transformations to a Single Record
  // =========================================================================
  console.log('--- [3] Testing Multi-Transformation on Single Record ---');

  const rawRecord = {
    customer_id: '  CUST-7021  ',
    full_name: '  john doe  ',
    contract_type: 'month-to-month',
    monthly_charges: '  $65.40  ',
    notes: '   ',
    churn: 'No'
  };

  const transformConfig = {
    columns: {
      customer_id: ['trim', 'uppercase'],
      full_name: ['trim', 'uppercase'],
      contract_type: ['trim', 'uppercase'],
      monthly_charges: ['trim', 'toNumber']
    },
    options: {
      removeEmptyValues: true
    }
  };

  const transformedRecord = transformRecord(rawRecord, transformConfig);

  // Verify chained operations on single fields
  assert.strictEqual(transformedRecord.customer_id, 'CUST-7021', 'Should be trimmed and uppercase');
  assert.strictEqual(transformedRecord.full_name, 'JOHN DOE', 'Should be trimmed and uppercase');
  assert.strictEqual(transformedRecord.contract_type, 'MONTH-TO-MONTH', 'Should be uppercase');
  assert.strictEqual(transformedRecord.monthly_charges, 65.4, 'Should be parsed to numeric 65.40');
  assert.strictEqual('notes' in transformedRecord, false, 'Empty notes field should be removed by options.removeEmptyValues');
  assert.strictEqual(transformedRecord.churn, 'No', 'Unconfigured column churn should pass through safely');

  // Verify immutability (original record is untouched)
  assert.strictEqual(rawRecord.full_name, '  john doe  ', 'Original record must remain immutable');
  console.log('  ✅ transformRecord: successfully applied chained transformations to record fields');
  console.log('  ✅ Immutability verified: original record was not mutated\n');

  // =========================================================================
  // 4. Connect Transformation Module with Field-Mapping Configuration
  // =========================================================================
  console.log('--- [4] Testing Integration with Field Mapping Configuration ---');

  const sampleMapping = {
    target: 'Churn',
    id: 'CustomerID',
    numerical: ['Age', 'Tenure_Months', 'Monthly_Charges', 'Total_Charges'],
    categorical: ['Gender', 'Contract_Type'],
    datetime: ['Signup_Date'],
    ignored: ['Internal_Notes', 'Agent_Code']
  };

  const derivedConfig = generateTransformConfigFromMapping(sampleMapping);

  // Check automated derivation:
  assert.deepStrictEqual(derivedConfig.columns.Age, ['trim', 'toNumber'], 'Numerical fields must have trim and toNumber');
  assert.deepStrictEqual(derivedConfig.columns.Monthly_Charges, ['trim', 'toNumber']);
  assert.deepStrictEqual(derivedConfig.columns.Gender, ['trim'], 'Categorical fields must have trim');
  assert.deepStrictEqual(derivedConfig.columns.CustomerID, ['trim'], 'ID field must have trim');
  assert.deepStrictEqual(derivedConfig.columns.Churn, ['trim'], 'Target field must have trim');

  // Test applyMappingAndTransformations with ignored fields exclusion
  const sampleCustomerRecord = {
    CustomerID: '  CUST-8842  ',
    Age: '  52  ',
    Gender: '  Male  ',
    Tenure_Months: '48',
    Monthly_Charges: ' $98.20 ',
    Total_Charges: ' 4,713.60 ',
    Contract_Type: ' Two year ',
    Signup_Date: ' 2022-01-15 ',
    Churn: ' No ',
    Internal_Notes: 'Confidential CRM remark',
    Agent_Code: 'AG-99'
  };

  const mappedAndTransformed = applyMappingAndTransformations(sampleCustomerRecord, sampleMapping);

  assert.strictEqual(mappedAndTransformed.CustomerID, 'CUST-8842');
  assert.strictEqual(mappedAndTransformed.Age, 52, 'Age must be converted to number 52');
  assert.strictEqual(mappedAndTransformed.Gender, 'Male');
  assert.strictEqual(mappedAndTransformed.Tenure_Months, 48);
  assert.strictEqual(mappedAndTransformed.Monthly_Charges, 98.2);
  assert.strictEqual(mappedAndTransformed.Total_Charges, 4713.6, 'Total_Charges with commas must be numeric 4713.6');
  assert.strictEqual(mappedAndTransformed.Contract_Type, 'Two year');
  assert.strictEqual(mappedAndTransformed.Signup_Date, '2022-01-15');
  assert.strictEqual(mappedAndTransformed.Churn, 'No');

  // Ignored fields should be excluded from output
  assert.strictEqual('Internal_Notes' in mappedAndTransformed, false, 'Ignored Internal_Notes must be excluded');
  assert.strictEqual('Agent_Code' in mappedAndTransformed, false, 'Ignored Agent_Code must be excluded');
  console.log('  ✅ Field mapping rules auto-generated and applied cleanly');
  console.log('  ✅ Ignored columns successfully omitted from pipeline output\n');

  // =========================================================================
  // 5. Test Batch Dataset Transformations on Sample CSV & JSON Records
  // =========================================================================
  console.log('--- [5] Testing Transformations on Sample CSV and JSON Records ---');

  // 5a. Telecom Churn CSV Sample Records
  const csvRecords = [
    { CustomerID: ' CUST-1 ', Age: ' 29 ', Monthly_Charges: ' $79.85 ', Churn: ' yes ' },
    { CustomerID: ' CUST-2 ', Age: ' 41 ', Monthly_Charges: ' $54.10 ', Churn: ' no ' },
    { CustomerID: ' CUST-3 ', Age: ' 63 ', Monthly_Charges: ' $104.90 ', Churn: ' yes ' }
  ];

  const csvMapping = {
    id: 'CustomerID',
    target: 'Churn',
    numerical: ['Age', 'Monthly_Charges'],
    categorical: [],
    ignored: []
  };

  const transformedCsvBatch = transformDataset(
    csvRecords,
    generateTransformConfigFromMapping(csvMapping, {
      columns: {
        Churn: ['trim', 'uppercase'] // Custom override: ensure target is uppercase
      }
    })
  );

  assert.strictEqual(transformedCsvBatch.length, 3);
  assert.strictEqual(transformedCsvBatch[0].CustomerID, 'CUST-1');
  assert.strictEqual(transformedCsvBatch[0].Age, 29);
  assert.strictEqual(transformedCsvBatch[0].Monthly_Charges, 79.85);
  assert.strictEqual(transformedCsvBatch[0].Churn, 'YES', 'Target should be uppercase YES');
  console.log('  ✅ Sample CSV batch transformation verified with numeric conversion and uppercase target.');

  // 5b. IoT Telemetry JSON Sample Records
  const jsonRecords = [
    { device_id: ' dev-101 ', temperature_c: '22.4', humidity_pct: '45.2', status: ' online ', alert: 'false' },
    { device_id: ' dev-102 ', temperature_c: '28.1', humidity_pct: '60.5', status: ' online ', alert: 'false' },
    { device_id: ' dev-103 ', temperature_c: '35.8', humidity_pct: '82.0', status: ' warning ', alert: 'true' }
  ];

  const jsonConfig = {
    columns: {
      device_id: ['trim', 'uppercase'],
      temperature_c: ['trim', 'toNumber'],
      humidity_pct: ['trim', 'toNumber'],
      status: ['trim', 'uppercase']
    }
  };

  const transformedJsonBatch = transformDataset(jsonRecords, jsonConfig);
  assert.strictEqual(transformedJsonBatch[0].device_id, 'DEV-101');
  assert.strictEqual(transformedJsonBatch[0].temperature_c, 22.4);
  assert.strictEqual(transformedJsonBatch[0].humidity_pct, 45.2);
  assert.strictEqual(transformedJsonBatch[0].status, 'ONLINE');
  assert.strictEqual(transformedJsonBatch[2].status, 'WARNING');
  console.log('  ✅ Sample JSON batch transformation verified with IoT device telemetry records.\n');

  console.log('🎉 ALL 6 TRANSFORMATION ENGINE REQUIREMENTS VERIFIED AND PASSED SUCCESSFULLY!\n');
  process.exit(0);
}

runTransformationTests().catch((err) => {
  console.error('❌ Transformation Engine test failed:', err);
  process.exit(1);
});
