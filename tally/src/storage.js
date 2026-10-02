import {
  Account,
  BASE_FEE,
  Keypair,
  Operation,
  TransactionBuilder,
} from '@stellar/stellar-base';
import { b64ToBytes, utf8Decode } from './bytes.js';
import { batchEntries, envelopeFromData, planEntries } from './chunk.js';

export class ConflictError extends Error {
  constructor() {
    super('The other person saved changes. Reload the tally before editing.');
    this.name = 'ConflictError';
  }
}

const GITHUB = 'https://api.github.com';

function storageKey(slug, name) {
  return `stl-tally-${slug}-${name}`;
}

export function readLocalSettings(slug, config) {
  const mode = localStorage.getItem(storageKey(slug, 'mode')) || 'stellar';
  const gistId = localStorage.getItem(storageKey(slug, 'gist-id')) || config.gistId || '';
  const token = localStorage.getItem(storageKey(slug, 'gist-token')) || '';
  return { mode, gistId, token, hasToken: Boolean(token) };
}

export function writeLocalSettings(slug, patch) {
  if (patch.mode) localStorage.setItem(storageKey(slug, 'mode'), patch.mode);
  if (typeof patch.gistId === 'string') localStorage.setItem(storageKey(slug, 'gist-id'), patch.gistId.trim());
  if (typeof patch.token === 'string' && patch.token.trim()) {
    localStorage.setItem(storageKey(slug, 'gist-token'), patch.token.trim().replace(/^Bearer\s+/i, ''));
  }
}

export function clearGistToken(slug) {
  localStorage.removeItem(storageKey(slug, 'gist-token'));
}

async function fetchAccount(config) {
  let response;
  try {
    response = await fetch(`${config.horizon}/accounts/${config.dataAccount}`);
  } catch {
    throw new Error('Horizon could not be reached.');
  }
  if (response.status === 404) {
    const error = new Error('The Stellar data account does not exist yet.');
    error.code = 'missing-account';
    throw error;
  }
  if (!response.ok) throw new Error(`Horizon returned ${response.status}.`);
  return response.json();
}

export function decodeHorizonData(data) {
  const out = {};
  for (const [name, value] of Object.entries(data || {})) {
    if (typeof value !== 'string' || !value) continue;
    out[name] = utf8Decode(b64ToBytes(value));
  }
  return out;
}

export async function readStellar(config) {
  const account = await fetchAccount(config);
  const text = envelopeFromData(decodeHorizonData(account.data));
  return {
    account,
    envelope: text ? JSON.parse(text) : null,
  };
}

function buildTx(config, sequence, ops) {
  const account = new Account(config.dataAccount, sequence);
  let builder = new TransactionBuilder(account, {
    fee: String(BASE_FEE * ops.length),
    networkPassphrase: config.networkPassphrase,
  });
  for (const op of ops) {
    builder = builder.addOperation(Operation.manageData({
      name: op.name,
      value: op.value,
    }));
  }
  return builder.setTimeout(180).build();
}

function explainHorizon(body) {
  const codes = body?.extras?.result_codes;
  const op = codes?.operations?.find((code) => code && code !== 'op_success');
  const tx = codes?.transaction;
  if (op === 'op_bad_auth' || tx === 'tx_bad_auth') {
    return 'This account is not allowed to write the data account. Add both public keys as signers with weight 1 and set the low threshold to 1.';
  }
  if (op === 'op_low_reserve' || tx === 'tx_insufficient_balance') {
    return 'The data account needs more XLM for the base reserve or the fee.';
  }
  if (tx || op) return `Stellar rejected the save (${tx || ''} ${op || ''}).`.trim();
  if (body?.detail) return body.detail;
  return 'Stellar rejected the save.';
}

async function submitTx(config, xdr) {
  let response;
  try {
    response = await fetch(`${config.horizon}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ tx: xdr }),
    });
  } catch {
    throw new Error('Horizon could not be reached.');
  }
  if (response.ok) return;
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  throw new Error(explainHorizon(body));
}

export async function writeStellar(config, envelope, signXdr) {
  const account = await fetchAccount(config);
  const planned = planEntries(JSON.stringify(envelope), Object.keys(account.data || {}));
  const batches = batchEntries(planned.writes, planned.deletes);
  let sequence = account.sequence;
  for (const batch of batches) {
    const tx = buildTx(config, sequence, batch);
    const signed = await signXdr(tx.toXDR());
    await submitTx(config, signed);
    sequence = (BigInt(sequence) + 1n).toString();
  }
}

function gistHeaders(token) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function gistError(response) {
  if (response.status === 401) return 'GitHub rejected the token.';
  if (response.status === 404) return 'That gist was not found for this token.';
  return `GitHub returned ${response.status}.`;
}

export async function readGist(gistId, token) {
  let response;
  try {
    response = await fetch(`${GITHUB}/gists/${encodeURIComponent(gistId)}`, {
      headers: gistHeaders(token),
    });
  } catch {
    throw new Error('GitHub could not be reached.');
  }
  if (!response.ok) throw new Error(await gistError(response));
  const body = await response.json();
  const file = body.files && (body.files['ledger.json'] || Object.values(body.files)[0]);
  if (!file) return null;
  let content = file.content || '';
  if (file.truncated && file.raw_url) {
    const raw = await fetch(file.raw_url, { headers: gistHeaders(token) });
    if (!raw.ok) throw new Error('Could not read the gist file.');
    content = await raw.text();
  }
  if (!content.trim()) return null;
  return JSON.parse(content);
}

export async function writeGist({ gistId, token, envelope }) {
  const payload = {
    description: 'Stellar TimeLock tally',
    public: false,
    files: {
      'ledger.json': { content: JSON.stringify(envelope) },
    },
  };
  const creating = !gistId;
  let response;
  try {
    response = await fetch(creating ? `${GITHUB}/gists` : `${GITHUB}/gists/${encodeURIComponent(gistId)}`, {
      method: creating ? 'POST' : 'PATCH',
      headers: { ...gistHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('GitHub could not be reached.');
  }
  if (!response.ok) throw new Error(await gistError(response));
  const body = await response.json();
  return body.id;
}

export function signXdrWithSecret(xdr, secret, networkPassphrase) {
  const tx = TransactionBuilder.fromXDR(xdr, networkPassphrase);
  tx.sign(Keypair.fromSecret(secret));
  return tx.toXDR();
}
