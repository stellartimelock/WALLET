import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addBill,
  addJob,
  createLedger,
  importLedger,
  updateBill,
} from '../src/ledger.js';

const people = [
  { name: 'Isaac', publicKey: 'GA' },
  { name: 'Buddy', publicKey: 'GB' },
];
const actor = { name: 'Isaac', publicKey: 'GA' };

function billInput(extra = {}) {
  return {
    name: 'Rent - October',
    total: 1800,
    shares: [
      { publicKey: 'GA', amount: 900 },
      { publicKey: 'GB', amount: 900 },
    ],
    payments: [
      { publicKey: 'GA', amount: 1000 },
      { publicKey: 'GB', amount: 800 },
    ],
    ...extra,
  };
}

test('edits append history and bump the revision', () => {
  let ledger = createLedger(people, 'USD', actor);
  assert.equal(ledger.history[0].summary, 'Created the tally.');
  ledger = addBill(ledger, billInput(), actor);
  assert.equal(ledger.rev, 2);
  assert.match(ledger.history.at(-1).summary, /Added bill “Rent - October”/);
  assert.equal(ledger.history.at(-1).pk, 'GA');
  const id = ledger.bills[0].id;
  ledger = updateBill(ledger, id, billInput({
    payments: [
      { publicKey: 'GA', amount: 1800 },
      { publicKey: 'GB', amount: 0 },
    ],
  }), actor);
  assert.match(ledger.history.at(-1).summary, /Isaac paid/);
  assert.equal(ledger.rev, 3);
  const same = updateBill(ledger, id, {
    ...ledger.bills[0],
  }, actor);
  assert.equal(same, ledger);
});

test('jobs require the split and the holders to match what was received', () => {
  const ledger = createLedger(people, 'USD', actor);
  assert.throws(() => addJob(ledger, {
    name: 'Fence repair',
    expected: 500,
    received: 500,
    splits: [
      { publicKey: 'GA', amount: 200 },
      { publicKey: 'GB', amount: 200 },
    ],
    receipts: [
      { publicKey: 'GA', amount: 500 },
      { publicKey: 'GB', amount: 0 },
    ],
  }, actor), /Splits/);
});

test('import replaces items and keeps a history note', () => {
  const ledger = addBill(createLedger(people, 'USD', actor), billInput(), actor);
  const next = importLedger(ledger, {
    people: [{ publicKey: 'GA', name: 'Isaac' }, { publicKey: 'GB', name: 'Alex' }],
    bills: [],
    jobs: [{
      name: 'Fence repair',
      expected: 400,
      received: 400,
      splits: [
        { publicKey: 'GA', amount: 200 },
        { publicKey: 'GB', amount: 200 },
      ],
      receipts: [
        { publicKey: 'GA', amount: 400 },
        { publicKey: 'GB', amount: 0 },
      ],
    }],
  }, actor);
  assert.equal(next.bills.length, 0);
  assert.equal(next.jobs.length, 1);
  assert.equal(next.people[1].name, 'Alex');
  assert.match(next.history.at(-1).summary, /Imported a JSON backup \(0 bills, 1 job\)/);
  assert.ok(next.history.some((item) => item.action === 'create'));
});
