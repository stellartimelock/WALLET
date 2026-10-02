import { cents, formatMoney, parseMoney, splitEven } from './money.js';

const NAME_MAX = 80;
const HISTORY_MAX = 80;

function id() {
  return crypto.randomUUID();
}

function now() {
  return new Date().toISOString();
}

function cleanName(value, label) {
  const name = String(value ?? '').trim();
  if (!name) throw new Error(`${label} needs a name`);
  if (name.length > NAME_MAX) throw new Error(`${label} name is too long`);
  return name;
}

function pairAmounts(list, people, label) {
  return people.map((person) => ({
    publicKey: person.publicKey,
    amount: fromCentsSafe(parseMoney(amountOf(list, person.publicKey)), label),
  }));
}

function amountOf(list, publicKey) {
  const row = (list || []).find((item) => item.publicKey === publicKey);
  return row ? row.amount : 0;
}

function fromCentsSafe(c, label) {
  if (c < 0) throw new Error(`${label} cannot be negative`);
  return c / 100;
}

function sumCents(list) {
  return (list || []).reduce((n, row) => n + cents(row.amount), 0);
}

function assertSum(list, totalCents, label) {
  if (sumCents(list) !== totalCents) {
    throw new Error(`${label} have to add up`);
  }
}

export function createLedger(people, currency, actor) {
  return {
    v: 1,
    rev: 1,
    currency,
    updatedAt: now(),
    people: people.map((person) => ({
      publicKey: person.publicKey,
      name: person.name,
    })),
    bills: [],
    jobs: [],
    history: [
      entry(actor, 'create', 'Created the tally.'),
    ],
  };
}

function entry(actor, action, summary) {
  return {
    id: id(),
    at: now(),
    pk: actor.publicKey,
    name: actor.name,
    action,
    summary,
  };
}

function touch(ledger, actor, action, summary) {
  return {
    ...ledger,
    rev: ledger.rev + 1,
    updatedAt: now(),
    history: [...ledger.history, entry(actor, action, summary)].slice(-HISTORY_MAX),
  };
}

function personName(ledger, publicKey) {
  return ledger.people.find((person) => person.publicKey === publicKey)?.name || 'Someone';
}

function money(ledger, amount) {
  return formatMoney(cents(amount), ledger.currency);
}

export function addBill(ledger, input, actor) {
  const bill = normalizeBill(input, ledger.people);
  return {
    ...touch(ledger, actor, 'add-bill', `Added bill “${bill.name}” (${money(ledger, bill.total)}).`),
    bills: [...ledger.bills, bill],
  };
}

export function updateBill(ledger, billId, input, actor) {
  const current = ledger.bills.find((bill) => bill.id === billId);
  if (!current) throw new Error('That bill is gone');
  const next = normalizeBill({ ...input, id: billId }, ledger.people);
  const summary = billDiff(ledger, current, next);
  if (!summary) return ledger;
  return {
    ...touch(ledger, actor, 'update-bill', summary),
    bills: ledger.bills.map((bill) => (bill.id === billId ? next : bill)),
  };
}

export function deleteBill(ledger, billId, actor) {
  const current = ledger.bills.find((bill) => bill.id === billId);
  if (!current) throw new Error('That bill is gone');
  return {
    ...touch(ledger, actor, 'delete-bill', `Removed bill “${current.name}”.`),
    bills: ledger.bills.filter((bill) => bill.id !== billId),
  };
}

export function addJob(ledger, input, actor) {
  const job = normalizeJob(input, ledger.people);
  return {
    ...touch(ledger, actor, 'add-job', `Added job “${job.name}” (received ${money(ledger, job.received)}).`),
    jobs: [...ledger.jobs, job],
  };
}

export function updateJob(ledger, jobId, input, actor) {
  const current = ledger.jobs.find((job) => job.id === jobId);
  if (!current) throw new Error('That job is gone');
  const next = normalizeJob({ ...input, id: jobId }, ledger.people);
  const summary = jobDiff(ledger, current, next);
  if (!summary) return ledger;
  return {
    ...touch(ledger, actor, 'update-job', summary),
    jobs: ledger.jobs.map((job) => (job.id === jobId ? next : job)),
  };
}

export function deleteJob(ledger, jobId, actor) {
  const current = ledger.jobs.find((job) => job.id === jobId);
  if (!current) throw new Error('That job is gone');
  return {
    ...touch(ledger, actor, 'delete-job', `Removed job “${current.name}”.`),
    jobs: ledger.jobs.filter((job) => job.id !== jobId),
  };
}

export function renamePeople(ledger, names, actor) {
  const nextPeople = ledger.people.map((person, index) => ({
    ...person,
    name: cleanName(names[index], 'Each person'),
  }));
  const changes = [];
  ledger.people.forEach((person, index) => {
    if (person.name !== nextPeople[index].name) {
      changes.push(`Renamed ${person.name} to ${nextPeople[index].name}.`);
    }
  });
  if (!changes.length) return ledger;
  return {
    ...touch(ledger, actor, 'rename', changes.join(' ')),
    people: nextPeople,
  };
}

export function importLedger(current, raw, actor) {
  const bills = Array.isArray(raw.bills) ? raw.bills.map((bill) => normalizeBill(bill, current.people)) : null;
  const jobs = Array.isArray(raw.jobs) ? raw.jobs.map((job) => normalizeJob(job, current.people)) : null;
  if (!bills || !jobs) throw new Error('The backup needs bills and jobs arrays');
  let people = current.people;
  if (Array.isArray(raw.people)) {
    people = current.people.map((person) => {
      const incoming = raw.people.find((item) => item && item.publicKey === person.publicKey);
      return incoming && incoming.name ? { ...person, name: cleanName(incoming.name, 'Each person') } : person;
    });
  }
  const base = { ...current, people, bills, jobs };
  return touch(
    base,
    actor,
    'import',
    `Imported a JSON backup (${bills.length} bill${bills.length === 1 ? '' : 's'}, ${jobs.length} job${jobs.length === 1 ? '' : 's'}).`,
  );
}

export function normalizeBill(input, people) {
  const name = cleanName(input.name, 'A bill');
  const total = fromCentsSafe(parseMoney(input.total), 'The bill total');
  const shares = pairAmounts(input.shares, people, 'A share');
  const payments = pairAmounts(input.payments, people, 'A payment');
  assertSum(shares, cents(total), 'Shares');
  return {
    id: typeof input.id === 'string' && input.id ? input.id : id(),
    name,
    total,
    shares,
    payments,
  };
}

export function normalizeJob(input, people) {
  const name = cleanName(input.name, 'A job');
  const expected = fromCentsSafe(parseMoney(input.expected), 'Expected pay');
  const received = fromCentsSafe(parseMoney(input.received), 'Received pay');
  const splits = pairAmounts(input.splits, people, 'A split');
  const receipts = pairAmounts(input.receipts, people, 'An amount held');
  assertSum(splits, cents(received), 'Splits');
  assertSum(receipts, cents(received), 'Amounts held');
  return {
    id: typeof input.id === 'string' && input.id ? input.id : id(),
    name,
    expected,
    received,
    splits,
    receipts,
  };
}

function billDiff(ledger, prev, next) {
  const bits = [];
  if (prev.name !== next.name) bits.push(`name “${prev.name}” → “${next.name}”`);
  if (cents(prev.total) !== cents(next.total)) {
    bits.push(`total ${money(ledger, prev.total)} → ${money(ledger, next.total)}`);
  }
  for (const person of ledger.people) {
    const beforeShare = amountOf(prev.shares, person.publicKey);
    const afterShare = amountOf(next.shares, person.publicKey);
    if (cents(beforeShare) !== cents(afterShare)) {
      bits.push(`${person.name} share ${money(ledger, beforeShare)} → ${money(ledger, afterShare)}`);
    }
    const beforePaid = amountOf(prev.payments, person.publicKey);
    const afterPaid = amountOf(next.payments, person.publicKey);
    if (cents(beforePaid) !== cents(afterPaid)) {
      bits.push(`${person.name} paid ${money(ledger, beforePaid)} → ${money(ledger, afterPaid)}`);
    }
  }
  if (!bits.length) return '';
  return `Updated bill “${next.name}”: ${bits.join('; ')}.`;
}

function jobDiff(ledger, prev, next) {
  const bits = [];
  if (prev.name !== next.name) bits.push(`name “${prev.name}” → “${next.name}”`);
  if (cents(prev.expected) !== cents(next.expected)) {
    bits.push(`expected ${money(ledger, prev.expected)} → ${money(ledger, next.expected)}`);
  }
  if (cents(prev.received) !== cents(next.received)) {
    bits.push(`received ${money(ledger, prev.received)} → ${money(ledger, next.received)}`);
  }
  for (const person of ledger.people) {
    const beforeSplit = amountOf(prev.splits, person.publicKey);
    const afterSplit = amountOf(next.splits, person.publicKey);
    if (cents(beforeSplit) !== cents(afterSplit)) {
      bits.push(`${person.name} split ${money(ledger, beforeSplit)} → ${money(ledger, afterSplit)}`);
    }
    const beforeHeld = amountOf(prev.receipts, person.publicKey);
    const afterHeld = amountOf(next.receipts, person.publicKey);
    if (cents(beforeHeld) !== cents(afterHeld)) {
      bits.push(`${person.name} holds ${money(ledger, beforeHeld)} → ${money(ledger, afterHeld)}`);
    }
  }
  if (!bits.length) return '';
  return `Updated job “${next.name}”: ${bits.join('; ')}.`;
}

export function blankBill(people, total = 0) {
  const [first, second] = splitEven(cents(total));
  return {
    name: '',
    total,
    shares: people.map((person, index) => ({
      publicKey: person.publicKey,
      amount: (index === 0 ? first : second) / 100,
    })),
    payments: people.map((person) => ({ publicKey: person.publicKey, amount: 0 })),
  };
}

export function blankJob(people, holderPublicKey) {
  return {
    name: '',
    expected: 0,
    received: 0,
    splits: people.map((person) => ({ publicKey: person.publicKey, amount: 0 })),
    receipts: people.map((person) => ({
      publicKey: person.publicKey,
      amount: person.publicKey === holderPublicKey ? 0 : 0,
    })),
  };
}
