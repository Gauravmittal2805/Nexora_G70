const http = require('http');
const mongoose = require('mongoose');
const app = require('../server');
const Dataset = require('../models/Dataset');
const Mapping = require('../models/Mapping');
const connectDB = require('../config/db');

/**
 * Test helper for HTTP requests against Express app
 */
function makeRequest(server, options, body = null) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const reqOptions = {
      hostname: '127.0.0.1',
      port: address.port,
      path: options.path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runMappingApiTests() {
  console.log('🧪 Starting Field Mapping Backend API End-to-End Tests...\n');

  // Ensure DB connected
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }

  // Start HTTP server on dynamic port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`📡 Test server running on http://127.0.0.1:${port}\n`);

  try {
    // 1. Find or create a test dataset in MongoDB
    let testDataset = await Dataset.findOne({ 'metadata.columns.0': { $exists: true } });
    let createdTempDataset = false;

    if (!testDataset) {
      console.log('Creating temporary test dataset in MongoDB...');
      testDataset = await Dataset.create({
        datasetId: 'test-dataset-mapping-001',
        name: 'Test Sales Dataset',
        fileName: 'test_sales.csv',
        fileType: 'csv',
        fileSize: 1024,
        storageUrl: 'https://example.com/test_sales.csv',
        metadata: {
          rowCount: 10,
          columnCount: 4,
          columns: [
            { name: 'product', dataType: 'string', nullCount: 0 },
            { name: 'price', dataType: 'number', nullCount: 0 },
            { name: 'category', dataType: 'string', nullCount: 0 },
            { name: 'order_date', dataType: 'date', nullCount: 0 }
          ]
        }
      });
      createdTempDataset = true;
    }

    const datasetId = testDataset.datasetId;
    console.log(`📊 Testing against Dataset: "${testDataset.name}" (ID: ${datasetId})`);
    const availableCols = (testDataset.metadata?.columns || []).map((c) => c.name);
    console.log(`   Available Columns: [${availableCols.join(', ')}]\n`);

    // Clean up any pre-existing mapping for this dataset to start clean
    await Mapping.deleteMany({ datasetId });

    // -------------------------------------------------------------------------
    // TEST 1: POST /api/mappings - Create valid field mapping
    // -------------------------------------------------------------------------
    console.log('▶ Test 1: POST /api/mappings - Create valid field-mapping configuration');
    const createPayload = {
      datasetId,
      name: 'E-Commerce Schema Mapping',
      description: 'Maps product sales data to centralized analytics schema',
      fieldMappings: [
        {
          sourceField: availableCols[0],
          targetField: 'item_title',
          targetType: 'string',
          transformation: 'trim',
          isRequired: true
        },
        {
          sourceField: availableCols[1],
          targetField: 'unit_amount',
          targetType: 'number',
          transformation: 'to_number',
          isRequired: true
        }
      ],
      targetRole: {
        target: 'unit_amount',
        id: '',
        numerical: [availableCols[1]],
        categorical: [availableCols[0]]
      }
    };

    const res1 = await makeRequest(server, { method: 'POST', path: '/api/mappings' }, createPayload);
    if (res1.statusCode !== 201) {
      throw new Error(`Test 1 Failed: Expected status 201, got ${res1.statusCode}: ${JSON.stringify(res1.data)}`);
    }
    if (!res1.data.success || !res1.data.mapping?.mappingId) {
      throw new Error('Test 1 Failed: Response missing mappingId');
    }
    const mappingId = res1.data.mapping.mappingId;
    console.log(`  ✅ Passed: Mapping created with ID: ${mappingId}`);
    console.log(`     Stored fields: ${res1.data.mapping.fieldMappings.length} mappings`);

    // -------------------------------------------------------------------------
    // TEST 2: GET /api/mappings/:datasetId - Retrieve mapping by datasetId
    // -------------------------------------------------------------------------
    console.log('\n▶ Test 2: GET /api/mappings/:datasetId - Retrieve mapping by datasetId');
    const res2 = await makeRequest(server, { method: 'GET', path: `/api/mappings/${datasetId}` });
    if (res2.statusCode !== 200) {
      throw new Error(`Test 2 Failed: Expected status 200, got ${res2.statusCode}: ${JSON.stringify(res2.data)}`);
    }
    if (!res2.data.success || res2.data.mapping.datasetId !== datasetId) {
      throw new Error('Test 2 Failed: Mapping datasetId mismatch');
    }
    if (res2.data.mapping.fieldMappings.length !== 2) {
      throw new Error(`Test 2 Failed: Expected 2 field mappings, got ${res2.data.mapping.fieldMappings.length}`);
    }
    console.log(`  ✅ Passed: Retrieved mapping for dataset "${res2.data.dataset?.name || datasetId}"`);

    // -------------------------------------------------------------------------
    // TEST 3: PUT /api/mappings/:datasetId - Update mapping configuration
    // -------------------------------------------------------------------------
    console.log('\n▶ Test 3: PUT /api/mappings/:datasetId - Update mapping configuration');
    const updatePayload = {
      name: 'E-Commerce Schema Mapping - V2 Updated',
      description: 'Updated field mapping configuration with category column included',
      fieldMappings: [
        {
          sourceField: availableCols[0],
          targetField: 'product_name',
          targetType: 'string',
          transformation: 'trim',
          isRequired: true
        },
        {
          sourceField: availableCols[1],
          targetField: 'selling_price',
          targetType: 'number',
          transformation: 'to_number',
          isRequired: true
        },
        ...(availableCols[2]
          ? [
              {
                sourceField: availableCols[2],
                targetField: 'category_label',
                targetType: 'string',
                transformation: 'uppercase',
                defaultValue: 'GENERAL'
              }
            ]
          : [])
      ]
    };

    const res3 = await makeRequest(server, { method: 'PUT', path: `/api/mappings/${datasetId}` }, updatePayload);
    if (res3.statusCode !== 200) {
      throw new Error(`Test 3 Failed: Expected status 200, got ${res3.statusCode}: ${JSON.stringify(res3.data)}`);
    }
    if (!res3.data.success || !res3.data.mapping.name.includes('V2 Updated')) {
      throw new Error('Test 3 Failed: Updated name not reflected');
    }
    console.log(`  ✅ Passed: Updated mapping successfully: "${res3.data.mapping.name}"`);

    // -------------------------------------------------------------------------
    // TEST 4: GET /api/mappings - List all mappings
    // -------------------------------------------------------------------------
    console.log('\n▶ Test 4: GET /api/mappings - List all field mappings');
    const res4 = await makeRequest(server, { method: 'GET', path: '/api/mappings?page=1&limit=5' });
    if (res4.statusCode !== 200) {
      throw new Error(`Test 4 Failed: Expected status 200, got ${res4.statusCode}`);
    }
    if (!res4.data.success || !Array.isArray(res4.data.mappings)) {
      throw new Error('Test 4 Failed: Response missing mappings array');
    }
    console.log(`  ✅ Passed: Found ${res4.data.total} total mappings in MongoDB`);

    // -------------------------------------------------------------------------
    // TEST 5: Negative - Reject non-existent source column
    // -------------------------------------------------------------------------
    console.log('\n▶ Test 5: Validation - Reject source column that does not exist in dataset');
    const invalidColPayload = {
      datasetId,
      name: 'Invalid Column Test',
      fieldMappings: [
        {
          sourceField: 'completely_fictional_column_xyz_99',
          targetField: 'target_col'
        }
      ]
    };
    const res5 = await makeRequest(server, { method: 'POST', path: '/api/mappings' }, invalidColPayload);
    if (res5.statusCode !== 400) {
      throw new Error(`Test 5 Failed: Expected status 400 for invalid column, got ${res5.statusCode}`);
    }
    if (res5.data.success !== false || !res5.data.message.includes('not exist')) {
      throw new Error(`Test 5 Failed: Expected error message to mention column does not exist, got: ${res5.data.message}`);
    }
    console.log(`  ✅ Passed: Correctly returned 400 Bad Request: "${res5.data.message}"`);

    // -------------------------------------------------------------------------
    // TEST 6: Negative - Prevent duplicate source fields
    // -------------------------------------------------------------------------
    console.log('\n▶ Test 6: Validation - Prevent duplicate source field mappings');
    const dupSourcePayload = {
      datasetId,
      name: 'Duplicate Source Test',
      fieldMappings: [
        { sourceField: availableCols[0], targetField: 'alias_one' },
        { sourceField: availableCols[0], targetField: 'alias_two' }
      ]
    };
    const res6 = await makeRequest(server, { method: 'POST', path: '/api/mappings' }, dupSourcePayload);
    if (res6.statusCode !== 400) {
      throw new Error(`Test 6 Failed: Expected status 400 for duplicate source, got ${res6.statusCode}`);
    }
    if (!res6.data.message.includes('Duplicate source field')) {
      throw new Error(`Test 6 Failed: Expected duplicate source error, got: ${res6.data.message}`);
    }
    console.log(`  ✅ Passed: Correctly caught duplicate source: "${res6.data.message}"`);

    // -------------------------------------------------------------------------
    // TEST 7: Negative - Prevent duplicate target fields
    // -------------------------------------------------------------------------
    console.log('\n▶ Test 7: Validation - Prevent duplicate target field mappings');
    const dupTargetPayload = {
      datasetId,
      name: 'Duplicate Target Test',
      fieldMappings: [
        { sourceField: availableCols[0], targetField: 'same_target_field' },
        { sourceField: availableCols[1], targetField: 'same_target_field' }
      ]
    };
    const res7 = await makeRequest(server, { method: 'POST', path: '/api/mappings' }, dupTargetPayload);
    if (res7.statusCode !== 400) {
      throw new Error(`Test 7 Failed: Expected status 400 for duplicate target, got ${res7.statusCode}`);
    }
    if (!res7.data.message.includes('Duplicate target field')) {
      throw new Error(`Test 7 Failed: Expected duplicate target error, got: ${res7.data.message}`);
    }
    console.log(`  ✅ Passed: Correctly caught duplicate target: "${res7.data.message}"`);

    // -------------------------------------------------------------------------
    // TEST 8: Negative - Prevent empty field mappings configuration
    // -------------------------------------------------------------------------
    console.log('\n▶ Test 8: Validation - Prevent empty field mappings array');
    const emptyPayload = {
      datasetId,
      fieldMappings: []
    };
    const res8 = await makeRequest(server, { method: 'POST', path: '/api/mappings' }, emptyPayload);
    if (res8.statusCode !== 400) {
      throw new Error(`Test 8 Failed: Expected status 400 for empty mappings, got ${res8.statusCode}`);
    }
    console.log(`  ✅ Passed: Correctly rejected empty mappings array: "${res8.data.message}"`);

    // -------------------------------------------------------------------------
    // TEST 9: Conflict check - Prevent duplicate mapping document on POST
    // -------------------------------------------------------------------------
    console.log('\n▶ Test 9: Validation - Prevent duplicate mapping document for same dataset');
    const dupDocPayload = {
      datasetId,
      fieldMappings: [
        { sourceField: availableCols[0], targetField: 'test_col' }
      ]
    };
    const res9 = await makeRequest(server, { method: 'POST', path: '/api/mappings' }, dupDocPayload);
    if (res9.statusCode !== 409) {
      throw new Error(`Test 9 Failed: Expected status 409 Conflict, got ${res9.statusCode}`);
    }
    console.log(`  ✅ Passed: Correctly returned 409 Conflict: "${res9.data.message}"`);

    // -------------------------------------------------------------------------
    // TEST 10: 404 for non-existent dataset
    // -------------------------------------------------------------------------
    console.log('\n▶ Test 10: Validation - Non-existent dataset ID returns 404');
    const nonExistentPayload = {
      datasetId: 'fictional-dataset-uuid-00000',
      fieldMappings: [
        { sourceField: 'colA', targetField: 'targetA' }
      ]
    };
    const res10 = await makeRequest(server, { method: 'POST', path: '/api/mappings' }, nonExistentPayload);
    if (res10.statusCode !== 404) {
      throw new Error(`Test 10 Failed: Expected status 404, got ${res10.statusCode}`);
    }
    console.log(`  ✅ Passed: Returned 404 Not Found for missing dataset: "${res10.data.message}"`);

    // -------------------------------------------------------------------------
    // TEST 11: DELETE /api/mappings/:datasetId - Cleanup mapping
    // -------------------------------------------------------------------------
    console.log('\n▶ Test 11: DELETE /api/mappings/:datasetId - Delete field mapping');
    const res11 = await makeRequest(server, { method: 'DELETE', path: `/api/mappings/${datasetId}` });
    if (res11.statusCode !== 200) {
      throw new Error(`Test 11 Failed: Expected status 200, got ${res11.statusCode}`);
    }
    console.log(`  ✅ Passed: Mapping deleted successfully`);

    // Clean up temporary dataset if created
    if (createdTempDataset) {
      await Dataset.deleteOne({ _id: testDataset._id });
    }

    console.log('\n🎉 ALL 11 FIELD MAPPING BACKEND API TESTS PASSED SUCCESSFULLY! 🚀');
  } finally {
    server.close();
  }
}

if (require.main === module) {
  runMappingApiTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('\n❌ Test Suite Failed:', err.message);
      process.exit(1);
    });
}

module.exports = runMappingApiTests;
