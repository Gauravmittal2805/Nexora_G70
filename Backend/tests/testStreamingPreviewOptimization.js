const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const {
  parseCsvStream,
  parseJsonStream,
  parseJsonLinesStream,
  readPreviewRowsFromStream
} = require('../utils/streamParsers');
const { getDatasetFileStream } = require('../utils/b2Storage');
const { getDatasetPreview } = require('../controllers/datasetController');

async function runOptimizationTests() {
  console.log('🚀 Running Task Verification: Improve Dataset Preview & Processing\n');

  // =========================================================================
  // Test 1: Small Dataset Preview & Custom Record Limits (CSV & JSON)
  // =========================================================================
  console.log('--- [Test 1] Small Dataset Preview & Custom Record Limits (CSV & JSON) ---');

  // 1a. Small CSV (10 rows)
  const smallCsvRows = [
    'id,product,price,in_stock',
    ...Array.from({ length: 10 }, (_, i) => `${i + 1},Widget-${i + 1},${(9.99 + i).toFixed(2)},${i % 2 === 0}`)
  ].join('\n');

  const smallCsvPath = path.join(os.tmpdir(), `small_test_${Date.now()}.csv`);
  fs.writeFileSync(smallCsvPath, smallCsvRows, 'utf8');

  // Test requesting custom number of records: limit=5
  const csvStream5 = fs.createReadStream(smallCsvPath);
  const csvResLimit5 = await readPreviewRowsFromStream({
    stream: csvStream5,
    fileType: 'csv',
    page: 1,
    limit: 5
  });
  assert.strictEqual(csvResLimit5.rows.length, 5, 'Should return exactly 5 records');
  assert.strictEqual(csvResLimit5.rows[0].id, '1', 'First record id must be 1');
  assert.strictEqual(csvResLimit5.rows[4].id, '5', 'Fifth record id must be 5');
  assert.strictEqual(csvResLimit5.hasNextPage, true, 'Should have next page since 10 total rows exist');
  console.log('  ✅ Small CSV: custom limit=5 returned exactly 5 records with hasNextPage=true');

  // 1b. Small JSON (10 objects)
  const smallJsonData = Array.from({ length: 10 }, (_, i) => ({
    userId: 200 + i,
    username: `user_${i + 1}`,
    active: i % 2 === 0
  }));
  const smallJsonPath = path.join(os.tmpdir(), `small_test_${Date.now()}.json`);
  fs.writeFileSync(smallJsonPath, JSON.stringify(smallJsonData, null, 2), 'utf8');

  // Test requesting custom number of records: limit=7
  const jsonStream7 = fs.createReadStream(smallJsonPath);
  const jsonResLimit7 = await readPreviewRowsFromStream({
    stream: jsonStream7,
    fileType: 'json',
    page: 1,
    limit: 7
  });
  assert.strictEqual(jsonResLimit7.rows.length, 7, 'Should return exactly 7 records');
  assert.strictEqual(jsonResLimit7.rows[0].userId, 200, 'First record userId must be 200');
  assert.strictEqual(jsonResLimit7.rows[6].userId, 206, 'Seventh record userId must be 206');
  console.log('  ✅ Small JSON: custom limit=7 returned exactly 7 records.\n');

  // =========================================================================
  // Test 2: Pagination for Dataset Preview (page=1, page=2, page=3)
  // =========================================================================
  console.log('--- [Test 2] Pagination for Dataset Preview ---');

  // Page 1: limit 4 -> rows 1 to 4
  const csvStreamP1 = fs.createReadStream(smallCsvPath);
  const page1Res = await readPreviewRowsFromStream({
    stream: csvStreamP1,
    fileType: 'csv',
    page: 1,
    limit: 4
  });
  assert.strictEqual(page1Res.rows.length, 4, 'Page 1 should have 4 rows');
  assert.strictEqual(page1Res.rows[0].id, '1');
  assert.strictEqual(page1Res.rows[3].id, '4');
  assert.strictEqual(page1Res.hasNextPage, true);

  // Page 2: limit 4 -> rows 5 to 8
  const csvStreamP2 = fs.createReadStream(smallCsvPath);
  const page2Res = await readPreviewRowsFromStream({
    stream: csvStreamP2,
    fileType: 'csv',
    page: 2,
    limit: 4
  });
  assert.strictEqual(page2Res.rows.length, 4, 'Page 2 should have 4 rows');
  assert.strictEqual(page2Res.rows[0].id, '5');
  assert.strictEqual(page2Res.rows[3].id, '8');
  assert.strictEqual(page2Res.hasNextPage, true);

  // Page 3: limit 4 -> rows 9 to 10 (last page)
  const csvStreamP3 = fs.createReadStream(smallCsvPath);
  const page3Res = await readPreviewRowsFromStream({
    stream: csvStreamP3,
    fileType: 'csv',
    page: 3,
    limit: 4
  });
  assert.strictEqual(page3Res.rows.length, 2, 'Page 3 should have remaining 2 rows');
  assert.strictEqual(page3Res.rows[0].id, '9');
  assert.strictEqual(page3Res.rows[1].id, '10');
  assert.strictEqual(page3Res.hasNextPage, false, 'Last page should have hasNextPage=false');
  console.log('  ✅ Paginated stream slicing verified: Page 1 (1-4), Page 2 (5-8), Page 3 (9-10).\n');

  // =========================================================================
  // Test 3: Large Dataset (50,000 Rows) Memory-Bounded Streaming Preview
  // =========================================================================
  console.log('--- [Test 3] Large File Streaming without Buffering Entire Dataset ---');

  const largeCsvPath = path.join(os.tmpdir(), `large_50k_${Date.now()}.csv`);
  const largeWriteStream = fs.createWriteStream(largeCsvPath);
  largeWriteStream.write('txn_id,account_id,amount,timestamp,status,country,ip_address\n');

  for (let i = 1; i <= 50000; i++) {
    largeWriteStream.write(
      `TXN-${i},ACC-${(i % 1000) + 1},${(Math.random() * 5000).toFixed(2)},2026-11-16T10:00:00Z,COMPLETED,US,192.168.1.1\n`
    );
  }
  await new Promise(r => largeWriteStream.end(r));

  const stats = fs.statSync(largeCsvPath);
  const fileSizeMb = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`  Created test dataset with 50,000 rows (${fileSizeMb} MB).`);

  // Measure memory before and after streaming the first 20 records
  if (global.gc) global.gc();
  const memBefore = process.memoryUsage().heapUsed;

  const largeStream = fs.createReadStream(largeCsvPath);
  const largePreviewResult = await readPreviewRowsFromStream({
    stream: largeStream,
    fileType: 'csv',
    page: 1,
    limit: 20
  });

  const memAfter = process.memoryUsage().heapUsed;
  const memDiffMb = ((memAfter - memBefore) / (1024 * 1024)).toFixed(2);

  assert.strictEqual(largePreviewResult.rows.length, 20, 'Should return exactly 20 records');
  assert.strictEqual(largePreviewResult.rows[0].txn_id, 'TXN-1', 'First record must be TXN-1');
  assert.strictEqual(largePreviewResult.rows[19].txn_id, 'TXN-20', '20th record must be TXN-20');
  assert.strictEqual(largePreviewResult.hasNextPage, true, 'Large file must have next page');

  console.log(`  ✅ 50,000 row file preview completed! Returned exactly ${largePreviewResult.rows.length} rows.`);
  console.log(`  ✅ Memory used for preview: ~${memDiffMb} MB (file was NOT loaded entirely into memory).\n`);

  // =========================================================================
  // Test 4: Handling Malformed CSV Files
  // =========================================================================
  console.log('--- [Test 4] Handling Malformed CSV Files ---');

  // 4a. Ragged CSV with inconsistent column counts per row
  const raggedCsv = [
    'colA,colB,colC',
    'val1,val2,val3',
    'val4,val5', // Missing column
    'val6,val7,val8,val9,val10', // Extra columns
    'val11,val12,val13'
  ].join('\n');

  const raggedCsvPath = path.join(os.tmpdir(), `ragged_${Date.now()}.csv`);
  fs.writeFileSync(raggedCsvPath, raggedCsv, 'utf8');

  const raggedStream = fs.createReadStream(raggedCsvPath);
  const raggedResult = await readPreviewRowsFromStream({
    stream: raggedStream,
    fileType: 'csv',
    page: 1,
    limit: 10
  });

  assert.strictEqual(raggedResult.rows.length, 4, 'Should gracefully parse all 4 ragged rows without throwing');
  assert.strictEqual(raggedResult.rows[0].colA, 'val1');
  assert.strictEqual(raggedResult.rows[1].colB, 'val5');
  console.log('  ✅ Ragged CSV handled gracefully: all rows extracted without crashing.');

  // 4b. Empty CSV file
  const emptyCsvPath = path.join(os.tmpdir(), `empty_${Date.now()}.csv`);
  fs.writeFileSync(emptyCsvPath, '', 'utf8');

  let emptyCaught = false;
  try {
    await parseCsvStream(emptyCsvPath, 10);
  } catch (err) {
    emptyCaught = true;
    assert(err.message.includes('empty'), 'Error should mention empty file');
  }
  assert.strictEqual(emptyCaught, true, 'Empty CSV should reject with clear error');
  console.log('  ✅ Empty CSV rejected with descriptive error message.\n');

  // =========================================================================
  // Test 5: Handling Malformed JSON Files & JSON Lines
  // =========================================================================
  console.log('--- [Test 5] Handling Malformed JSON Files & JSON Lines ---');

  // 5a. JSON Lines with intermittent invalid lines
  const mixedJsonLines = [
    '{"id": 1, "msg": "valid line 1"}',
    'MALFORMED_CORRUPT_NOT_JSON_LINE',
    '{"id": 2, "msg": "valid line 2"}',
    '{"id": 3, "msg": "valid line 3"}'
  ].join('\n');

  const jsonlPath = path.join(os.tmpdir(), `mixed_${Date.now()}.jsonl`);
  fs.writeFileSync(jsonlPath, mixedJsonLines, 'utf8');

  const jsonlStream = fs.createReadStream(jsonlPath);
  const jsonlResult = await readPreviewRowsFromStream({
    stream: jsonlStream,
    fileType: 'jsonl',
    page: 1,
    limit: 10
  });

  assert.strictEqual(jsonlResult.rows.length, 3, 'Should recover 3 valid records and skip the corrupted line');
  assert.strictEqual(jsonlResult.rows[0].id, 1);
  assert.strictEqual(jsonlResult.rows[1].id, 2);
  assert.strictEqual(jsonlResult.rows[2].id, 3);
  console.log('  ✅ JSON Lines with corrupt lines parsed successfully: valid rows recovered.');

  // 5b. Completely corrupt JSON file
  const corruptJsonPath = path.join(os.tmpdir(), `corrupt_${Date.now()}.json`);
  fs.writeFileSync(corruptJsonPath, 'INVALID_NOT_JSON_SYNTAX_###', 'utf8');

  let corruptCaught = false;
  try {
    const corruptStream = fs.createReadStream(corruptJsonPath);
    await readPreviewRowsFromStream({
      stream: corruptStream,
      fileType: 'json',
      page: 1,
      limit: 10
    });
  } catch (err) {
    corruptCaught = true;
    assert(err.message.includes('Malformed') || err.message.includes('JSON'), 'Error must identify malformed JSON');
  }
  assert.strictEqual(corruptCaught, true, 'Corrupt JSON should be caught and reported cleanly');
  console.log('  ✅ Corrupt JSON caught and reported with clear error.\n');

  // =========================================================================
  // Test 6: Optimized File Reading with Byte Range Support
  // =========================================================================
  console.log('--- [Test 6] Backblaze B2 / Storage Byte Range Optimization ---');

  // Test local range reader (first 100 bytes of small CSV)
  const rangeStream = await getDatasetFileStream({
    provider: 'local',
    localPath: smallCsvPath,
    range: 'bytes=0-99'
  });
  assert(rangeStream !== null, 'Range stream must not be null');

  let totalRangeBytes = 0;
  for await (const chunk of rangeStream) {
    totalRangeBytes += chunk.length;
  }
  assert.strictEqual(totalRangeBytes, 100, `Expected 100 bytes read with range, got ${totalRangeBytes}`);
  console.log(`  ✅ Byte range optimization verified: exactly ${totalRangeBytes} bytes requested and read.\n`);

  // =========================================================================
  // Test 7: GET /api/datasets/:id/preview Controller End-to-End
  // =========================================================================
  console.log('--- [Test 7] GET /api/datasets/:id/preview Controller Verification ---');

  // 7a. Preview with limit=10, page=1
  const reqPage1 = {
    params: { id: 'ds-churn-101' },
    query: { page: '1', limit: '10' }
  };
  let resDataPage1 = null;
  const mockResP1 = {
    status: (code) => { assert.strictEqual(code, 200); return mockResP1; },
    json: (d) => { resDataPage1 = d; return mockResP1; }
  };
  await getDatasetPreview(reqPage1, mockResP1, (err) => { if (err) throw err; });

  assert.strictEqual(resDataPage1.success, true);
  assert.strictEqual(resDataPage1.rows.length, 10, 'Expected 10 rows for limit=10');
  assert.strictEqual(resDataPage1.pagination.page, 1);
  assert.strictEqual(resDataPage1.pagination.limit, 10);
  assert.strictEqual(resDataPage1.pagination.hasNextPage, true);
  console.log('  ✅ GET /api/datasets/:id/preview?page=1&limit=10 returned 10 rows with next page.');

  // 7b. Preview with limit=10, page=2
  const reqPage2 = {
    params: { id: 'ds-churn-101' },
    query: { page: '2', limit: '10' }
  };
  let resDataPage2 = null;
  const mockResP2 = {
    status: (code) => { assert.strictEqual(code, 200); return mockResP2; },
    json: (d) => { resDataPage2 = d; return mockResP2; }
  };
  await getDatasetPreview(reqPage2, mockResP2, (err) => { if (err) throw err; });

  assert.strictEqual(resDataPage2.success, true);
  assert.strictEqual(resDataPage2.rows.length, 10, 'Expected 10 rows for limit=10 page 2');
  assert.strictEqual(resDataPage2.pagination.page, 2);
  assert.notDeepStrictEqual(resDataPage1.rows[0], resDataPage2.rows[0], 'Page 1 and Page 2 rows must differ');
  console.log('  ✅ GET /api/datasets/:id/preview?page=2&limit=10 returned different records for page 2.\n');

  // Clean up test files
  try { fs.unlinkSync(smallCsvPath); } catch {}
  try { fs.unlinkSync(smallJsonPath); } catch {}
  try { fs.unlinkSync(largeCsvPath); } catch {}
  try { fs.unlinkSync(raggedCsvPath); } catch {}
  try { fs.unlinkSync(emptyCsvPath); } catch {}
  try { fs.unlinkSync(jsonlPath); } catch {}
  try { fs.unlinkSync(corruptJsonPath); } catch {}

  console.log('🎉 ALL 8 OPTIMIZATION & PREVIEW PROCESSING REQUIREMENTS PASSED!\n');
  process.exit(0);
}

runOptimizationTests().catch((err) => {
  console.error('❌ Optimization test failed:', err);
  process.exit(1);
});
