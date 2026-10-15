import { Keypair, StrKey } from '@stellar/stellar-base';
import { b64ToBytes, hexToBytes, utf8 } from './bytes.js';

const PREFIX = 'Stellar Signed Message:\n';

export function loginMessage(publicKey, nonce, issuedAt) {
  return [
    'Stellar TimeLock tally login',
    'This signature proves you control this account.',
    'It does not move funds and does not unlock the tally by itself.',
    `Account: ${publicKey}`,
    `Nonce: ${nonce}`,
    `Issued: ${issuedAt}`,
  ].join('\n');
}

export function unlockMessage(publicKey) {
  return [
    'Stellar TimeLock tally key',
    'Only sign this on stellartimelock.com.',
    'This signature unlocks the shared tally for this account. It does not move funds.',
    `Account: ${publicKey}`,
  ].join('\n');
}

export function freshLogin(publicKey) {
  const nonceBytes = new Uint8Array(16);
  crypto.getRandomValues(nonceBytes);
  const nonce = [...nonceBytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  const issuedAt = new Date().toISOString();
  return loginMessage(publicKey, nonce, issuedAt);
}

export function assertFreshLogin(message, publicKey) {
  const lines = String(message).split('\n');
  if (lines[0] !== 'Stellar TimeLock tally login') throw new Error('Unexpected login challenge');
  if (!message.includes(`Account: ${publicKey}`)) throw new Error('Login challenge does not match this account');
  const issued = lines.find((line) => line.startsWith('Issued: '));
  if (!issued) throw new Error('Login challenge is missing a time');
  const when = Date.parse(issued.slice('Issued: '.length));
  if (!Number.isFinite(when)) throw new Error('Login challenge has a bad time');
  const skew = Date.now() - when;
  if (skew > 10 * 60 * 1000 || skew < -2 * 60 * 1000) {
    throw new Error('Login challenge expired. Try again.');
  }
}

export function signatureBytes(signedMessage) {
  if (!signedMessage) throw new Error('The wallet returned no signature');
  if (signedMessage instanceof Uint8Array) return checkLen(new Uint8Array(signedMessage));
  if (typeof signedMessage === 'string') {
    const s = signedMessage.trim();
    if (/^[0-9a-fA-F]{128}$/.test(s)) return hexToBytes(s);
    return checkLen(b64ToBytes(s));
  }
  if (typeof signedMessage === 'object') {
    if (Array.isArray(signedMessage.data)) return checkLen(new Uint8Array(signedMessage.data));
    if (signedMessage.type === 'Buffer' && Array.isArray(signedMessage.data)) {
      return checkLen(new Uint8Array(signedMessage.data));
    }
  }
  throw new Error('Unrecognized signature');
}

function checkLen(bytes) {
  if (bytes.length !== 64) throw new Error('Unrecognized signature');
  return bytes;
}

export function verifyMessage(publicKey, message, signature) {
  const kp = Keypair.fromPublicKey(publicKey);
  const raw = utf8(message);
  const prefixed = utf8(PREFIX + message);
  return kp.verify(raw, signature) || kp.verify(prefixed, signature);
}

export function signMessage(secret, message) {
  const kp = Keypair.fromSecret(secret);
  return new Uint8Array(kp.sign(utf8(message)));
}

export function publicKeyFromSecret(secret) {
  if (!StrKey.isValidEd25519SecretSeed(secret.trim())) {
    throw new Error('That is not a Stellar secret key. It should start with S.');
  }
  return Keypair.fromSecret(secret.trim()).publicKey();
}

export function seedFromSecret(secret) {
  return new Uint8Array(StrKey.decodeEd25519SecretSeed(secret.trim()));
}
