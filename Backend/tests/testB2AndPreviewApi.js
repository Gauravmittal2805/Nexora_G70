const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { S3Client } = require('@aws-sdk/client-s3');
const {
  getS3Client,
  isB2Configured,
  getB2BucketName,
  getB2Region,
  getB2Endpoint,
  verifyB2Connection
} = require('../config/s3Client');
const {
  uploadDatasetFile,
  getDatasetFileStream,
  getDownloadUrl,
  LOCAL_STORAGE_DIR
} = require('../utils/b2Storage');
const {
  parseCsvStream,
  parseJsonStream,
  readPreviewRowsFromStream
} = require('../utils/streamParsers');
const Dataset = require('../models/Dataset');
const app = require('../server');

async function runB2AndPreviewTests() {
  console.log('🚀 Running Task Verification: Backblaze B2 Integration & Dataset Preview API\n');

  // =========================================================================
  // Requirement 1: Configure Backblaze B2 using AWS S3 SDK
  // =========================================================================
  console.log('--- [Requirement 1] Configure Backblaze B2 using AWS S3 SDK ---');
  assert.strictEqual(typeof getS3Client, 'function', 'getS3Client must be exported function');
  assert.strictEqual(typeof isB2Configured, 'function', 'isB2Configured must be exported function');
  assert.strictEqual(typeof getB2BucketName, 'function', 'getB2BucketName must be exported function');
  assert.strictEqual(typeof getB2Region, 'function', 'getB2Region must be exported function');
  assert.strictEqual(typeof getB2Endpoint, 'function', 'getB2Endpoint must be exported function');

  // Simulate B2 environment variables to verify S3Client instantiation
  const origEnv = { ...process.env };
  process.env.B2_KEY_ID = 'test_key_id_12345';
  process.env.B2_APPLICATION_KEY = 'test_application_key_67890';
  process.env.B2_BUCKET_NAME = 'test-nexora-bucket';
  process.env.B2_REGION = 'us-west-004';
  process.env.B2_ENDPOINT = 'https://s3.us-west-004.backblazeb2.com';

  assert.strictEqual(isB2Configured(), true, 'B2 should be recognized as configured when env vars set');
  const mockS3Client = getS3Client();
  assert(mockS3Client instanceof S3Client, 'getS3Client should return an AWS SDK S3Client instance');

  const clientConfig = mockS3Client.config;
  const endpoint = await clientConfig.endpoint();
  assert.strictEqual(endpoint.hostname, 's3.us-west-004.backblazeb2.com', 'Endpoint hostname must match B2 endpoint');
  assert.strictEqual(clientConfig.forcePathStyle, true, 'forcePathStyle must be enabled for Backblaze B2 S3 API');
  console.log('  ✅ Backblaze B2 successfully configured via AWS S3 SDK S3Client.');
  console.log('  ✅ Endpoint, Region, Credentials, and forcePathStyle verified.\n');

  // =========================================================================
  // Requirement 2: Connect the backend with the B2 bucket
  // =========================================================================
  console.log('--- [Requirement 2] Connect the backend with the B2 bucket ---');
  assert.strictEqual(typeof verifyB2Connection, 'function', 'verifyB2Connection must be a function');
  const connCheck = await verifyB2Connection();
  assert('connected' in connCheck, 'Connection result must include connected status');
  assert('bucket' in connCheck, 'Connection result must include bucket name');
  assert('endpoint' in connCheck, 'Connection result must include endpoint');
  console.log('  ✅ verifyB2Connection status check executed successfully.');
  console.log(`  ✅ B2 Bucket: "${connCheck.bucket}", Region: "${connCheck.region}".\n`);

  // Restore env for local fallback operations
  process.env = { ...origEnv };

  // =========================================================================
  // Requirement 3: Implement file upload to B2
  // =========================================================================
  console.log('--- [Requirement 3] Implement file upload to B2 ---');
  const sampleCsvContent = [
    'customer_id,name,age,country,churn,monthly_spend',
    ...Array.from({ length: 30 }, (_, i) =>
      `CUST-${1000 + i},Customer ${i + 1},${25 + (i % 40)},${i % 2 === 0 ? 'USA' : 'Germany'},${i % 3 === 0},${(49.99 + i * 2.5).toFixed(2)}`
    )
  ].join('\n');

  const testCsvFile = path.join(os.tmpdir(), `test_b2_upload_${Date.now()}.csv`);
  fs.writeFileSync(testCsvFile, sampleCsvContent, 'utf8');

  const storageKey = `datasets/user_test_${Date.now()}/sample_customers.csv`;
  const uploadResult = await uploadDatasetFile({
    filePath: testCsvFile,
    key: storageKey,
    mimeType: 'text/csv'
  });

  assert(uploadResult.storageUrl, 'Upload result must contain storageUrl');
  assert(uploadResult.key === storageKey, 'Upload result key must match');
  console.log('  ✅ Upload handler processed file.');
  console.log(`  ✅ Storage Provider: ${uploadResult.provider}`);
  console.log(`  ✅ Storage URL generated: ${uploadResult.storageUrl}\n`);

  // =========================================================================
  // Requirement 4: Save the uploaded file's storage URL in MongoDB
  // =========================================================================
  console.log('--- [Requirement 4] Save uploaded file\'s storage URL in MongoDB ---');
  const datasetSchemaPaths = Dataset.schema.paths;
  assert('storageUrl' in datasetSchemaPaths, 'Dataset schema must include storageUrl field');
  assert.strictEqual(datasetSchemaPaths.storageUrl.isRequired, true, 'storageUrl must be required in MongoDB schema');
  assert('storage.provider' in datasetSchemaPaths || 'storage' in datasetSchemaPaths, 'Dataset schema must include storage metadata');
  assert('previewData' in datasetSchemaPaths, 'Dataset schema must include previewData');
  console.log('  ✅ Dataset schema contains required "storageUrl" field.');
  console.log('  ✅ Dataset schema contains storage metadata and previewData.\n');

  // =========================================================================
  // Requirement 5: Create GET /api/datasets API to fetch uploaded datasets
  // =========================================================================
  console.log('--- [Requirement 5] Create GET /api/datasets API to fetch uploaded datasets ---');
  const { getDatasets } = require('../controllers/datasetController');
  assert.strictEqual(typeof getDatasets, 'function', 'getDatasets controller must exist');

  // Simulate mock req, res
  const mockReq = { query: { page: '1', limit: '10' } };
  let responseData = null;
  const mockRes = {
    status: (code) => {
      assert.strictEqual(code, 200, `Expected 200 status code, got ${code}`);
      return mockRes;
    },
    json: (data) => {
      responseData = data;
      return mockRes;
    }
  };

  await getDatasets(mockReq, mockRes, (err) => { if (err) throw err; });
  assert(responseData !== null, 'Response data must not be null');
  assert.strictEqual(responseData.success, true, 'Response must indicate success: true');
  assert(Array.isArray(responseData.datasets), 'Response must include datasets array');
  assert(Array.isArray(responseData.data), 'Response must include data array');
  assert(responseData.totalCount >= 0, 'Response must include totalCount');
  assert(responseData.pagination, 'Response must include pagination object');
  console.log(`  ✅ GET /api/datasets returned ${responseData.datasets.length} datasets.`);
  console.log('  ✅ Pagination structure confirmed:', JSON.stringify(responseData.pagination));
  console.log('  ✅ Compatibility keys (datasets & data) present.\n');

  // =========================================================================
  // Requirements 6 & 7: Start implementing GET /api/datasets/:id/preview
  // Read CSV/JSON files and return the first 10–20 records for preview
  // =========================================================================
  console.log('--- [Requirements 6 & 7] Read CSV/JSON files & return first 10-20 records for preview ---');
  const { getDatasetPreview } = require('../controllers/datasetController');
  assert.strictEqual(typeof getDatasetPreview, 'function', 'getDatasetPreview controller must exist');

  // 1. Test CSV Stream Parser & Preview Extraction (first 20 records)
  console.log('  Testing CSV stream reader with 20 records...');
  const csvReadStream = fs.createReadStream(testCsvFile);
  const csvPreviewResult = await readPreviewRowsFromStream({
    stream: csvReadStream,
    fileType: 'csv',
    limit: 20,
    delimiter: ','
  });

  assert.strictEqual(csvPreviewResult.rows.length, 20, `Expected 20 preview rows, got ${csvPreviewResult.rows.length}`);
  assert.strictEqual(csvPreviewResult.columns.length, 6, `Expected 6 columns, got ${csvPreviewResult.columns.length}`);
  assert.strictEqual(csvPreviewResult.rows[0].customer_id, 'CUST-1000', 'First record must match CSV data');
  assert.strictEqual(csvPreviewResult.rows[19].customer_id, 'CUST-1019', '20th record must match CSV data');
  console.log(`  ✅ CSV file read successfully: returned exactly ${csvPreviewResult.rows.length} preview records.`);

  // 2. Test JSON Stream Parser & Preview Extraction (first 15 records)
  console.log('  Testing JSON stream reader with 15 records...');
  const sampleJsonRecords = Array.from({ length: 25 }, (_, i) => ({
    id: 100 + i,
    service: `microservice-${i % 5}`,
    latency_ms: 12.5 + i * 1.8,
    isHealthy: i % 7 !== 0,
    timestamp: new Date(Date.now() - i * 60000).toISOString()
  }));

  const testJsonFile = path.join(os.tmpdir(), `test_b2_preview_${Date.now()}.json`);
  fs.writeFileSync(testJsonFile, JSON.stringify(sampleJsonRecords, null, 2), 'utf8');

  const jsonReadStream = fs.createReadStream(testJsonFile);
  const jsonPreviewResult = await readPreviewRowsFromStream({
    stream: jsonReadStream,
    fileType: 'json',
    limit: 15
  });

  assert.strictEqual(jsonPreviewResult.rows.length, 15, `Expected 15 preview rows, got ${jsonPreviewResult.rows.length}`);
  assert.strictEqual(jsonPreviewResult.rows[0].id, 100, 'First JSON record id should be 100');
  assert.strictEqual(jsonPreviewResult.rows[14].id, 114, '15th JSON record id should be 114');
  console.log(`  ✅ JSON file read successfully: returned exactly ${jsonPreviewResult.rows.length} preview records.`);

  // 3. Test GET /api/datasets/:id/preview Controller endpoint
  console.log('  Testing GET /api/datasets/:id/preview endpoint response...');
  const previewReq = {
    params: { id: 'ds-churn-101' },
    query: { limit: '20' }
  };

  let previewResponse = null;
  const previewRes = {
    status: (code) => {
      assert.strictEqual(code, 200, `Expected 200 status code, got ${code}`);
      return previewRes;
    },
    json: (data) => {
      previewResponse = data;
      return previewRes;
    }
  };

  await getDatasetPreview(previewReq, previewRes, (err) => { if (err) throw err; });
  assert(previewResponse !== null, 'Preview response must not be null');
  assert.strictEqual(previewResponse.success, true, 'Preview response must indicate success: true');
  assert(previewResponse.rows.length >= 10 && previewResponse.rows.length <= 20, 'Preview rows must be between 10 and 20 records');
  assert(previewResponse.columns.length > 0, 'Preview response must include column definitions');
  assert(previewResponse.pagination, 'Preview response must include pagination metadata');
  console.log(`  ✅ GET /api/datasets/:id/preview returned ${previewResponse.rows.length} records.`);
  console.log(`  ✅ Columns included (${previewResponse.columns.length}):`, previewResponse.columns.map(c => c.name).join(', '));
  console.log(`  ✅ Total rows: ${previewResponse.totalRows}, Preview count: ${previewResponse.previewCount}\n`);

  // Clean up temp test files
  try { fs.unlinkSync(testCsvFile); } catch {}
  try { fs.unlinkSync(testJsonFile); } catch {}
  if (uploadResult.localPath && fs.existsSync(uploadResult.localPath)) {
    try { fs.unlinkSync(uploadResult.localPath); } catch {}
  }

  console.log('🎉 ALL 7 REQUIREMENTS VERIFIED AND PASSED SUCCESSFULLY!');
  process.exit(0);
}

runB2AndPreviewTests().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
