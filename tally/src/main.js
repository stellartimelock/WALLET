import { findPerson, parseConfig } from './config.js';
import {
  freshLogin,
  assertFreshLogin,
  publicKeyFromSecret,
  seedFromSecret,
  signMessage,
  unlockMessage,
  verifyMessage,
} from './challenge.js';
import {
  decryptLedger,
  encryptLedger,
  ensureSigWrap,
  ensureX25519Wraps,
  openX25519Wrap,
  randomCek,
  trySigWraps,
  x25519Wraps,
} from './crypto.js';
import {
  addBill,
  addJob,
  createLedger,
  deleteBill,
  deleteJob,
  importLedger,
  renamePeople,
  updateBill,
  updateJob,
} from './ledger.js';
import {
  ConflictError,
  readGist,
  readLocalSettings,
  readStellar,
  signXdrWithSecret,
  writeGist,
  writeLocalSettings,
  writeStellar,
} from './storage.js';
import { render } from './ui.js';
import { signInWithAlbedo, signInWithFreighter, signXdrWithWallet } from './wallets.js';

const SLUG = 'hhkbu88gx5i4';
const root = document.getElementById('app');

const state = {
  screen: 'login',
  phase: 'credentials',
  config: null,
  setupReason: '',
  session: null,
  ledger: null,
  loadedRev: 0,
  alg: null,
  storageKind: 'local',
  storageNotice: '',
  gistId: '',
  hasToken: false,
  tab: 'bills',
  editor: null,
  error: '',
  notice: '',
  busy: false,
  persisted: true,
  pendingEnvelope: null,
};

let secret = null;
let unlockSig = null;
let cek = null;

const actions = {
  signOut,
  localSignIn: (value) => run(() => localSignIn(value)),
  freighter: () => run(() => walletSignIn(signInWithFreighter)),
  albedo: () => run(() => walletSignIn(signInWithAlbedo)),
  retry: () => run(openAfterAuth),
  unlock: (value) => run(() => unlockWithSecret(value)),
  create: () => run(create),
  tab: (id) => {
    state.tab = id;
    state.editor = null;
    draw();
  },
  editBill: (id) => {
    state.tab = 'bills';
    state.editor = { kind: 'bill', id, error: '', draft: null };
    draw();
  },
  editJob: (id) => {
    state.tab = 'jobs';
    state.editor = { kind: 'job', id, error: '', draft: null };
    draw();
  },
  cancelEdit: () => {
    state.editor = null;
    draw();
  },
  saveBill: (input) => run(() => saveBill(input)),
  saveJob: (input) => run(() => saveJob(input)),
  deleteBill: (id) => {
    const bill = state.ledger.bills.find((item) => item.id === id);
    if (!bill || !window.confirm(`Remove “${bill.name}”?`)) return;
    run(() => commit(deleteBill(state.ledger, id, actor())));
  },
  deleteJob: (id) => {
    const job = state.ledger.jobs.find((item) => item.id === id);
    if (!job || !window.confirm(`Remove “${job.name}”?`)) return;
    run(() => commit(deleteJob(state.ledger, id, actor())));
  },
  rename: (names) => run(() => commit(renamePeople(state.ledger, names, actor()))),
  reload: () => run(reload),
  saveTo: (kind) => run(() => saveTo(kind)),
  saveGistSettings: (gistId, token) => {
    writeLocalSettings(SLUG, { gistId, token, mode: state.storageKind === 'gist' ? 'gist' : undefined });
    const settings = readLocalSettings(SLUG, state.config);
    state.gistId = settings.gistId;
    state.hasToken = settings.hasToken;
    state.notice = settings.hasToken ? 'Token saved in this browser only.' : 'Gist id saved in this browser.';
    draw();
  },
  exportJson: () => download('tally-ledger.json', JSON.stringify(exportBody(state.ledger), null, 2)),
  exportEncrypted: () => run(exportEncrypted),
  importJson: (file) => run(() => importFile(file)),
};

function draw() {
  state.you = state.session && state.config
    ? {
      name: state.ledger?.people.find((person) => person.publicKey === state.session.publicKey)?.name
        || findPerson(state.config, state.session.publicKey)?.name,
    }
    : null;
  render(root, state, actions);
}

function actor() {
  const person = findPerson(state.config, state.session.publicKey);
  const named = state.ledger?.people.find((item) => item.publicKey === state.session.publicKey);
  return { publicKey: state.session.publicKey, name: named?.name || person.name };
}

function signOut() {
  secret = null;
  unlockSig = null;
  cek = null;
  state.session = null;
  state.ledger = null;
  state.pendingEnvelope = null;
  state.phase = 'credentials';
  state.screen = 'login';
  state.error = '';
  state.notice = '';
  state.editor = null;
  state.persisted = true;
  draw();
}

async function run(fn) {
  if (state.busy) return;
  state.busy = true;
  state.error = '';
  draw();
  try {
    await fn();
  } catch (error) {
    state.error = error.message || 'Something went wrong.';
  } finally {
    state.busy = false;
    draw();
  }
}

async function localSignIn(value) {
  const trimmed = String(value || '').trim();
  const publicKey = publicKeyFromSecret(trimmed);
  if (!findPerson(state.config, publicKey)) {
    throw new Error('This account is not on the tally allowlist.');
  }
  const login = freshLogin(publicKey);
  const loginSig = signMessage(trimmed, login);
  assertFreshLogin(login, publicKey);
  if (!verifyMessage(publicKey, login, loginSig)) throw new Error('Could not verify the login signature.');
  secret = trimmed;
  unlockSig = signMessage(trimmed, unlockMessage(publicKey));
  state.session = { publicKey, wallet: null };
  await openAfterAuth();
}

async function walletSignIn(fn) {
  const session = await fn(state.config);
  secret = null;
  unlockSig = session.unlockSig;
  state.session = { publicKey: session.publicKey, wallet: session.wallet };
  await openAfterAuth();
}

async function openAfterAuth() {
  const loaded = await loadBest();
  state.storageKind = loaded.kind;
  state.storageNotice = loaded.notice || '';
  state.gistId = loaded.gistId || state.gistId;
  state.alg = loaded.envelope?.alg || state.config.alg;
  if (!loaded.envelope) {
    state.phase = 'create';
    state.pendingEnvelope = null;
    state.screen = 'login';
    return;
  }
  const opened = await tryOpen(loaded.envelope);
  if (!opened) {
    state.phase = 'unlock';
    state.pendingEnvelope = loaded.envelope;
    state.screen = 'login';
    return;
  }
  await enter(opened.cek, loaded.envelope, true);
}

async function unlockWithSecret(value) {
  const trimmed = String(value || '').trim();
  const publicKey = publicKeyFromSecret(trimmed);
  if (!state.session || publicKey !== state.session.publicKey) {
    throw new Error('That secret is for a different account.');
  }
  const opened = openX25519Wrap(
    state.pendingEnvelope.wraps,
    publicKey,
    findPerson(state.config, publicKey).rawPublicKey,
    seedFromSecret(trimmed),
  );
  if (!state.session.wallet) secret = trimmed;
  await enter(opened, state.pendingEnvelope, true);
}

async function create() {
  cek = randomCek();
  state.alg = state.config.alg;
  state.loadedRev = 0;
  state.pendingEnvelope = null;
  const ledger = createLedger(state.config.people, state.config.currency, actor());
  await commit(ledger);
  if (state.ledger) {
    state.screen = 'app';
    state.phase = 'credentials';
    return;
  }
  await openAfterAuth();
  state.notice = 'A tally was already saved. Opened that one.';
}

async function enter(nextCek, envelope, upgradeWrap) {
  cek = nextCek;
  state.alg = envelope.alg || state.config.alg;
  const ledger = await decryptLedger(envelope, cek);
  ledger.rev = envelope.rev;
  state.ledger = ledger;
  state.loadedRev = envelope.rev;
  state.pendingEnvelope = envelope;
  state.screen = 'app';
  state.phase = 'credentials';
  state.persisted = state.storageKind !== 'local';
    if (upgradeWrap && unlockSig) {
      const wraps = await withSigWrap(envelope.wraps);
      const changed = wraps.length !== envelope.wraps.length
        || wraps.some((wrap, index) => wrap.w !== envelope.wraps[index]?.w);
      if (changed) {
        try {
          state.pendingEnvelope = await writeEnvelope(ledger, wraps);
        } catch (error) {
          if (error.code !== 'unconfigured') {
            state.notice = `Opened the tally. Wallet unlock was not saved: ${error.message}`;
          }
        }
      }
    }
  }

async function tryOpen(envelope) {
  const person = findPerson(state.config, state.session.publicKey);
  if (unlockSig) {
    const fromSig = await trySigWraps(
      envelope.wraps,
      person.publicKey,
      person.rawPublicKey,
      unlockSig,
      envelope.alg,
    );
    if (fromSig) return { cek: fromSig };
  }
  if (secret) {
    try {
      const fromSeal = openX25519Wrap(
        envelope.wraps,
        person.publicKey,
        person.rawPublicKey,
        seedFromSecret(secret),
      );
      if (fromSeal) return { cek: fromSeal };
    } catch {
      return null;
    }
  }
  return null;
}

async function withSigWrap(wraps) {
  const person = findPerson(state.config, state.session.publicKey);
  let next = ensureX25519Wraps(wraps || [], cek, state.config.people);
  if (unlockSig) {
    next = await ensureSigWrap(next, person.publicKey, person.rawPublicKey, unlockSig, cek, state.alg);
  }
  return next;
}

async function commit(next) {
  if (next === state.ledger) {
    state.editor = null;
    return;
  }
  try {
    await persist(next);
    state.ledger = next;
    state.editor = null;
    state.notice = '';
    state.persisted = true;
  } catch (error) {
    if (error instanceof ConflictError) {
      state.error = `${error.message} Your last edit was not saved.`;
      return;
    }
    if (error.code === 'unconfigured') {
      state.ledger = next;
      state.editor = null;
      state.persisted = false;
      state.notice = 'This tally is only in this tab. Add a Stellar data account or a GitHub Gist, or export JSON before you close it.';
      return;
    }
    state.ledger = next;
    state.editor = null;
    state.persisted = false;
    state.error = `${error.message} The change is in this tab only.`;
  }
}

async function persist(next) {
  const remote = await readCurrent();
  const remoteRev = remote && remote.rev ? remote.rev : 0;
  if (remoteRev !== state.loadedRev) throw new ConflictError();
  const wraps = await withSigWrap(remote ? remote.wraps : x25519Wraps(cek, state.config.people));
  const envelope = await encryptLedger({ ledger: next, cek, alg: state.alg, wraps });
  await writeEnvelope(next, wraps, envelope);
  state.loadedRev = next.rev;
  state.pendingEnvelope = envelope;
}

async function writeEnvelope(ledger, wraps, envelope = null) {
  const body = envelope || await encryptLedger({ ledger, cek, alg: state.alg, wraps });
  if (state.storageKind === 'stellar') {
    if (!state.config.dataAccount) {
      const error = new Error('No Stellar data account is configured.');
      error.code = 'unconfigured';
      throw error;
    }
    await writeStellar(state.config, body, (xdr) => signXdr(xdr));
    return body;
  }
  if (state.storageKind === 'gist') {
    const settings = readLocalSettings(SLUG, state.config);
    if (!settings.hasToken) {
      const error = new Error('Add a GitHub token in Backup first.');
      error.code = 'unconfigured';
      throw error;
    }
    const id = await writeGist({
      gistId: settings.gistId,
      token: settings.token,
      envelope: body,
    });
    writeLocalSettings(SLUG, { gistId: id, mode: 'gist' });
    state.gistId = id;
    state.notice = settings.gistId
      ? ''
      : `Created gist ${id}. Put that id in config.js so the other person can open it.`;
    return body;
  }
  const error = new Error('No remote storage is configured yet.');
  error.code = 'unconfigured';
  throw error;
}

async function readCurrent() {
  if (state.storageKind === 'stellar' && state.config.dataAccount) {
    const { envelope } = await readStellar(state.config);
    return envelope;
  }
  if (state.storageKind === 'gist') {
    const settings = readLocalSettings(SLUG, state.config);
    if (!settings.hasToken || !settings.gistId) return null;
    return readGist(settings.gistId, settings.token);
  }
  return null;
}

async function loadBest() {
  const settings = readLocalSettings(SLUG, state.config);
  state.hasToken = settings.hasToken;
  state.gistId = settings.gistId;
  const gistReady = settings.hasToken && settings.gistId;
  if ((settings.mode === 'gist' || !state.config.dataAccount) && gistReady) {
    return {
      kind: 'gist',
      envelope: await readGist(settings.gistId, settings.token),
      gistId: settings.gistId,
    };
  }
  if (state.config.dataAccount) {
    try {
      const { envelope } = await readStellar(state.config);
      if (envelope) return { kind: 'stellar', envelope, gistId: settings.gistId };
      if (gistReady) {
        const gistEnvelope = await readGist(settings.gistId, settings.token);
        if (gistEnvelope) {
          return {
            kind: 'gist',
            envelope: gistEnvelope,
            gistId: settings.gistId,
            notice: 'No tally on the Stellar account yet. Opened the GitHub Gist copy.',
          };
        }
      }
      return { kind: 'stellar', envelope: null, gistId: settings.gistId };
    } catch (error) {
      if (gistReady) {
        return {
          kind: 'gist',
          envelope: await readGist(settings.gistId, settings.token),
          gistId: settings.gistId,
          notice: `Stellar storage failed (${error.message}). Opened the GitHub Gist fallback.`,
        };
      }
      if (error.code === 'missing-account') {
        return {
          kind: 'local',
          envelope: null,
          gistId: settings.gistId,
          notice: `${error.message} You can start in this tab and export JSON, or switch to a GitHub Gist.`,
        };
      }
      throw error;
    }
  }
  return { kind: 'local', envelope: null, gistId: settings.gistId };
}

async function signXdr(xdr) {
  if (state.session.wallet) return signXdrWithWallet(state.session, xdr, state.config.networkPassphrase);
  if (secret) return signXdrWithSecret(xdr, secret, state.config.networkPassphrase);
  throw new Error('Sign in with a wallet or your secret key to save to Stellar.');
}

async function saveBill(input) {
  const next = await draftOrThrow(input, () => (
    state.editor.id
      ? updateBill(state.ledger, state.editor.id, input, actor())
      : addBill(state.ledger, input, actor())
  ));
  if (next) await commit(next);
}

async function saveJob(input) {
  const next = await draftOrThrow(input, () => (
    state.editor.id
      ? updateJob(state.ledger, state.editor.id, input, actor())
      : addJob(state.ledger, input, actor())
  ));
  if (next) await commit(next);
}

function draftOrThrow(input, build) {
  try {
    return build();
  } catch (error) {
    if (state.editor) {
      state.editor.error = error.message;
      state.editor.draft = input;
    }
    throw error;
  }
}

async function reload() {
  const loaded = await loadBest();
  state.storageKind = loaded.kind;
  state.storageNotice = loaded.notice || '';
  if (!loaded.envelope) {
    state.notice = 'No saved tally was found. This tab still has your copy.';
    return;
  }
  if (!state.persisted && !window.confirm('Reload and drop changes that are only in this tab?')) return;
  const opened = await tryOpen(loaded.envelope);
  if (!opened) throw new Error('Could not open the saved tally with this sign-in.');
  await enter(opened.cek, loaded.envelope, false);
  state.notice = 'Reloaded.';
}

async function saveTo(kind) {
  const previous = state.storageKind;
  state.storageKind = kind;
  try {
    await persist(state.ledger);
  } catch (error) {
    state.storageKind = previous;
    throw error;
  }
  writeLocalSettings(SLUG, { mode: kind });
  state.persisted = true;
  state.storageNotice = kind === 'stellar' ? 'Saved to Stellar.' : 'Saved to the GitHub Gist.';
}

async function exportEncrypted() {
  if (!cek || !state.ledger) throw new Error('Open the tally first.');
  const wraps = state.pendingEnvelope?.wraps || x25519Wraps(cek, state.config.people);
  const envelope = await encryptLedger({
    ledger: state.ledger,
    cek,
    alg: state.alg,
    wraps,
  });
  download('tally-encrypted.json', JSON.stringify(envelope, null, 2));
}

async function importFile(file) {
  if (!file) throw new Error('Choose a JSON file first.');
  const text = await file.text();
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('That file is not JSON.');
  }
  if (raw && raw.wraps && raw.ct && !raw.bills) {
    throw new Error('That is an encrypted backup. It cannot be imported as the readable JSON.');
  }
  const next = importLedger(state.ledger, raw, actor());
  await commit(next);
}

function exportBody(ledger) {
  return {
    v: 1,
    currency: ledger.currency,
    people: ledger.people,
    bills: ledger.bills,
    jobs: ledger.jobs,
    history: ledger.history,
  };
}

function download(filename, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function boot() {
  const parsed = parseConfig(window.TALLY_CONFIG);
  if (!parsed.ok) {
    state.screen = 'setup';
    state.setupReason = parsed.reason;
    draw();
    return;
  }
  state.config = parsed;
  state.alg = parsed.alg;
  const settings = readLocalSettings(SLUG, parsed);
  state.gistId = settings.gistId;
  state.hasToken = settings.hasToken;
  state.screen = 'login';
  draw();
}

boot();
