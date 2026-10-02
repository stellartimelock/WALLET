import assert from 'node:assert/strict';
import test from 'node:test';
import { Keypair } from '@stellar/stellar-base';
import {
  ALG_AES,
  ALG_XCHACHA,
  decryptLedger,
  encryptLedger,
  ensureSigWrap,
  openWithSeed,
  openX25519Wrap,
  randomCek,
  sealToPublicKey,
  trySigWraps,
  x25519Wraps,
} from '../src/crypto.js';
import { StrKey } from '@stellar/stellar-base';
import { b64ToBytes } from '../src/bytes.js';
import { signMessage, unlockMessage, verifyMessage } from '../src/challenge.js';

function person(name) {
  const kp = Keypair.random();
  return {
    name,
    publicKey: kp.publicKey(),
    rawPublicKey: new Uint8Array(StrKey.decodeEd25519PublicKey(kp.publicKey())),
    secret: kp.secret(),
    seed: new Uint8Array(StrKey.decodeEd25519SecretSeed(kp.secret())),
  };
}

async function roundTrip(alg) {
  const isaac = person('Isaac');
  const buddy = person('Buddy');
  const stranger = person('Stranger');
  const cek = randomCek();
  const ledger = {
    v: 1,
    rev: 2,
    currency: 'USD',
    people: [
      { publicKey: isaac.publicKey, name: 'Isaac' },
      { publicKey: buddy.publicKey, name: 'Buddy' },
    ],
    bills: [{ name: 'Rent - October', total: 1800 }],
    jobs: [],
    history: [],
  };
  const wraps = x25519Wraps(cek, [isaac, buddy]);
  const isaacSig = signMessage(isaac.secret, unlockMessage(isaac.publicKey));
  assert.equal(verifyMessage(isaac.publicKey, unlockMessage(isaac.publicKey), isaacSig), true);
  const withSig = await ensureSigWrap(wraps, isaac.publicKey, isaac.rawPublicKey, isaacSig, cek, alg);
  const envelope = await encryptLedger({ ledger, cek, alg, wraps: withSig });

  const fromSeed = openWithSeed(b64ToBytes(wraps[1].w), buddy.seed, buddy.rawPublicKey);
  assert.deepEqual(fromSeed, cek);
  const opened = openX25519Wrap(envelope.wraps, buddy.publicKey, buddy.rawPublicKey, buddy.seed);
  const decoded = await decryptLedger(envelope, opened);
  assert.equal(decoded.bills[0].name, 'Rent - October');

  const fromSig = await trySigWraps(envelope.wraps, isaac.publicKey, isaac.rawPublicKey, isaacSig, alg);
  assert.deepEqual(fromSig, cek);
  assert.equal(
    await trySigWraps(envelope.wraps, buddy.publicKey, buddy.rawPublicKey, isaacSig, alg),
    null,
  );
  assert.throws(() => openX25519Wrap(envelope.wraps, isaac.publicKey, isaac.rawPublicKey, stranger.seed));
}

test('xchacha ledger seals to both Stellar keys', async () => {
  await roundTrip(ALG_XCHACHA);
});

test('aes-gcm ledger seals to both Stellar keys', async () => {
  await roundTrip(ALG_AES);
});

test('a third key cannot open a seal', () => {
  const owner = person('Isaac');
  const other = person('Other');
  const cek = randomCek();
  const sealed = sealToPublicKey(cek, owner.rawPublicKey);
  assert.throws(() => openWithSeed(sealed, other.seed, owner.rawPublicKey));
  assert.deepEqual(openWithSeed(sealed, owner.seed, owner.rawPublicKey), cek);
});
