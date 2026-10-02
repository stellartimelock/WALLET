import { ed25519, x25519 } from '@noble/curves/ed25519.js';
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { randomBytes } from '@noble/ciphers/utils.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToB64, b64ToBytes, concat, equal, utf8, utf8Decode } from './bytes.js';

export const ALG_XCHACHA = 'xchacha20poly1305';
export const ALG_AES = 'aes-256-gcm';
const SEAL_INFO = utf8('stl-tally-seal-v1');
const LEDGER_INFO = utf8('stl-tally-ledger-v1');
const SIG_INFO = utf8('stl-tally-sigwrap-v1');

export function randomCek() {
  return randomBytes(32);
}

function nonceLen(alg) {
  if (alg === ALG_XCHACHA) return 24;
  if (alg === ALG_AES) return 12;
  throw new Error(`Unsupported cipher ${alg}`);
}

async function aeadEncrypt(alg, key, nonce, plaintext, aad) {
  if (alg === ALG_XCHACHA) {
    return xchacha20poly1305(key, nonce, aad).encrypt(plaintext);
  }
  const cryptoKey = await crypto.subtle.importKey('raw', key, 'AES-GCM', false, ['encrypt']);
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce, additionalData: aad, tagLength: 128 },
    cryptoKey,
    plaintext,
  );
  return new Uint8Array(ct);
}

async function aeadDecrypt(alg, key, nonce, ciphertext, aad) {
  if (alg === ALG_XCHACHA) {
    return xchacha20poly1305(key, nonce, aad).decrypt(ciphertext);
  }
  const cryptoKey = await crypto.subtle.importKey('raw', key, 'AES-GCM', false, ['decrypt']);
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: nonce, additionalData: aad, tagLength: 128 },
    cryptoKey,
    ciphertext,
  );
  return new Uint8Array(pt);
}

function sealKey(shared, ephPub) {
  return hkdf(sha256, shared, ephPub, SEAL_INFO, 32);
}

export function sealToPublicKey(cek, recipientPublicKey) {
  const recipientMont = ed25519.utils.toMontgomery(recipientPublicKey);
  const ephPriv = x25519.utils.randomSecretKey();
  const ephPub = x25519.getPublicKey(ephPriv);
  const shared = x25519.getSharedSecret(ephPriv, recipientMont);
  const key = sealKey(shared, ephPub);
  const nonce = randomBytes(24);
  const aad = concat([SEAL_INFO, recipientPublicKey]);
  const ct = xchacha20poly1305(key, nonce, aad).encrypt(cek);
  return concat([ephPub, nonce, ct]);
}

export function openWithSeed(sealed, seed, recipientPublicKey) {
  if (sealed.length < 32 + 24 + 16) throw new Error('Could not open the tally with this key');
  const ephPub = sealed.subarray(0, 32);
  const nonce = sealed.subarray(32, 56);
  const ct = sealed.subarray(56);
  const xsk = ed25519.utils.toMontgomerySecret(seed);
  let shared;
  try {
    shared = x25519.getSharedSecret(xsk, ephPub);
  } catch {
    throw new Error('Could not open the tally with this key');
  }
  const key = sealKey(shared, ephPub);
  const aad = concat([SEAL_INFO, recipientPublicKey]);
  try {
    return xchacha20poly1305(key, nonce, aad).decrypt(ct);
  } catch {
    throw new Error('Could not open the tally with this key');
  }
}

export function sigWrapKey(signature, publicKey) {
  return hkdf(sha256, signature, publicKey, SIG_INFO, 32);
}

export async function wrapCek(cek, key, alg) {
  const nLen = nonceLen(alg);
  const nonce = randomBytes(nLen);
  const ct = await aeadEncrypt(alg, key, nonce, cek, SIG_INFO);
  return concat([nonce, ct]);
}

export async function unwrapCek(blob, key, alg) {
  const nLen = nonceLen(alg);
  if (blob.length < nLen + 16) throw new Error('Could not open the tally with this key');
  try {
    return await aeadDecrypt(alg, key, blob.subarray(0, nLen), blob.subarray(nLen), SIG_INFO);
  } catch {
    throw new Error('Could not open the tally with this key');
  }
}

async function deflate(bytes) {
  if (typeof CompressionStream === 'undefined') return { bytes, zip: 'none' };
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  const out = new Uint8Array(await new Response(stream).arrayBuffer());
  return { bytes: out, zip: 'deflate-raw' };
}

async function inflate(bytes, zip) {
  if (!zip || zip === 'none') return bytes;
  if (zip !== 'deflate-raw' || typeof DecompressionStream === 'undefined') {
    throw new Error('This tally was compressed with an unsupported method');
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function encryptLedger({ ledger, cek, alg, wraps }) {
  const plain = utf8(JSON.stringify(ledger));
  const zipped = await deflate(plain);
  const nLen = nonceLen(alg);
  const nonce = randomBytes(nLen);
  const ct = await aeadEncrypt(alg, cek, nonce, zipped.bytes, LEDGER_INFO);
  return {
    v: 1,
    alg,
    zip: zipped.zip,
    rev: ledger.rev,
    nonce: bytesToB64(nonce),
    ct: bytesToB64(ct),
    wraps,
  };
}

export async function decryptLedger(envelope, cek) {
  const nonce = b64ToBytes(envelope.nonce);
  const ct = b64ToBytes(envelope.ct);
  let zipped;
  try {
    zipped = await aeadDecrypt(envelope.alg, cek, nonce, ct, LEDGER_INFO);
  } catch {
    throw new Error('Could not decrypt the tally');
  }
  const plain = await inflate(zipped, envelope.zip);
  const ledger = JSON.parse(utf8Decode(plain));
  if (!ledger || ledger.v !== 1) throw new Error('Unrecognized tally');
  return ledger;
}

export function x25519Wraps(cek, people) {
  return people.map((person) => ({
    pk: person.publicKey,
    type: 'x25519-seal',
    w: bytesToB64(sealToPublicKey(cek, person.rawPublicKey)),
  }));
}

export async function trySigWraps(wraps, publicKey, rawPublicKey, signature, alg) {
  const key = sigWrapKey(signature, rawPublicKey);
  for (const wrap of wraps || []) {
    if (wrap.pk !== publicKey || wrap.type !== 'sig') continue;
    try {
      return await unwrapCek(b64ToBytes(wrap.w), key, alg);
    } catch {
      // try the next wrap
    }
  }
  return null;
}

export function openX25519Wrap(wraps, publicKey, rawPublicKey, seed) {
  const wrap = (wraps || []).find((item) => item.pk === publicKey && item.type === 'x25519-seal');
  if (!wrap) return null;
  return openWithSeed(b64ToBytes(wrap.w), seed, rawPublicKey);
}

export async function ensureSigWrap(wraps, publicKey, rawPublicKey, signature, cek, alg) {
  const next = wraps.slice();
  const key = sigWrapKey(signature, rawPublicKey);
  for (const wrap of next) {
    if (wrap.pk !== publicKey || wrap.type !== 'sig') continue;
    try {
      const opened = await unwrapCek(b64ToBytes(wrap.w), key, alg);
      if (equal(opened, cek)) return next;
    } catch {
      // keep looking
    }
  }
  const mine = next.filter((wrap) => wrap.pk === publicKey && wrap.type === 'sig');
  if (mine.length >= 3) {
    const drop = mine[0];
    const index = next.indexOf(drop);
    if (index >= 0) next.splice(index, 1);
  }
  next.push({
    pk: publicKey,
    type: 'sig',
    w: bytesToB64(await wrapCek(cek, key, alg)),
  });
  return next;
}

export function ensureX25519Wraps(wraps, cek, people) {
  const next = wraps.slice();
  for (const person of people) {
    const found = next.some((wrap) => wrap.pk === person.publicKey && wrap.type === 'x25519-seal');
    if (!found) {
      next.push({
        pk: person.publicKey,
        type: 'x25519-seal',
        w: bytesToB64(sealToPublicKey(cek, person.rawPublicKey)),
      });
    }
  }
  return next;
}
