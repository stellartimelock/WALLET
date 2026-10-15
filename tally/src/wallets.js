import {
  freshLogin,
  assertFreshLogin,
  signatureBytes,
  unlockMessage,
  verifyMessage,
} from './challenge.js';

function walletError(error, fallback) {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error.message || fallback;
}

async function freighter() {
  return import('@stellar/freighter-api');
}

export async function signInWithFreighter(config) {
  const api = await freighter();
  const access = await api.requestAccess();
  if (access.error || !access.address) {
    throw new Error(walletError(access.error, 'Freighter did not share an account.'));
  }
  return finishWalletSignIn(config, access.address, async (message) => {
    const signed = await api.signMessage(message, {
      address: access.address,
      networkPassphrase: config.networkPassphrase,
    });
    if (signed.error || !signed.signedMessage) {
      throw new Error(walletError(signed.error, 'Freighter declined to sign.'));
    }
    return signatureBytes(signed.signedMessage);
  }, 'freighter');
}

export async function signInWithAlbedo(config) {
  const albedo = await loadAlbedo();
  const access = await albedo.publicKey({});
  const address = access.pubkey || access.publicKey || access.address;
  if (!address) throw new Error('Albedo did not share an account.');
  return finishWalletSignIn(config, address, async (message) => {
    const signed = await albedo.signMessage({ message, pubkey: address });
    const raw = signed.signature || signed.message_signature || signed.signed_message;
    if (!raw) throw new Error('Albedo declined to sign.');
    return signatureBytes(raw);
  }, 'albedo');
}

async function finishWalletSignIn(config, publicKey, sign, wallet) {
  const allowed = config.people.some((person) => person.publicKey === publicKey);
  if (!allowed) throw new Error('This account is not on the tally allowlist.');
  const login = freshLogin(publicKey);
  const loginSig = await sign(login);
  assertFreshLogin(login, publicKey);
  if (!verifyMessage(publicKey, login, loginSig)) {
    throw new Error('The login signature does not match this account.');
  }
  const unlock = unlockMessage(publicKey);
  const unlockSig = await sign(unlock);
  if (!verifyMessage(publicKey, unlock, unlockSig)) {
    throw new Error('The unlock signature does not match this account.');
  }
  return { publicKey, wallet, unlockSig, secret: null };
}

export async function signXdrWithWallet(session, xdr, networkPassphrase) {
  if (session.wallet === 'freighter') {
    const api = await freighter();
    const signed = await api.signTransaction(xdr, {
      networkPassphrase,
      address: session.publicKey,
    });
    if (signed.error || !signed.signedTxXdr) {
      throw new Error(walletError(signed.error, 'Freighter declined to sign the save.'));
    }
    return signed.signedTxXdr;
  }
  if (session.wallet === 'albedo') {
    const albedo = await loadAlbedo();
    const network = networkPassphrase.includes('Test SDF') ? 'testnet' : 'public';
    const signed = await albedo.tx({
      xdr,
      network,
      pubkey: session.publicKey,
    });
    const out = signed.xdr || signed.signed_envelope_xdr || signed.envelope_xdr;
    if (!out) throw new Error('Albedo declined to sign the save.');
    return out;
  }
  throw new Error('No wallet is connected.');
}

function loadAlbedo() {
  if (typeof window !== 'undefined' && window.albedo) return Promise.resolve(window.albedo);
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://albedo.link/albedo.js';
    script.async = true;
    script.onload = () => {
      if (window.albedo) resolve(window.albedo);
      else reject(new Error('Albedo loaded but did not start.'));
    };
    script.onerror = () => reject(new Error('Could not reach Albedo. Check the connection and try again.'));
    document.head.appendChild(script);
  });
}
