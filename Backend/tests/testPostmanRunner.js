const http = require('http');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const assert = require('assert');
const app = require('../server');
const connectDB = require('../config/db');

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

function makeMultipartUpload(server, { path: reqPath, token, fieldName, fileName, fileContent, fields = {} }) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

    let body = '';
    for (const [key, value] of Object.entries(fields)) {
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
      body += `${value}\r\n`;
    }

    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="${fieldName}"; filename="${fileName}"\r\n`;
    body += `Content-Type: text/csv\r\n\r\n`;
    body += `${fileContent}\r\n`;
    body += `--${boundary}--\r\n`;

    const reqOptions = {
      hostname: '127.0.0.1',
      port: address.port,
      path: reqPath,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(body),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
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
    req.write(body);
    req.end();
  });
}

async function runPostmanTests() {
  console.log('📮 Starting Automated Postman API Collection Runner...\n');

  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`📡 Postman Test Target Server running on http://127.0.0.1:${port}\n`);

  const pmEnvironment = {
    jwt_token: '',
    datasetId: ''
  };

  try {
    // -------------------------------------------------------------------------
    // Request 1: Register User (POST /api/auth/register)
    // -------------------------------------------------------------------------
    console.log('1. [Postman] POST /api/auth/register');
    const testEmail = `postman_tester_${Date.now()}@example.com`;
    const regRes = await makeRequest(
      server,
      { path: '/api/auth/register', method: 'POST' },
      { name: 'Postman Tester', email: testEmail, password: 'password123' }
    );
    assert([200, 201].includes(regRes.statusCode), `Register status was ${regRes.statusCode}`);
    assert.strictEqual(regRes.data.success, true);
    if (regRes.data.token) {
      pmEnvironment.jwt_token = regRes.data.token;
    }
    console.log(`   ✅ Status: ${regRes.statusCode} OK - User registered: ${testEmail}`);

    // -------------------------------------------------------------------------
    // Request 2: Login User (POST /api/auth/login)
    // -------------------------------------------------------------------------
    console.log('2. [Postman] POST /api/auth/login');
    const loginRes = await makeRequest(
      server,
      { path: '/api/auth/login', method: 'POST' },
      { email: testEmail, password: 'password123' }
    );
    assert.strictEqual(loginRes.statusCode, 200);
    assert.strictEqual(loginRes.data.success, true);
    assert(loginRes.data.token, 'Token must be returned');
    pmEnvironment.jwt_token = loginRes.data.token;
    console.log(`   ✅ Status: 200 OK - Token saved to {{jwt_token}} (${pmEnvironment.jwt_token.substring(0, 20)}...)`);

    // -------------------------------------------------------------------------
    // Request 3: Upload Dataset (POST /api/datasets/upload)
    // -------------------------------------------------------------------------
    console.log('3. [Postman] POST /api/datasets/upload (Multipart)');
    const sampleCsv = `emp_id,emp_name,department,salary\n101,John Doe,Engineering,85000\n102,Jane Smith,Marketing,65000\n103,Sam Wilson,Sales,72000\n`;
    const uploadRes = await makeMultipartUpload(server, {
      path: '/api/datasets/upload',
      token: pmEnvironment.jwt_token,
      fieldName: 'file',
      fileName: 'employees_q4.csv',
      fileContent: sampleCsv,
      fields: {
        name: 'Q4 Employee Compensation',
        description: 'Quarterly payroll and headcount dataset'
      }
    });

    assert.strictEqual(uploadRes.statusCode, 201);
    assert.strictEqual(uploadRes.data.success, true);
    const uploaded = uploadRes.data.dataset;
    assert(uploaded.datasetId, 'datasetId must be returned');
    pmEnvironment.datasetId = uploaded.datasetId;

    // Verify metadata properties
    assert(uploaded.fileName, 'fileName required');
    assert(uploaded.fileSize > 0, 'fileSize required');
    assert(uploaded.uploadDate, 'uploadDate required');
    assert.strictEqual(uploaded.fileType, 'csv', 'fileType required');
    assert(uploaded.metadata, 'metadata required');
    assert.strictEqual(uploaded.metadata.rowCount, 3, 'rowCount required');
    assert.strictEqual(uploaded.metadata.columnCount, 4, 'columnCount required');
    console.log(`   ✅ Status: 201 Created - Dataset ID saved to {{datasetId}}: ${pmEnvironment.datasetId}`);
    console.log(`   ✅ Metadata: filename="${uploaded.fileName}", size=${uploaded.fileSize}B (${uploaded.formattedFileSize}), uploadDate=${uploaded.uploadDate}, type=${uploaded.fileType}`);

    // -------------------------------------------------------------------------
    // Request 4: List Datasets for Logged-In User (GET /api/datasets)
    // -------------------------------------------------------------------------
    console.log('4. [Postman] GET /api/datasets (Listing for logged-in user)');
    const listRes = await makeRequest(server, {
      path: '/api/datasets?page=1&limit=10&sortBy=createdAt&sortOrder=desc',
      headers: { Authorization: `Bearer ${pmEnvironment.jwt_token}` }
    });

    assert.strictEqual(listRes.statusCode, 200);
    assert.strictEqual(listRes.data.success, true);
    assert(Array.isArray(listRes.data.datasets), 'datasets must be an array');
    assert(listRes.data.totalCount >= 1, 'totalCount must be at least 1');
    const myItem = listRes.data.datasets.find((d) => d.datasetId === pmEnvironment.datasetId);
    assert(myItem, 'Uploaded dataset must appear in logged-in user listing');
    assert(myItem.fileName, 'Item must have fileName');
    assert(myItem.fileSize > 0, 'Item must have fileSize');
    assert(myItem.uploadDate, 'Item must have uploadDate');
    assert(myItem.fileType, 'Item must have fileType');
    console.log(`   ✅ Status: 200 OK - Found ${listRes.data.datasets.length} datasets for logged-in user.`);
    console.log(`   ✅ Verified metadata on listing item: fileName="${myItem.fileName}", fileSize=${myItem.fileSize}, uploadDate=${myItem.uploadDate}`);

    // -------------------------------------------------------------------------
    // Request 5: Dedicated User Datasets Route (GET /api/datasets/my)
    // -------------------------------------------------------------------------
    console.log('5. [Postman] GET /api/datasets/my (Dedicated route)');
    const myRouteRes = await makeRequest(server, {
      path: '/api/datasets/my',
      headers: { Authorization: `Bearer ${pmEnvironment.jwt_token}` }
    });
    assert.strictEqual(myRouteRes.statusCode, 200);
    assert.strictEqual(myRouteRes.data.success, true);
    assert(myRouteRes.data.datasets.some((d) => d.datasetId === pmEnvironment.datasetId));
    console.log(`   ✅ Status: 200 OK - Returned ${myRouteRes.data.datasets.length} datasets for logged-in user.`);

    // -------------------------------------------------------------------------
    // Request 6: Get Dataset Details by ID (GET /api/datasets/:id)
    // -------------------------------------------------------------------------
    console.log(`6. [Postman] GET /api/datasets/${pmEnvironment.datasetId} (Details API)`);
    const detailRes = await makeRequest(server, {
      path: `/api/datasets/${pmEnvironment.datasetId}`,
      headers: { Authorization: `Bearer ${pmEnvironment.jwt_token}` }
    });

    assert.strictEqual(detailRes.statusCode, 200);
    assert.strictEqual(detailRes.data.success, true);
    const details = detailRes.data.dataset;
    assert.strictEqual(details.datasetId, pmEnvironment.datasetId);
    assert.strictEqual(details.fileName, 'employees_q4.csv');
    assert.strictEqual(details.fileType, 'csv');
    assert.strictEqual(details.format, 'CSV');
    assert(details.fileSize > 0);
    assert(details.uploadDate);
    assert.strictEqual(details.metadata.rowCount, 3);
    assert.strictEqual(details.metadata.columnCount, 4);
    assert(Array.isArray(details.columns));
    assert.strictEqual(details.columns.length, 4);
    console.log(`   ✅ Status: 200 OK - Fetched details for dataset "${details.name}"`);
    console.log(`   ✅ Confirmed filename="${details.fileName}", size=${details.fileSize}B, date=${details.uploadDate}, type=${details.fileType}, rows=${details.metadata.rowCount}, cols=${details.metadata.columnCount}`);

    // -------------------------------------------------------------------------
    // Request 7: Delete Dataset (DELETE /api/datasets/:id)
    // -------------------------------------------------------------------------
    console.log(`7. [Postman] DELETE /api/datasets/${pmEnvironment.datasetId} (Deletion API)`);
    const delRes = await makeRequest(server, {
      path: `/api/datasets/${pmEnvironment.datasetId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${pmEnvironment.jwt_token}` }
    });

    assert.strictEqual(delRes.statusCode, 200);
    assert.strictEqual(delRes.data.success, true);
    assert(delRes.data.message.includes('deleted'));
    console.log(`   ✅ Status: 200 OK - ${delRes.data.message}`);

    // -------------------------------------------------------------------------
    // Request 8: Verify Deletion Returns 404 (GET /api/datasets/:id)
    // -------------------------------------------------------------------------
    console.log(`8. [Postman] Verify Deletion: GET /api/datasets/${pmEnvironment.datasetId}`);
    const verifyDelRes = await makeRequest(server, {
      path: `/api/datasets/${pmEnvironment.datasetId}`,
      headers: { Authorization: `Bearer ${pmEnvironment.jwt_token}` }
    });

    assert.strictEqual(verifyDelRes.statusCode, 404);
    assert.strictEqual(verifyDelRes.data.success, false);
    console.log('   ✅ Status: 404 Not Found - Dataset successfully removed.');

    console.log('\n🎉 ALL POSTMAN WORKFLOW REQUESTS PASSED WITH 100% SUCCESS!');
  } finally {
    server.close();
  }
}

runPostmanTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Postman Runner Error:', err);
    process.exit(1);
  });
