const assert = require('assert');
const http = require('http');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const os = require('os');
const app = require('../server');
const connectDB = require('../config/db');
const User = require('../models/User');
const Dataset = require('../models/Dataset');
const generateToken = require('../utils/generateToken');

/**
 * HTTP request helper for testing Express app endpoints
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

/**
 * Multipart file upload helper
 */
function makeMultipartUpload(server, { path: reqPath, token, fieldName, fileName, fileContent, fields = {} }) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

    let body = '';
    // Extra form fields
    for (const [key, value] of Object.entries(fields)) {
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
      body += `${value}\r\n`;
    }

    // File field
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

async function runDatasetUserAndCrudTests() {
  console.log('🧪 Starting Dataset Management & Logged-In User API Tests...\n');

  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`📡 Test server running on http://127.0.0.1:${port}\n`);

  try {
    // -------------------------------------------------------------------------
    // Setup: Create 2 Test Users & Generate Auth Tokens
    // -------------------------------------------------------------------------
    console.log('--- [Step 1] Creating Test Users and Auth Tokens ---');
    const user1Email = `user1_${Date.now()}@example.com`;
    const user2Email = `user2_${Date.now()}@example.com`;

    const user1 = await User.create({
      name: 'Alice User 1',
      email: user1Email,
      password: 'password123'
    });
    const token1 = generateToken(user1._id);

    const user2 = await User.create({
      name: 'Bob User 2',
      email: user2Email,
      password: 'password123'
    });
    const token2 = generateToken(user2._id);

    console.log(`  ✅ User 1 Created: ${user1.name} (${user1._id})`);
    console.log(`  ✅ User 2 Created: ${user2.name} (${user2._id})\n`);

    // -------------------------------------------------------------------------
    // Requirement 1: Upload Datasets for User 1 and User 2
    // -------------------------------------------------------------------------
    console.log('--- [Step 2] Upload Datasets with User Authentication ---');
    const csvContent1 = `id,customer_name,email,churn\n1,Alice,alice@example.com,false\n2,Charlie,charlie@example.com,true\n`;
    const uploadRes1 = await makeMultipartUpload(server, {
      path: '/api/datasets/upload',
      token: token1,
      fieldName: 'file',
      fileName: 'alice_churn_data.csv',
      fileContent: csvContent1,
      fields: {
        name: 'Alice Churn Dataset',
        description: 'Customer churn data uploaded by Alice',
        tags: 'churn, telecom, tabular'
      }
    });

    assert.strictEqual(uploadRes1.statusCode, 201, `Upload 1 failed with status ${uploadRes1.statusCode}`);
    assert.strictEqual(uploadRes1.data.success, true);
    const aliceDataset = uploadRes1.data.dataset;
    assert(aliceDataset.datasetId, 'Dataset must have datasetId');
    console.log(`  ✅ Dataset uploaded for User 1: "${aliceDataset.name}" (ID: ${aliceDataset.datasetId})`);

    const csvContent2 = `order_id,product,amount\n101,Laptop,1200\n102,Mouse,25\n`;
    const uploadRes2 = await makeMultipartUpload(server, {
      path: '/api/datasets/upload',
      token: token2,
      fieldName: 'file',
      fileName: 'bob_orders.csv',
      fileContent: csvContent2,
      fields: {
        name: 'Bob Orders Dataset',
        description: 'E-commerce orders uploaded by Bob'
      }
    });

    assert.strictEqual(uploadRes2.statusCode, 201, `Upload 2 failed with status ${uploadRes2.statusCode}`);
    const bobDataset = uploadRes2.data.dataset;
    console.log(`  ✅ Dataset uploaded for User 2: "${bobDataset.name}" (ID: ${bobDataset.datasetId})\n`);

    // -------------------------------------------------------------------------
    // Requirement 2: Fetch All Uploaded Datasets of Logged-in User
    // -------------------------------------------------------------------------
    console.log('--- [Step 3] Fetch All Uploaded Datasets of Logged-In User ---');
    // Test GET /api/datasets with User 1 token
    const listResUser1 = await makeRequest(server, {
      path: '/api/datasets',
      headers: { Authorization: `Bearer ${token1}` }
    });

    assert.strictEqual(listResUser1.statusCode, 200);
    assert.strictEqual(listResUser1.data.success, true);
    assert(Array.isArray(listResUser1.data.datasets), 'Response must have datasets array');
    console.log(`  User 1 Dataset Count: ${listResUser1.data.datasets.length}`);

    // Verify User Isolation: User 1 sees their dataset, but does NOT see User 2's dataset
    const foundAliceInUser1 = listResUser1.data.datasets.find((d) => d.datasetId === aliceDataset.datasetId);
    const foundBobInUser1 = listResUser1.data.datasets.find((d) => d.datasetId === bobDataset.datasetId);
    assert(foundAliceInUser1, 'User 1 must see their own uploaded dataset');
    assert(!foundBobInUser1, 'User 1 must NOT see User 2 private dataset (User Isolation verified)');
    console.log('  ✅ User Isolation verified: User 1 only sees their datasets, User 2 dataset excluded.');

    // Test dedicated route GET /api/datasets/my with User 1 token
    const myResUser1 = await makeRequest(server, {
      path: '/api/datasets/my',
      headers: { Authorization: `Bearer ${token1}` }
    });
    assert.strictEqual(myResUser1.statusCode, 200);
    assert.strictEqual(myResUser1.data.success, true);
    assert(myResUser1.data.datasets.length >= 1);
    console.log('  ✅ GET /api/datasets/my dedicated route successfully returned logged-in user datasets.');

    // Test GET /api/datasets with User 2 token
    const listResUser2 = await makeRequest(server, {
      path: '/api/datasets',
      headers: { Authorization: `Bearer ${token2}` }
    });
    assert.strictEqual(listResUser2.statusCode, 200);
    const foundBobInUser2 = listResUser2.data.datasets.find((d) => d.datasetId === bobDataset.datasetId);
    const foundAliceInUser2 = listResUser2.data.datasets.find((d) => d.datasetId === aliceDataset.datasetId);
    assert(foundBobInUser2, 'User 2 must see their own uploaded dataset');
    assert(!foundAliceInUser2, 'User 2 must NOT see User 1 private dataset');
    console.log('  ✅ User 2 listing verified with strict isolation.\n');

    // -------------------------------------------------------------------------
    // Requirement 3: Metadata Verification (filename, file size, upload date, file type)
    // -------------------------------------------------------------------------
    console.log('--- [Step 4] Verify Dataset Metadata (filename, file size, upload date, file type) ---');
    const dsMeta = foundAliceInUser1;

    // Verify top-level metadata properties
    assert(dsMeta.fileName || dsMeta.filename, 'Must have fileName/filename');
    assert.strictEqual(typeof dsMeta.fileSize, 'number', 'fileSize must be a number');
    assert(dsMeta.fileSize > 0, 'fileSize must be greater than 0');
    assert(dsMeta.uploadDate || dsMeta.uploadedAt || dsMeta.createdAt, 'Must have upload date');
    assert.strictEqual(dsMeta.fileType, 'csv', 'fileType must be csv');
    assert.strictEqual(dsMeta.format, 'CSV', 'format must be CSV');
    assert(dsMeta.formattedFileSize, 'formattedFileSize string must be present');

    // Verify nested metadata object
    assert(dsMeta.metadata, 'metadata object must be present');
    assert(dsMeta.metadata.filename || dsMeta.metadata.fileName, 'metadata.filename must be present');
    assert.strictEqual(typeof dsMeta.metadata.fileSize, 'number', 'metadata.fileSize must be a number');
    assert(dsMeta.metadata.uploadDate, 'metadata.uploadDate must be present');
    assert.strictEqual(dsMeta.metadata.fileType, 'csv', 'metadata.fileType must be csv');
    assert.strictEqual(dsMeta.metadata.rowCount, 2, 'metadata.rowCount must be 2');
    assert.strictEqual(dsMeta.metadata.columnCount, 4, 'metadata.columnCount must be 4');
    assert(Array.isArray(dsMeta.metadata.columns), 'metadata.columns must be an array');

    console.log('  ✅ Filename verified:', dsMeta.fileName);
    console.log('  ✅ File Size verified:', dsMeta.fileSize, 'bytes (', dsMeta.formattedFileSize, ')');
    console.log('  ✅ Upload Date verified:', dsMeta.uploadDate);
    console.log('  ✅ File Type verified:', dsMeta.fileType, `(${dsMeta.format})`);
    console.log('  ✅ Nested metadata object verified with rows & columns.\n');

    // -------------------------------------------------------------------------
    // Requirement 4: Implement API to fetch dataset details using dataset ID
    // -------------------------------------------------------------------------
    console.log('--- [Step 5] Fetch Dataset Details using Dataset ID ---');
    // Test GET /api/datasets/:id by datasetId (UUID/custom string)
    const detailRes = await makeRequest(server, {
      path: `/api/datasets/${aliceDataset.datasetId}`,
      headers: { Authorization: `Bearer ${token1}` }
    });

    assert.strictEqual(detailRes.statusCode, 200);
    assert.strictEqual(detailRes.data.success, true);
    const detail = detailRes.data.dataset;
    assert.strictEqual(detail.datasetId, aliceDataset.datasetId);
    assert.strictEqual(detail.fileName, 'alice_churn_data.csv');
    assert.strictEqual(detail.fileType, 'csv');
    assert(detail.uploadDate, 'detail must have uploadDate');
    assert(detail.fileSize > 0, 'detail must have fileSize');
    assert(detail.metadata, 'detail must have metadata');
    assert(Array.isArray(detail.columns), 'detail must have columns');
    console.log(`  ✅ GET /api/datasets/${aliceDataset.datasetId} successfully returned full details.`);

    // Test GET /api/datasets/:id by MongoDB _id
    const detailByMongoIdRes = await makeRequest(server, {
      path: `/api/datasets/${aliceDataset._id}`,
      headers: { Authorization: `Bearer ${token1}` }
    });
    assert.strictEqual(detailByMongoIdRes.statusCode, 200);
    assert.strictEqual(detailByMongoIdRes.data.dataset.datasetId, aliceDataset.datasetId);
    console.log(`  ✅ GET /api/datasets/${aliceDataset._id} (MongoDB _id) successfully returned dataset details.`);

    // Test 404 for non-existent dataset ID
    const notFoundRes = await makeRequest(server, {
      path: '/api/datasets/ds-non-existent-9999999',
      headers: { Authorization: `Bearer ${token1}` }
    });
    assert.strictEqual(notFoundRes.statusCode, 404);
    assert.strictEqual(notFoundRes.data.success, false);
    console.log('  ✅ 404 Not Found returned for invalid dataset ID.');

    // Test 403 Forbidden when User 2 attempts to fetch User 1's dataset
    const forbiddenRes = await makeRequest(server, {
      path: `/api/datasets/${aliceDataset.datasetId}`,
      headers: { Authorization: `Bearer ${token2}` }
    });
    assert.strictEqual(forbiddenRes.statusCode, 403);
    assert.strictEqual(forbiddenRes.data.success, false);
    console.log('  ✅ 403 Forbidden returned when User 2 requests User 1 dataset.\n');

    // -------------------------------------------------------------------------
    // Requirement 5: Implement Dataset Deletion Functionality
    // -------------------------------------------------------------------------
    console.log('--- [Step 6] Implement & Test Dataset Deletion Functionality ---');
    // Test 403 Forbidden: User 2 tries to delete User 1's dataset
    const unauthDeleteRes = await makeRequest(server, {
      path: `/api/datasets/${aliceDataset.datasetId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token2}` }
    });
    assert.strictEqual(unauthDeleteRes.statusCode, 403);
    console.log('  ✅ 403 Forbidden returned when unauthorized user attempts dataset deletion.');

    // User 1 deletes their dataset
    const deleteRes = await makeRequest(server, {
      path: `/api/datasets/${aliceDataset.datasetId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token1}` }
    });
    assert.strictEqual(deleteRes.statusCode, 200);
    assert.strictEqual(deleteRes.data.success, true);
    assert(deleteRes.data.message.includes('deleted'), 'Response message must indicate deletion');
    console.log(`  ✅ Dataset deleted successfully: ${deleteRes.data.deletedDatasetId}`);

    // Verify dataset is gone from MongoDB
    const checkDb = await Dataset.findOne({ datasetId: aliceDataset.datasetId });
    assert.strictEqual(checkDb, null, 'Dataset should no longer exist in MongoDB');
    console.log('  ✅ Verified dataset removed from MongoDB.');

    // Verify subsequent GET returns 404 Not Found
    const verifyGetDeleted = await makeRequest(server, {
      path: `/api/datasets/${aliceDataset.datasetId}`,
      headers: { Authorization: `Bearer ${token1}` }
    });
    assert.strictEqual(verifyGetDeleted.statusCode, 404);
    console.log('  ✅ Subsequent GET /api/datasets/:id returns 404 Not Found.');

    // Verify dataset no longer appears in User 1's dataset list
    const finalListUser1 = await makeRequest(server, {
      path: '/api/datasets',
      headers: { Authorization: `Bearer ${token1}` }
    });
    assert.strictEqual(finalListUser1.statusCode, 200);
    const stillThere = finalListUser1.data.datasets.find((d) => d.datasetId === aliceDataset.datasetId);
    assert(!stillThere, 'Deleted dataset must not appear in listing');
    console.log('  ✅ Deleted dataset no longer appears in user dataset listing.');

    // Clean up Bob's dataset and test users
    await makeRequest(server, {
      path: `/api/datasets/${bobDataset.datasetId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token2}` }
    });
    await User.deleteMany({ _id: { $in: [user1._id, user2._id] } });
    console.log('  ✅ Cleaned up test datasets and test users.\n');

    console.log('🎉 ALL REQUIREMENTS FOR DATASET APIS VERIFIED AND PASSED 100%!');
  } finally {
    server.close();
  }
}

runDatasetUserAndCrudTests()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  });
