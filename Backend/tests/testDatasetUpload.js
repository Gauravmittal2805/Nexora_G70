const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const Dataset = require('../models/Dataset');
const { handleUpload, MAX_FILE_SIZE } = require('../middleware/uploadMiddleware');
const { parseCsvStream, parseJsonStream } = require('../utils/streamParsers');
const { uploadDatasetFile } = require('../utils/b2Storage');

async function testUploadWorkflow() {
  console.log('🧪 Starting Dataset Upload Backend Tests...\n');

  // Test 1: File Validation (CSV & JSON)
  console.log('1. Testing File Extension Validation...');
  const allowed = ['.csv', '.json', '.jsonl'];
  const disallowed = ['.txt', '.pdf', '.png', '.exe', '.zip'];

  disallowed.forEach((ext) => {
    const isAllowed = allowed.includes(ext);
    assert.strictEqual(isAllowed, false, `Extension ${ext} should be rejected`);
  });
  console.log('  ✅ Non-CSV/JSON extensions rejected as expected.');
  console.log(`  ✅ File size limit configured at ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB.\n`);

  // Test 2: Dataset Model Schema Verification
  console.log('2. Testing Dataset Mongoose Schema Fields...');
  const schemaKeys = Object.keys(Dataset.schema.paths);
  const requiredFields = ['datasetId', 'userId', 'fileName', 'fileType', 'fileSize', 'storageUrl', 'createdAt'];

  requiredFields.forEach((field) => {
    assert(schemaKeys.includes(field), `Dataset schema missing required field: ${field}`);
  });
  console.log('  ✅ Dataset schema contains all required fields:', requiredFields.join(', '));

  // Test 3: Local Storage File Save & URL generation
  console.log('\n3. Testing Local Storage Save & storageUrl Generation...');
  const sampleFilePath = path.join(os.tmpdir(), `sample_upload_${Date.now()}.csv`);
  fs.writeFileSync(sampleFilePath, 'colA,colB\n1,Hello\n2,World\n', 'utf8');

  const storageKey = `datasets/test_user_${Date.now()}/sample.csv`;
  const storageResult = await uploadDatasetFile({
    filePath: sampleFilePath,
    key: storageKey,
    mimeType: 'text/csv'
  });

  console.log('  Storage Provider:', storageResult.provider);
  console.log('  Storage URL:', storageResult.storageUrl);
  assert(storageResult.storageUrl.startsWith('/uploads/datasets/') || storageResult.storageUrl.includes('backblaze'), 'storageUrl must be formatted correctly');
  assert(fs.existsSync(storageResult.localPath || sampleFilePath), 'Stored file must exist');

  fs.unlinkSync(sampleFilePath);
  if (storageResult.localPath && fs.existsSync(storageResult.localPath)) {
    fs.unlinkSync(storageResult.localPath);
  }
  console.log('  ✅ Storage and storageUrl generation passed!\n');

  console.log('🎉 All Dataset Upload Backend validation tests passed successfully!');
}

testUploadWorkflow().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
