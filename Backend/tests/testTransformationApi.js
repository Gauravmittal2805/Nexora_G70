const assert = require('assert');
const http = require('http');
const mongoose = require('mongoose');
const app = require('../server');

function requestJson(server, method, path, body = null) {
  return new Promise((resolve, reject) => {
    const { port } = server.address();
    const payload = body !== null ? JSON.stringify(body) : null;

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
        }
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          let data;
          try {
            data = JSON.parse(raw);
          } catch {
            data = raw;
          }
          resolve({ statusCode: res.statusCode, data });
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runApiTests() {
  console.log('Running Backend Transformation API Integration Tests...\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

  try {
    // =======================================================================
    // 1. Valid Multi-Transformation on Dataset Sample Records
    // =======================================================================
    console.log('--- [1] POST /api/datasets/ds-churn-101/transform (sample preview rows) ---');
    const sampleRes = await requestJson(server, 'POST', '/api/datasets/ds-churn-101/transform', {
      limit: 3,
      useMapping: false,
      config: {
        select: {
          include: ['CustomerID', 'Age', 'Monthly_Charges', 'Churn']
        },
        columns: {
          CustomerID: ['trim', 'lowercase']
        },
        rename: {
          CustomerID: 'customerId',
          Age: 'age',
          Monthly_Charges: 'monthlyCharges',
          Churn: 'churnStatus'
        },
        types: {
          customerId: 'String',
          age: 'Number',
          monthlyCharges: 'Number',
          churnStatus: 'String'
        }
      }
    });

    assert.strictEqual(sampleRes.statusCode, 200, `Expected 200, got ${sampleRes.statusCode}: ${JSON.stringify(sampleRes.data)}`);
    assert.strictEqual(sampleRes.data.success, true);
    assert.strictEqual(sampleRes.data.count, 3, 'Should return 3 transformed sample records');
    assert.deepStrictEqual(sampleRes.data.columns, ['customerId', 'age', 'monthlyCharges', 'churnStatus']);
    assert.deepStrictEqual(sampleRes.data.rows[0], {
      customerId: 'cust-7021',
      age: 34,
      monthlyCharges: 65.4,
      churnStatus: 'No'
    });
    console.log('  Sample Output Row 0:', JSON.stringify(sampleRes.data.rows[0]));
    console.log('  [PASS] Transformed sample records returned from dataset preview\n');

    // =======================================================================
    // 2. Column Selection (Exclude), Rename, and String/Number/Date Conversions
    // =======================================================================
    console.log('--- [2] POST /api/datasets/ds-churn-101/transform (exclude + rename + Date/Number/String) ---');
    const batchRes = await requestJson(server, 'POST', '/api/datasets/ds-churn-101/transform', {
      rows: [
        {
          CustomerID: 1001,
          Age: ' 42 ',
          Monthly_Charges: '$1,250.50',
          Gender: 'Female',
          Contract_Type: 'Month-to-month',
          Tenure_Months: 12,
          Total_Charges: 1250.5,
          Churn: '2026-11-20'
        }
      ],
      select: { exclude: ['Gender', 'Contract_Type', 'Tenure_Months', 'Total_Charges'] },
      rename: {
        CustomerID: 'id',
        Age: 'customerAge',
        Monthly_Charges: 'charges',
        Churn: 'eventDate'
      },
      types: {
        id: 'String',
        customerAge: 'Number',
        charges: 'Number',
        eventDate: { type: 'Date', asISOString: true }
      }
    });

    assert.strictEqual(batchRes.statusCode, 200, `Expected 200, got ${batchRes.statusCode}: ${JSON.stringify(batchRes.data)}`);
    assert.strictEqual(batchRes.data.count, 1);
    assert.deepStrictEqual(batchRes.data.rows[0], {
      id: '1001',
      customerAge: 42,
      charges: 1250.5,
      eventDate: '2026-11-20T00:00:00.000Z'
    });
    console.log('  Sample Output Row 0:', JSON.stringify(batchRes.data.rows[0]));
    console.log('  [PASS] Exclude + rename + String/Number/Date conversions executed\n');

    // =======================================================================
    // 3. Ordered Steps Pipeline Execution
    // =======================================================================
    console.log('--- [3] POST /api/datasets/ds-iot-303/transform (ordered steps pipeline) ---');
    const stepsRes = await requestJson(server, 'POST', '/api/datasets/ds-iot-303/transform', {
      limit: 2,
      steps: [
        { action: 'select', include: ['device_id', 'temperature_c', 'status'] },
        { action: 'rename', map: { device_id: 'deviceId', temperature_c: 'tempC' } },
        { action: 'convertTypes', types: { deviceId: 'String', tempC: 'Number', status: 'String' } }
      ]
    });

    assert.strictEqual(stepsRes.statusCode, 200, `Expected 200, got ${stepsRes.statusCode}: ${JSON.stringify(stepsRes.data)}`);
    assert.strictEqual(stepsRes.data.count, 2);
    assert.deepStrictEqual(stepsRes.data.rows[0], {
      deviceId: 'DEV-101',
      tempC: 22.4,
      status: 'ONLINE'
    });
    console.log('  [PASS] Ordered steps pipeline executed\n');

    // =======================================================================
    // 4. Single Record Transform Endpoint
    // =======================================================================
    console.log('--- [4] POST /api/datasets/transform/record ---');
    const recordRes = await requestJson(server, 'POST', '/api/datasets/transform/record', {
      record: {
        raw_id: 99,
        amount_str: '$499.95',
        created_str: '25-11-2026',
        temp_flag: 'drop_me'
      },
      select: { exclude: ['temp_flag'] },
      rename: {
        raw_id: 'id',
        amount_str: 'amount',
        created_str: 'createdAt'
      },
      types: {
        id: 'String',
        amount: 'Number',
        createdAt: { type: 'Date', asISOString: true }
      }
    });

    assert.strictEqual(recordRes.statusCode, 200, `Expected 200, got ${recordRes.statusCode}: ${JSON.stringify(recordRes.data)}`);
    assert.strictEqual(recordRes.data.success, true);
    assert.deepStrictEqual(recordRes.data.transformed, {
      id: '99',
      amount: 499.95,
      createdAt: '2026-11-25T00:00:00.000Z'
    });
    console.log('  [PASS] Single record transformation returned expected output\n');

    // =======================================================================
    // 5. Invalid Transformation Configurations -> Proper 400 / 404 Errors
    // =======================================================================
    console.log('--- [5] Invalid Transformation Configuration Error Handling ---');

    // 5a. Empty configuration
    const emptyConfigRes = await requestJson(server, 'POST', '/api/datasets/ds-churn-101/transform', {
      useMapping: false
    });
    assert.strictEqual(emptyConfigRes.statusCode, 400);
    assert.strictEqual(emptyConfigRes.data.success, false);
    assert(Array.isArray(emptyConfigRes.data.errors) && emptyConfigRes.data.errors.length > 0);
    console.log('  [PASS] Empty config -> 400:', emptyConfigRes.data.message);

    // 5b. Non-object config
    const badConfigTypeRes = await requestJson(server, 'POST', '/api/datasets/ds-churn-101/transform', {
      config: 'invalid-string'
    });
    assert.strictEqual(badConfigTypeRes.statusCode, 400);
    assert.strictEqual(badConfigTypeRes.data.success, false);
    console.log('  [PASS] Non-object config -> 400:', badConfigTypeRes.data.message);

    // 5c. Non-existent column in select
    const badSelectRes = await requestJson(server, 'POST', '/api/datasets/ds-churn-101/transform', {
      select: { include: ['NonExistentCol'] }
    });
    assert.strictEqual(badSelectRes.statusCode, 400);
    assert.strictEqual(badSelectRes.data.success, false);
    assert(badSelectRes.data.errors.some((e) => e.code === 'COLUMN_NOT_FOUND'));
    console.log('  [PASS] Non-existent select column -> 400:', badSelectRes.data.message);

    // 5d. Empty select include array
    const emptySelectRes = await requestJson(server, 'POST', '/api/datasets/ds-churn-101/transform', {
      select: { include: [] }
    });
    assert.strictEqual(emptySelectRes.statusCode, 400);
    assert.strictEqual(emptySelectRes.data.success, false);
    console.log('  [PASS] Empty select.include -> 400:', emptySelectRes.data.message);

    // 5e. Duplicate rename target names
    const dupRenameRes = await requestJson(server, 'POST', '/api/datasets/ds-churn-101/transform', {
      rename: {
        Age: 'metric',
        Monthly_Charges: 'metric'
      }
    });
    assert.strictEqual(dupRenameRes.statusCode, 400);
    assert.strictEqual(dupRenameRes.data.success, false);
    assert(dupRenameRes.data.errors.some((e) => e.code === 'DUPLICATE_RENAME_TARGET'));
    console.log('  [PASS] Duplicate rename targets -> 400:', dupRenameRes.data.message);

    // 5f. Unsupported data type conversion
    const badTypeRes = await requestJson(server, 'POST', '/api/datasets/ds-churn-101/transform', {
      types: { Age: 'ComplexMatrix' }
    });
    assert.strictEqual(badTypeRes.statusCode, 400);
    assert.strictEqual(badTypeRes.data.success, false);
    assert(badTypeRes.data.errors.some((e) => e.code === 'UNSUPPORTED_DATA_TYPE'));
    console.log('  [PASS] Unsupported target data type -> 400:', badTypeRes.data.message);

    // 5g. Unsupported column operation
    const badOpRes = await requestJson(server, 'POST', '/api/datasets/ds-churn-101/transform', {
      columns: { Age: ['unknownMagicOp'] }
    });
    assert.strictEqual(badOpRes.statusCode, 400);
    assert.strictEqual(badOpRes.data.success, false);
    assert(badOpRes.data.errors.some((e) => e.code === 'UNSUPPORTED_OPERATION'));
    console.log('  [PASS] Unsupported operation -> 400:', badOpRes.data.message);

    // 5h. Invalid steps action
    const badStepRes = await requestJson(server, 'POST', '/api/datasets/ds-churn-101/transform', {
      steps: [{ action: 'dropDatabase' }]
    });
    assert.strictEqual(badStepRes.statusCode, 400);
    assert.strictEqual(badStepRes.data.success, false);
    console.log('  [PASS] Unsupported step action -> 400:', badStepRes.data.message);

    // 5i. Strict type conversion failure during execution
    const strictFailRes = await requestJson(server, 'POST', '/api/datasets/transform/record', {
      record: { Age: 'not-a-number' },
      types: { Age: { type: 'Number', strict: true } }
    });
    assert.strictEqual(strictFailRes.statusCode, 400);
    assert.strictEqual(strictFailRes.data.success, false);
    console.log('  [PASS] Strict conversion failure -> 400:', strictFailRes.data.message);

    // 5j. Invalid limit parameter
    const badLimitRes = await requestJson(server, 'POST', '/api/datasets/ds-churn-101/transform', {
      limit: -5,
      select: { include: ['CustomerID'] }
    });
    assert.strictEqual(badLimitRes.statusCode, 400);
    assert.strictEqual(badLimitRes.data.success, false);
    console.log('  [PASS] Invalid limit -> 400:', badLimitRes.data.message);

    // 5k. Dataset not found -> 404
    const notFoundRes = await requestJson(server, 'POST', '/api/datasets/non-existent-ds/transform', {
      select: { include: ['a'] }
    });
    assert.strictEqual(notFoundRes.statusCode, 404);
    assert.strictEqual(notFoundRes.data.success, false);
    console.log('  [PASS] Unknown datasetId -> 404:', notFoundRes.data.message);

    console.log('\nALL BACKEND TRANSFORMATION API INTEGRATION TESTS PASSED!');
  } finally {
    await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect().catch(() => {});
    }
  }
}

runApiTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Transformation API test failed:', err);
    process.exit(1);
  });
