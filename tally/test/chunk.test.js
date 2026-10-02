import assert from 'node:assert/strict';
import test from 'node:test';
import { Keypair, Networks, Operation, TransactionBuilder, Account, BASE_FEE } from '@stellar/stellar-base';
import { envelopeFromData, planEntries } from '../src/chunk.js';
import { decodeHorizonData } from '../src/storage.js';
import { utf8 } from '../src/bytes.js';

test('chunks survive a Stellar manageData round trip', () => {
  const text = JSON.stringify({ hello: 'tally', bytes: '✓'.repeat(80) });
  const planned = planEntries(text, ['stl:h', 'stl:00', 'stl:0a', 'other']);
  assert.ok(planned.deletes.some((op) => op.name === 'stl:0a' && op.value === null));
  assert.ok(planned.writes.every((op) => op.value.length <= 64));

  const kp = Keypair.random();
  const tx = new TransactionBuilder(new Account(kp.publicKey(), '10'), {
    fee: String(BASE_FEE * planned.writes.length),
    networkPassphrase: Networks.TESTNET,
  });
  for (const op of planned.writes) tx.addOperation(Operation.manageData(op));
  const built = tx.setTimeout(30).build();
  const again = TransactionBuilder.fromXDR(built.toXDR(), Networks.TESTNET);
  const stored = {};
  for (const op of again.operations) {
    stored[op.name] = Buffer.from(op.value).toString('base64');
  }
  const ascii = decodeHorizonData(stored);
  assert.equal(envelopeFromData(ascii), text);
  assert.ok(!ascii.other);
});

test('tampered chunks fail the checksum', () => {
  const planned = planEntries('{"v":1}', []);
  const data = Object.fromEntries(planned.writes.map((op) => [op.name, op.value]));
  const chunk = Object.keys(data).find((name) => name !== 'stl:h');
  const flipped = data[chunk][0] === 'A' ? 'B' : 'A';
  data[chunk] = flipped + data[chunk].slice(1);
  assert.throws(() => envelopeFromData(data), /checksum/);
});

test('oversized envelopes are rejected', () => {
  const huge = 'x'.repeat(48 * 100);
  assert.throws(() => planEntries(huge, []), /too large/);
  assert.equal(utf8(huge).length > 48 * 99, true);
});
