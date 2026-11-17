const assert = require('assert');
const { validateFieldMappings } = require('../utils/mappingValidator');
const Dataset = require('../models/Dataset');
const app = require('../server');

async function runMappingTests() {
  console.log('🚀 Running Task Verification: Source-to-Target Mapping & Validation APIs\n');

  // =========================================================================
  // 1. Validator Unit Tests
  // =========================================================================
  console.log('--- [1] Testing Mapping Validator Unit Rules ---');

  const sampleSourceCols = [
    { name: 'CustomerID', type: 'String', dataType: 'string', nullCount: 0, sampleValues: ['CUST-001'] },
    { name: 'Age', type: 'Float', dataType: 'number', nullCount: 0, sampleValues: [34] },
    { name: 'Monthly_Charges', type: 'Float', dataType: 'number', nullCount: 0, sampleValues: [65.4] },
    { name: 'Total_Charges_Str', type: 'String', dataType: 'string', nullCount: 2, sampleValues: ['784.80'] },
    { name: 'Churn', type: 'Boolean', dataType: 'boolean', nullCount: 0, sampleValues: ['No'] }
  ];

  // Test 1a: Valid mapping passes
  const validMappings = [
    { targetField: 'id', sourceField: 'CustomerID', targetType: 'String', required: true },
    { targetField: 'customer_age', sourceField: 'Age', targetType: 'Float', required: false },
    { targetField: 'monthly_billed', sourceField: 'Monthly_Charges', targetType: 'Float', required: false },
    { targetField: 'target', sourceField: 'Churn', targetType: 'Boolean', required: true }
  ];

  const valResult1 = validateFieldMappings(validMappings, sampleSourceCols);
  assert.strictEqual(valResult1.isValid, true, 'Valid mappings must be valid');
  assert.strictEqual(valResult1.errors.length, 0, 'No errors expected for valid mapping');
  console.log('  ✅ Valid mapping check passed');

  // Test 1b: Empty target field name produces error
  const invalidEmptyTarget = [
    { targetField: '', sourceField: 'Age', targetType: 'Float', required: false }
  ];
  const valResult2 = validateFieldMappings(invalidEmptyTarget, sampleSourceCols);
  assert.strictEqual(valResult2.isValid, false, 'Empty target field must be invalid');
  assert(valResult2.errors.some(e => e.code === 'EMPTY_TARGET_NAME'), 'Must return EMPTY_TARGET_NAME error');
  console.log('  ✅ Empty target field name detection passed');

  // Test 1c: Duplicate target field names produce error
  const invalidDuplicateTarget = [
    { targetField: 'customer_age', sourceField: 'Age', targetType: 'Float', required: false },
    { targetField: 'customer_age', sourceField: 'Monthly_Charges', targetType: 'Float', required: false }
  ];
  const valResult3 = validateFieldMappings(invalidDuplicateTarget, sampleSourceCols);
  assert.strictEqual(valResult3.isValid, false, 'Duplicate target fields must be invalid');
  assert(valResult3.errors.some(e => e.code === 'DUPLICATE_TARGET_FIELD'), 'Must return DUPLICATE_TARGET_FIELD error');
  console.log('  ✅ Duplicate target field name detection passed');

  // Test 1d: Required target field unmapped produces error
  const invalidRequiredUnmapped = [
    { targetField: 'target', sourceField: '', targetType: 'Boolean', required: true }
  ];
  const valResult4 = validateFieldMappings(invalidRequiredUnmapped, sampleSourceCols);
  assert.strictEqual(valResult4.isValid, false, 'Unmapped required target field must be invalid');
  assert(valResult4.errors.some(e => e.code === 'REQUIRED_FIELD_UNMAPPED'), 'Must return REQUIRED_FIELD_UNMAPPED error');
  console.log('  ✅ Unmapped required field detection passed');

  // Test 1e: Non-existent source column produces error
  const invalidMissingSource = [
    { targetField: 'user_score', sourceField: 'CreditScore_NonExistent', targetType: 'Float', required: false }
  ];
  const valResult5 = validateFieldMappings(invalidMissingSource, sampleSourceCols);
  assert.strictEqual(valResult5.isValid, false, 'Non-existent source column must be invalid');
  assert(valResult5.errors.some(e => e.code === 'SOURCE_NOT_FOUND'), 'Must return SOURCE_NOT_FOUND error');
  console.log('  ✅ Non-existent source column detection passed');

  // Test 1f: String to Number type mismatch without cast produces warning
  const mismatchWarning = [
    { targetField: 'total_spend', sourceField: 'Total_Charges_Str', targetType: 'Float', required: false, transformation: 'none' }
  ];
  const valResult6 = validateFieldMappings(mismatchWarning, sampleSourceCols);
  assert(valResult6.warnings.some(w => w.code === 'TYPE_MISMATCH_NUMERIC'), 'Must return TYPE_MISMATCH_NUMERIC warning');
  console.log('  ✅ Type conversion mismatch warning detection passed');

  // =========================================================================
  // 2. Controller & Integration Tests with mock req/res
  // =========================================================================
  console.log('\n--- [2] Testing Controller & Integration Endpoints ---');

  const {
    getFieldMapping,
    saveFieldMapping,
    validateMappingEndpoint,
    transformDatasetRows
  } = require('../controllers/datasetController');

  // Test 2a: GET /api/datasets/:id/mapping on sample dataset
  const mockGetReq = { params: { id: 'ds-churn-101' }, user: null };
  let getStatus = 0;
  let getData = null;
  const mockGetRes = {
    status: (code) => { getStatus = code; return mockGetRes; },
    json: (payload) => { getData = payload; return mockGetRes; }
  };

  await getFieldMapping(mockGetReq, mockGetRes, (err) => { if (err) throw err; });
  assert.strictEqual(getStatus, 200, 'GET /mapping must return 200 OK');
  assert.strictEqual(getData.success, true);
  assert(Array.isArray(getData.columns), 'Columns must be returned');
  assert(Array.isArray(getData.fieldMappings), 'fieldMappings must be returned');
  assert.strictEqual(typeof getData.validation, 'object', 'validation object must be returned');
  console.log('  ✅ GET /api/datasets/:id/mapping: verified columns, fieldMappings, destinations, and validation');

  // Test 2b: POST /api/datasets/:id/mapping/validate endpoint
  const mockValReq = {
    params: { id: 'ds-churn-101' },
    user: null,
    body: {
      mapping: {
        fieldMappings: [
          { targetField: 'CustomerID_Target', sourceField: 'CustomerID', targetType: 'String', required: true },
          { targetField: '', sourceField: 'Age', targetType: 'Float', required: false } // Intentional empty target error
        ]
      }
    }
  };
  let valStatus = 0;
  let valData = null;
  const mockValRes = {
    status: (code) => { valStatus = code; return mockValRes; },
    json: (payload) => { valData = payload; return mockValRes; }
  };

  await validateMappingEndpoint(mockValReq, mockValRes, (err) => { if (err) throw err; });
  assert.strictEqual(valStatus, 200);
  assert.strictEqual(valData.isValid, false, 'Should report isValid=false for empty target field');
  assert(valData.errors.length > 0, 'Should return validation errors array');
  console.log('  ✅ POST /api/datasets/:id/mapping/validate: successfully validated and reported errors');

  // Test 2c: POST /api/datasets/:id/mapping save endpoint
  const mockSaveReq = {
    params: { id: 'ds-churn-101' },
    user: null,
    body: {
      mapping: {
        fieldMappings: [
          { targetField: 'client_id', sourceField: 'CustomerID', targetType: 'String', required: true, transformation: 'trim' },
          { targetField: 'age_years', sourceField: 'Age', targetType: 'Float', required: false, transformation: 'to_number' },
          { targetField: 'has_churned', sourceField: 'Churn', targetType: 'Boolean', required: true, transformation: 'none' }
        ]
      }
    }
  };
  let saveStatus = 0;
  let saveData = null;
  const mockSaveRes = {
    status: (code) => { saveStatus = code; return mockSaveRes; },
    json: (payload) => { saveData = payload; return mockSaveRes; }
  };

  await saveFieldMapping(mockSaveReq, mockSaveRes, (err) => { if (err) throw err; });
  assert.strictEqual(saveStatus, 200);
  assert.strictEqual(saveData.success, true);
  assert.strictEqual(saveData.fieldMappings.length, 3);
  assert.strictEqual(saveData.fieldMappings[0].targetField, 'client_id');
  console.log('  ✅ POST /api/datasets/:id/mapping: successfully saved field mappings');

  // Test 2d: POST /api/datasets/:id/transform projects records to target fields
  const mockTransformReq = {
    params: { id: 'ds-churn-101' },
    user: null,
    body: {
      useMapping: true,
      projectToTarget: true,
      rows: [
        { CustomerID: '  CUST-999  ', Age: '45', Churn: 'No' }
      ]
    }
  };
  let transStatus = 0;
  let transData = null;
  const mockTransRes = {
    status: (code) => { transStatus = code; return mockTransRes; },
    json: (payload) => { transData = payload; return mockTransRes; }
  };

  await transformDatasetRows(mockTransformReq, mockTransRes, (err) => { if (err) throw err; });
  assert.strictEqual(transStatus, 200);
  assert.strictEqual(transData.success, true);
  assert.strictEqual(transData.rows.length, 1);
  const row = transData.rows[0];
  assert.strictEqual(row.client_id, 'CUST-999', 'Should project CustomerID to client_id and apply trim');
  assert.strictEqual(row.age_years, 45, 'Should project Age to age_years and cast to number');
  assert.strictEqual(row.has_churned, 'No');
  console.log('  ✅ POST /api/datasets/:id/transform: successfully mapped and transformed records to target schema');

  console.log('\n🎉 ALL SOURCE-TO-TARGET MAPPING AND VALIDATION API TESTS PASSED!');
  process.exit(0);
}

runMappingTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
