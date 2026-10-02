import { StrKey } from '@stellar/stellar-base';
import { ALG_AES, ALG_XCHACHA } from './crypto.js';

const ALGS = new Set([ALG_XCHACHA, ALG_AES]);

export function parseConfig(raw) {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, reason: 'Missing tally config.' };
  }
  const peopleIn = Array.isArray(raw.people) ? raw.people : [];
  if (peopleIn.length !== 2) {
    return { ok: false, reason: 'The allowlist needs exactly two people.' };
  }
  const people = [];
  for (const person of peopleIn) {
    const name = String(person?.name || '').trim();
    const publicKey = String(person?.publicKey || '').trim();
    if (!name) return { ok: false, reason: 'Each person needs a name in config.js.' };
    if (!StrKey.isValidEd25519PublicKey(publicKey)) {
      return {
        ok: false,
        reason: `Add a Stellar public key for ${name} in config.js.`,
      };
    }
    people.push({
      name,
      publicKey,
      rawPublicKey: new Uint8Array(StrKey.decodeEd25519PublicKey(publicKey)),
    });
  }
  if (people[0].publicKey === people[1].publicKey) {
    return { ok: false, reason: 'The two public keys have to be different.' };
  }
  const alg = raw.alg || ALG_XCHACHA;
  if (!ALGS.has(alg)) return { ok: false, reason: 'Unsupported cipher in config.js.' };
  const currency = String(raw.currency || 'USD').trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) return { ok: false, reason: 'Currency must be a 3-letter code.' };
  const horizon = String(raw.horizon || 'https://horizon.stellar.org').trim().replace(/\/$/, '');
  if (!/^https:\/\//.test(horizon)) return { ok: false, reason: 'Horizon URL must start with https://' };
  const networkPassphrase = String(
    raw.networkPassphrase || 'Public Global Stellar Network ; September 2015',
  ).trim();
  const dataAccount = String(raw.dataAccount || '').trim();
  if (dataAccount && !StrKey.isValidEd25519PublicKey(dataAccount)) {
    return { ok: false, reason: 'dataAccount must be a Stellar public key or blank.' };
  }
  const gistId = String(raw.gistId || '').trim();
  if (gistId && !/^[A-Za-z0-9]{8,64}$/.test(gistId)) {
    return { ok: false, reason: 'gistId looks wrong.' };
  }
  return {
    ok: true,
    people,
    alg,
    currency,
    horizon,
    networkPassphrase,
    dataAccount,
    gistId,
  };
}

export function findPerson(config, publicKey) {
  return config.people.find((person) => person.publicKey === publicKey) || null;
}
