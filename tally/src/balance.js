import { cents } from './money.js';

function amountFor(list, publicKey) {
  const row = (list || []).find((item) => item.publicKey === publicKey);
  return cents(row ? row.amount : 0);
}

function creditsForPeople(people, shares, paid) {
  const a = people[0].publicKey;
  const b = people[1].publicKey;
  return {
    [a]: paid[a] - shares[a],
    [b]: paid[b] - shares[b],
  };
}

// Positive means person B owes person A. External unpaid amounts are not a debt
// between the two people, so a positive credit only counts up to what the
// other person is short.
export function directed(creditA, creditB) {
  const toA = Math.min(Math.max(creditA, 0), Math.max(-creditB, 0));
  const toB = Math.min(Math.max(creditB, 0), Math.max(-creditA, 0));
  return toA - toB;
}

export function billEffect(bill, people) {
  const a = people[0].publicKey;
  const b = people[1].publicKey;
  const shares = {
    [a]: amountFor(bill.shares, a),
    [b]: amountFor(bill.shares, b),
  };
  const paid = {
    [a]: amountFor(bill.payments, a),
    [b]: amountFor(bill.payments, b),
  };
  const total = cents(bill.total);
  const paidTotal = paid[a] + paid[b];
  const credits = creditsForPeople(people, shares, paid);
  return {
    directed: directed(credits[a], credits[b]),
    remaining: Math.max(0, total - paidTotal),
    overpaid: Math.max(0, paidTotal - total),
  };
}

export function jobEffect(job, people) {
  const a = people[0].publicKey;
  const b = people[1].publicKey;
  const splits = {
    [a]: amountFor(job.splits, a),
    [b]: amountFor(job.splits, b),
  };
  const receipts = {
    [a]: amountFor(job.receipts, a),
    [b]: amountFor(job.receipts, b),
  };
  // Positive credit means that person is owed money (their split exceeds
  // what they currently hold).
  const credits = {
    [a]: splits[a] - receipts[a],
    [b]: splits[b] - receipts[b],
  };
  return {
    directed: directed(credits[a], credits[b]),
    expectedGap: Math.max(0, cents(job.expected) - cents(job.received)),
  };
}

export function tallyBalance(ledger) {
  const people = ledger.people;
  let bills = 0;
  let jobs = 0;
  let remaining = 0;
  for (const bill of ledger.bills) {
    const effect = billEffect(bill, people);
    bills += effect.directed;
    remaining += effect.remaining;
  }
  for (const job of ledger.jobs) {
    jobs += jobEffect(job, people).directed;
  }
  const net = bills + jobs;
  const [a, b] = people;
  let sentence = 'Settled up';
  let tone = 'settled';
  if (net > 0) {
    sentence = `${b.name} owes ${a.name}`;
    tone = 'owe';
  } else if (net < 0) {
    sentence = `${a.name} owes ${b.name}`;
    tone = 'owe';
  }
  return {
    net,
    amount: Math.abs(net),
    sentence,
    tone,
    bills,
    jobs,
    remaining,
    people,
  };
}
