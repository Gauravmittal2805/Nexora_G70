const fs = require('fs');
const path = require('path');
const os = require('os');
const { parseCsvStream, parseJsonStream, detectDelimiter } = require('../utils/streamParsers');
const { isB2Configured } = require('../config/s3Client');

async function runTests() {
  console.log('🧪 Starting Dataset Module Verification Tests...\n');

  // 1. Test CSV Stream Parser
  const tempCsvPath = path.join(os.tmpdir(), `test_${Date.now()}.csv`);
  const csvContent = `id,name,age,salary,joinedDate,isActive,notes
1,Alice Johnson,29,75000.50,2024-01-15,true,Lead engineer
2,Bob Smith,34,82000.00,2023-11-20,false,
3,Charlie Brown,41,,2022-05-10,true,Principal architect
4,Diana Prince,28,95000.25,2024-03-01,true,Team lead
`;
  fs.writeFileSync(tempCsvPath, csvContent, 'utf8');

  console.log('1. Testing CSV Parser...');
  const csvResult = await parseCsvStream(tempCsvPath, 10);
  console.log('  Rows detected:', csvResult.rowCount);
  console.log('  Columns detected:', csvResult.columnCount);
  console.log('  Delimiter detected:', csvResult.delimiter);
  console.log('  Columns inferred:', csvResult.columns.map(c => `${c.name} (${c.dataType})`).join(', '));
  console.log('  Preview rows length:', csvResult.previewData.length);

  if (csvResult.rowCount !== 4) throw new Error(`Expected 4 rows, got ${csvResult.rowCount}`);
  if (csvResult.columns.find(c => c.name === 'id').dataType !== 'number') throw new Error('Expected id to be number');
  if (csvResult.columns.find(c => c.name === 'joinedDate').dataType !== 'date') throw new Error('Expected joinedDate to be date');
  if (csvResult.columns.find(c => c.name === 'isActive').dataType !== 'boolean') throw new Error('Expected isActive to be boolean');
  fs.unlinkSync(tempCsvPath);
  console.log('  ✅ CSV Stream Parser passed!\n');

  // 2. Test JSON Array Stream Parser
  console.log('2. Testing JSON Stream Parser...');
  const tempJsonPath = path.join(os.tmpdir(), `test_${Date.now()}.json`);
  const jsonContent = JSON.stringify([
    { eventId: 101, eventName: 'System Boot', timestamp: '2026-11-15T09:00:00Z', isCritical: false, metadata: { ip: '127.0.0.1' } },
    { eventId: 102, eventName: 'Login Attempt', timestamp: '2026-11-15T09:05:00Z', isCritical: false, metadata: null },
    { eventId: 103, eventName: 'Failed Auth', timestamp: '2026-11-15T09:07:00Z', isCritical: true, metadata: { attempt: 3 } }
  ], null, 2);
  fs.writeFileSync(tempJsonPath, jsonContent, 'utf8');

  const jsonResult = await parseJsonStream(tempJsonPath, false, 10);
  console.log('  Rows detected:', jsonResult.rowCount);
  console.log('  Columns detected:', jsonResult.columnCount);
  console.log('  Columns inferred:', jsonResult.columns.map(c => `${c.name} (${c.dataType})`).join(', '));
  console.log('  Preview rows length:', jsonResult.previewData.length);

  if (jsonResult.rowCount !== 3) throw new Error(`Expected 3 rows, got ${jsonResult.rowCount}`);
  if (jsonResult.columns.find(c => c.name === 'eventId').dataType !== 'number') throw new Error('Expected eventId to be number');
  fs.unlinkSync(tempJsonPath);
  console.log('  ✅ JSON Stream Parser passed!\n');

  // 3. Test B2 Configuration status
  console.log('3. Checking Backblaze B2 Config...');
  console.log('  Backblaze B2 Configured:', isB2Configured());
  console.log('  ✅ Backblaze check passed (Graceful fallback active if unconfigured).\n');

  console.log('🎉 All dataset module tests passed successfully!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
