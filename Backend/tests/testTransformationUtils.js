const assert = require('assert');
const {
  renameColumns,
  selectColumns,
  toString,
  toNumber,
  toDate,
  convertValue,
  convertColumnTypes,
  applyTransformations
} = require('../utils/transformationUtils');
const transformationEngine = require('../utils/transformationEngine');

function runTests() {
  console.log('Running Transformation Utility Module Tests...\n');

  // =========================================================================
  // 1. Column Renaming Tests
  // =========================================================================
  console.log('--- [1] Column Renaming Tests ---');

  const renameInputRecord = {
    cust_id: 'C-101',
    full_name: 'Alice Smith',
    signup_dt: '2026-01-15',
    unused_col: 'ignore'
  };

  const renamedRecord = renameColumns(renameInputRecord, {
    cust_id: 'customerId',
    full_name: 'customerName',
    signup_dt: 'signupDate',
    non_existent: 'shouldNotAppear'
  });

  console.log('  Sample Input (record): ', JSON.stringify(renameInputRecord));
  console.log('  Sample Output (record):', JSON.stringify(renamedRecord));

  assert.deepStrictEqual(renamedRecord, {
    customerId: 'C-101',
    customerName: 'Alice Smith',
    signupDate: '2026-01-15',
    unused_col: 'ignore'
  });
  // Ensure input was not mutated
  assert.strictEqual('cust_id' in renameInputRecord, true);
  assert.strictEqual('customerId' in renameInputRecord, false);

  // Batch dataset rename + array-style mapping [{ sourceField, targetField }]
  const renameInputRows = [
    { first_name: 'Bob', last_name: 'Lee', age_yrs: '30' },
    { first_name: 'Cara', last_name: 'Diaz', age_yrs: '27' }
  ];
  const renamedRows = renameColumns(renameInputRows, [
    { sourceField: 'first_name', targetField: 'firstName' },
    { sourceField: 'age_yrs', targetField: 'age' }
  ]);
  assert.deepStrictEqual(renamedRows, [
    { firstName: 'Bob', last_name: 'Lee', age: '30' },
    { firstName: 'Cara', last_name: 'Diaz', age: '27' }
  ]);

  // Key swap safety: { a: 'b', b: 'a' }
  const swapped = renameColumns({ a: 1, b: 2 }, { a: 'b', b: 'a' });
  assert.deepStrictEqual(swapped, { b: 1, a: 2 });
  console.log('  [PASS] Column renaming (single, batch, array map, swap, immutability)\n');

  // =========================================================================
  // 2. Column Selection Tests (Include / Exclude)
  // =========================================================================
  console.log('--- [2] Column Selection (Include / Exclude) Tests ---');

  const selectionInput = [
    { id: 1, name: 'Alice', email: 'alice@example.com', passwordHash: 'secret1', internalNote: 'vip' },
    { id: 2, name: 'Bob', email: 'bob@example.com', passwordHash: 'secret2', internalNote: 'std' }
  ];

  // 2a. Include specific columns
  const includedOnly = selectColumns(selectionInput, { include: ['id', 'name', 'email'] });
  console.log('  Sample Input (row 0):         ', JSON.stringify(selectionInput[0]));
  console.log('  Sample Output (include):      ', JSON.stringify(includedOnly[0]));
  assert.deepStrictEqual(includedOnly, [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' }
  ]);

  // 2b. Exclude specific columns
  const excludedOnly = selectColumns(selectionInput, { exclude: ['passwordHash', 'internalNote'] });
  console.log('  Sample Output (exclude):      ', JSON.stringify(excludedOnly[0]));
  assert.deepStrictEqual(excludedOnly, [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' }
  ]);

  // 2c. Combined include + exclude + shorthand array + mode syntax
  const combinedSelect = selectColumns(selectionInput[0], {
    include: ['id', 'name', 'email', 'internalNote'],
    exclude: ['internalNote']
  });
  assert.deepStrictEqual(combinedSelect, { id: 1, name: 'Alice', email: 'alice@example.com' });

  const shorthandSelect = selectColumns(selectionInput[0], ['id', 'name']);
  assert.deepStrictEqual(shorthandSelect, { id: 1, name: 'Alice' });

  const modeExclude = selectColumns(selectionInput[0], { mode: 'exclude', columns: ['passwordHash', 'internalNote'] });
  assert.deepStrictEqual(modeExclude, { id: 1, name: 'Alice', email: 'alice@example.com' });

  const withMissing = selectColumns({ id: 1 }, { include: ['id', 'region'], includeMissing: true, defaultValue: 'N/A' });
  assert.deepStrictEqual(withMissing, { id: 1, region: 'N/A' });

  // Ensure original array/objects untouched
  assert.strictEqual(selectionInput[0].passwordHash, 'secret1');
  console.log('  [PASS] Column selection (include, exclude, combined, shorthand, immutability)\n');

  // =========================================================================
  // 3. Basic Data Type Conversion Tests (String, Number, Date)
  // =========================================================================
  console.log('--- [3] Data Type Conversion Tests (String, Number, Date) ---');

  // 3a. String conversion
  assert.strictEqual(toString(42), '42');
  assert.strictEqual(toString(true), 'true');
  assert.strictEqual(toString('  hello  ', { trim: true }), 'hello');
  assert.strictEqual(toString(new Date('2026-11-25T00:00:00.000Z')), '2026-11-25T00:00:00.000Z');
  assert.strictEqual(toString(null), null);
  assert.strictEqual(toString(undefined, { defaultValue: '' }), '');
  assert.strictEqual(convertValue(1001, 'String'), '1001');
  console.log('  Sample String conversions: 42 -> "42", true -> "true", Date -> ISO string');

  // 3b. Number conversion
  assert.strictEqual(toNumber('42'), 42);
  assert.strictEqual(toNumber('-15.75'), -15.75);
  assert.strictEqual(toNumber('  $1,250.50  '), 1250.5);
  assert.strictEqual(toNumber('85.5%'), 85.5);
  assert.strictEqual(toNumber(true), 1);
  assert.strictEqual(toNumber(false), 0);
  assert.strictEqual(toNumber(''), null);
  assert.strictEqual(toNumber('invalid', { defaultValue: 0 }), 0);
  assert.throws(() => toNumber('not-a-number', { strict: true }), /Cannot convert string/);
  assert.strictEqual(convertValue('99.9', 'Number'), 99.9);
  console.log('  Sample Number conversions: "$1,250.50" -> 1250.5, "85.5%" -> 85.5, true -> 1');

  // 3c. Date conversion
  const isoDate = toDate('2026-11-25T10:30:00Z');
  assert(isoDate instanceof Date, 'Expected Date instance');
  assert.strictEqual(isoDate.toISOString(), '2026-11-25T10:30:00.000Z');

  const slashYmd = toDate('2026/11/25');
  assert(slashYmd instanceof Date);
  assert.strictEqual(slashYmd.toISOString(), '2026-11-25T00:00:00.000Z');

  const dmyDate = toDate('25-11-2026');
  assert(dmyDate instanceof Date);
  assert.strictEqual(dmyDate.toISOString(), '2026-11-25T00:00:00.000Z');

  const epochMs = 1795564800000;
  assert.strictEqual(toDate(epochMs, { asISOString: true }), new Date(epochMs).toISOString());
  assert.strictEqual(toDate('2026-02-30'), null);
  assert.strictEqual(toDate('not-a-date'), null);
  assert.strictEqual(toDate('', { defaultValue: null }), null);
  assert.throws(() => toDate('not-a-date', { strict: true }), /Cannot convert string/);
  assert.strictEqual(convertValue('2026-05-01', 'Date', { asISOString: true }), '2026-05-01T00:00:00.000Z');
  console.log('  Sample Date conversions: "2026-11-25T10:30:00Z" -> Date, "25-11-2026" -> Date');

  // 3d. Column-level type conversions on dataset records
  const rawTypedRows = [
    { orderId: 1001, amount: '$249.99', orderedAt: '2026-11-20' },
    { orderId: 1002, amount: '1,500', orderedAt: '25/11/2026' }
  ];
  const convertedRows = convertColumnTypes(rawTypedRows, {
    orderId: 'String',
    amount: 'Number',
    orderedAt: { type: 'Date', asISOString: true }
  });
  console.log('  Sample Input (typed row 0): ', JSON.stringify(rawTypedRows[0]));
  console.log('  Sample Output (typed row 0):', JSON.stringify(convertedRows[0]));
  assert.deepStrictEqual(convertedRows, [
    { orderId: '1001', amount: 249.99, orderedAt: '2026-11-20T00:00:00.000Z' },
    { orderId: '1002', amount: 1500, orderedAt: '2026-11-25T00:00:00.000Z' }
  ]);
  console.log('  [PASS] String, Number, and Date conversions\n');

  // =========================================================================
  // 4. End-to-End Pipeline & Backend Engine Integration Tests
  // =========================================================================
  console.log('--- [4] Pipeline & Backend Integration Tests ---');

  const rawDataset = [
    {
      usr_id: 501,
      usr_name: '  Aarav Patel  ',
      monthly_fee: '$79.50',
      joined_on: '2026-03-10',
      secret_token: 'tok_abc'
    },
    {
      usr_id: 502,
      usr_name: '  Meera Nair  ',
      monthly_fee: '120',
      joined_on: '15-04-2026',
      secret_token: 'tok_xyz'
    }
  ];

  const pipelineOutput = applyTransformations(rawDataset, {
    select: { exclude: ['secret_token'] },
    rename: {
      usr_id: 'userId',
      usr_name: 'fullName',
      monthly_fee: 'monthlyFee',
      joined_on: 'joinedAt'
    },
    types: {
      userId: { type: 'String' },
      fullName: { type: 'String', trim: true },
      monthlyFee: 'Number',
      joinedAt: { type: 'Date', asISOString: true }
    }
  });

  console.log('  Sample Pipeline Input (row 0): ', JSON.stringify(rawDataset[0]));
  console.log('  Sample Pipeline Output (row 0):', JSON.stringify(pipelineOutput[0]));

  assert.deepStrictEqual(pipelineOutput, [
    {
      userId: '501',
      fullName: 'Aarav Patel',
      monthlyFee: 79.5,
      joinedAt: '2026-03-10T00:00:00.000Z'
    },
    {
      userId: '502',
      fullName: 'Meera Nair',
      monthlyFee: 120,
      joinedAt: '2026-04-15T00:00:00.000Z'
    }
  ]);

  // Verify ordered steps pipeline format
  const stepsOutput = applyTransformations(rawDataset[0], {
    steps: [
      { action: 'rename', map: { usr_id: 'id', usr_name: 'name' } },
      { action: 'select', include: ['id', 'name', 'monthly_fee'] },
      { action: 'convertTypes', types: { id: 'String', name: { type: 'String', trim: true }, monthly_fee: 'Number' } }
    ]
  });
  assert.deepStrictEqual(stepsOutput, {
    id: '501',
    name: 'Aarav Patel',
    monthly_fee: 79.5
  });

  // Verify transformationEngine integration works seamlessly
  const engineResult = transformationEngine.transformDataset(rawDataset, {
    select: { exclude: ['secret_token'] },
    columns: {
      usr_name: ['trim', 'uppercase']
    },
    rename: {
      usr_id: 'id',
      usr_name: 'name',
      monthly_fee: 'fee',
      joined_on: 'joinedAt'
    },
    types: {
      id: 'String',
      fee: 'Number',
      joinedAt: { type: 'Date', asISOString: true }
    }
  });

  assert.deepStrictEqual(engineResult[0], {
    id: '501',
    name: 'AARAV PATEL',
    fee: 79.5,
    joinedAt: '2026-03-10T00:00:00.000Z'
  });

  console.log('  [PASS] Composable pipeline and transformationEngine integration\n');
  console.log('ALL TRANSFORMATION UTILITY TESTS PASSED!');
}

try {
  runTests();
  process.exit(0);
} catch (err) {
  console.error('Transformation utility test failed:', err);
  process.exit(1);
}
