import assert from 'node:assert/strict';
import test from 'node:test';
import { billEffect, jobEffect, tallyBalance } from '../src/balance.js';
import { splitEven } from '../src/money.js';

const isaac = { name: 'Isaac', publicKey: 'GISAAC' };
const buddy = { name: 'Buddy', publicKey: 'GBUDDY' };
const people = [isaac, buddy];

function bill(total, isaacShare, buddyShare, isaacPaid, buddyPaid) {
  return {
    total,
    shares: [
      { publicKey: isaac.publicKey, amount: isaacShare },
      { publicKey: buddy.publicKey, amount: buddyShare },
    ],
    payments: [
      { publicKey: isaac.publicKey, amount: isaacPaid },
      { publicKey: buddy.publicKey, amount: buddyPaid },
    ],
  };
}

test('split even gives the extra cent to the second person', () => {
  assert.deepEqual(splitEven(1001), [500, 501]);
});

test('bill: full payment by one person', () => {
  const effect = billEffect(bill(1800, 900, 900, 1800, 0), people);
  assert.equal(effect.directed, 90000);
  assert.equal(effect.remaining, 0);
});

test('bill: partial cover is only the overpayment', () => {
  const effect = billEffect(bill(1800, 900, 900, 1000, 0), people);
  assert.equal(effect.directed, 10000);
  assert.equal(effect.remaining, 80000);
});

test('bill: both short does not create a debt between them', () => {
  const effect = billEffect(bill(1800, 900, 900, 500, 500), people);
  assert.equal(effect.directed, 0);
  assert.equal(effect.remaining, 80000);
});

test('bill: unequal shares', () => {
  const effect = billEffect(bill(1000, 750, 250, 1000, 0), people);
  assert.equal(effect.directed, 25000);
});

test('job: holder owes the other share', () => {
  const effect = jobEffect({
    expected: 500,
    received: 500,
    splits: [
      { publicKey: isaac.publicKey, amount: 250 },
      { publicKey: buddy.publicKey, amount: 250 },
    ],
    receipts: [
      { publicKey: isaac.publicKey, amount: 500 },
      { publicKey: buddy.publicKey, amount: 0 },
    ],
  }, people);
  assert.equal(effect.directed, -25000);
});

test('net balance subtracts jobs from bills', () => {
  const ledger = {
    currency: 'USD',
    people,
    bills: [bill(1800, 900, 900, 1000, 800)],
    jobs: [{
      expected: 500,
      received: 500,
      splits: [
        { publicKey: isaac.publicKey, amount: 250 },
        { publicKey: buddy.publicKey, amount: 250 },
      ],
      receipts: [
        { publicKey: isaac.publicKey, amount: 500 },
        { publicKey: buddy.publicKey, amount: 0 },
      ],
    }],
  };
  const balance = tallyBalance(ledger);
  assert.equal(balance.bills, 10000);
  assert.equal(balance.jobs, -25000);
  assert.equal(balance.net, -15000);
  assert.equal(balance.sentence, 'Isaac owes Buddy');
});

test('overpaying the biller is not the other person\'s debt', () => {
  const ledger = {
    currency: 'USD',
    people,
    bills: [bill(1800, 900, 900, 1900, 0)],
    jobs: [],
  };
  const balance = tallyBalance(ledger);
  assert.equal(balance.net, 90000);
  assert.equal(balance.sentence, 'Buddy owes Isaac');
});
