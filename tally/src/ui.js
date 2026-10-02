import { tallyBalance } from './balance.js';
import { cents, formatMoney, parseMoney, splitEven } from './money.js';
import { blankBill, blankJob } from './ledger.js';

function el(tag, attrs = {}, kids = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value == null || value === false) return;
    if (key === 'class') node.className = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'htmlFor') node.htmlFor = value;
    else node.setAttribute(key, String(value));
  });
  for (const kid of kids) {
    if (kid == null || kid === false) continue;
    node.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return node;
}

function field(label, control) {
  return el('label', { class: 'field' }, [
    el('span', { class: 'field-label' }, [label]),
    control,
  ]);
}

function moneyInput(name, value) {
  return el('input', {
    class: 'input',
    name,
    inputmode: 'decimal',
    autocomplete: 'off',
    value: value == null ? '' : String(value),
  });
}

function textInput(name, value, extra = {}) {
  return el('input', {
    class: 'input',
    name,
    autocomplete: 'off',
    value: value || '',
    ...extra,
  });
}

function showFormError(form, error) {
  let alert = form.querySelector('[role="alert"]');
  if (!alert) {
    alert = document.createElement('p');
    alert.className = 'banner banner-error';
    alert.setAttribute('role', 'alert');
    form.append(alert);
  }
  alert.textContent = error.message;
}

function button(label, className, onClick, extra = {}) {
  return el('button', { type: 'button', class: className, onclick: onClick, ...extra }, [label]);
}

function shortKey(publicKey) {
  if (!publicKey) return '';
  return `${publicKey.slice(0, 4)}…${publicKey.slice(-4)}`;
}

function when(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function header(state, actions) {
  const bar = el('header', { class: 'site-header' }, [
    el('div', { class: 'nav-brand-bar tally-bar' }, [
      el('a', { class: 'brand', href: '../../', 'aria-label': 'Stellar TimeLock home' }, [
        el('img', { src: '../../assets/logo.png', alt: '', class: 'brand-logo' }),
        el('span', { class: 'brand-name' }, ['Stellar TimeLock']),
      ]),
      state.session
        ? el('div', { class: 'tally-who' }, [
          el('span', { class: 'tally-who-name' }, [
            state.you?.name || 'Signed in',
            ' · ',
            shortKey(state.session.publicKey),
          ]),
          button('Sign out', 'btn btn-ghost btn-small', actions.signOut),
        ])
        : null,
    ]),
  ]);
  return bar;
}

function banner(text, kind) {
  if (!text) return null;
  return el('p', { class: `banner banner-${kind}`, role: kind === 'error' ? 'alert' : 'status' }, [text]);
}

function shell(state, actions, body) {
  return el('div', { class: 'tally-page', 'data-screen': state.screen }, [
    header(state, actions),
    el('main', { class: 'tally-main' }, body),
    el('p', { class: 'tally-foot' }, [
      'No ads. No analytics. The ledger is encrypted in this browser before it is saved.',
    ]),
  ]);
}

export function render(root, state, actions) {
  const view = state.screen === 'app'
    ? renderApp(state, actions)
    : state.screen === 'setup'
      ? renderSetup(state, actions)
      : renderLogin(state, actions);
  root.replaceChildren(view);
}

function renderSetup(state, actions) {
  return shell(state, actions, [
    el('section', { class: 'panel' }, [
      el('p', { class: 'eyebrow' }, ['Tally']),
      el('h1', {}, ['Add both public keys']),
      el('p', { class: 'lede' }, [state.setupReason]),
      el('p', { class: 'lede' }, [
        'Edit landing/t/hhkbu88gx5i4/config.js. Set Isaac’s key and your buddy’s key, then redeploy the site. Secrets never go in that file.',
      ]),
    ]),
  ]);
}

function renderLogin(state, actions) {
  const phase = state.phase || 'credentials';
  return shell(state, actions, [
    el('section', { class: 'panel login-panel' }, [
      el('img', { src: '../../assets/logo.png', alt: '', class: 'login-logo' }),
      el('p', { class: 'eyebrow' }, ['Sign in with Stellar']),
      el('h1', {}, ['Tally']),
      el('p', { class: 'lede' }, [
        'Bills, jobs, and who owes whom — for two allowlisted accounts only.',
      ]),
      banner(state.error, 'error'),
      banner(state.storageNotice, 'info'),
      banner(state.notice, 'info'),
      phase === 'credentials' && state.session ? signedInRetry(state, actions) : null,
      phase === 'credentials' && !state.session ? credentialBlock(state, actions) : null,
      phase === 'unlock' ? unlockBlock(state, actions) : null,
      phase === 'create' ? createBlock(state, actions) : null,
    ]),
  ]);
}

function signedInRetry(state, actions) {
  return el('div', { class: 'stack' }, [
    el('p', { class: 'lede' }, ['Signed in, but the tally could not be opened.']),
    button('Try again', 'btn btn-primary', actions.retry, { disabled: state.busy || undefined }),
  ]);
}

function credentialBlock(state, actions) {
  const form = el('form', {
    class: 'stack',
    onsubmit: (event) => {
      event.preventDefault();
      const secret = form.secret.value;
      form.secret.value = '';
      actions.localSignIn(secret);
    },
  }, [
    field('Stellar secret key', textInput('secret', '', {
      type: 'password',
      autocomplete: 'off',
      autocapitalize: 'off',
      spellcheck: 'false',
      placeholder: 'S…',
    })),
    el('p', { class: 'hint' }, [
      'Used only in this tab to sign and to unwrap the ledger. It is never sent.',
    ]),
    el('button', { type: 'submit', class: 'btn btn-primary', disabled: state.busy || undefined }, [
      state.busy ? 'Checking…' : 'Sign in with secret key',
    ]),
  ]);
  const show = button('Show', 'btn btn-ghost btn-small', () => {
    const input = form.secret;
    const hidden = input.type === 'password';
    input.type = hidden ? 'text' : 'password';
    show.textContent = hidden ? 'Hide' : 'Show';
  });
  form.querySelector('.field').append(show);

  return el('div', { class: 'stack' }, [
    button('Sign in with Freighter', 'btn btn-primary', actions.freighter, {
      disabled: state.busy || undefined,
    }),
    button('Sign in with Albedo', 'btn btn-ghost', actions.albedo, {
      disabled: state.busy || undefined,
    }),
    el('p', { class: 'hint' }, [
      'A wallet asks you to approve a sign-in and a tally unlock. Albedo is loaded only if you choose it. Freighter is the extension in this browser.',
    ]),
    el('div', { class: 'or' }, ['or a local signer']),
    form,
  ]);
}

function unlockBlock(state, actions) {
  const form = el('form', {
    class: 'stack',
    onsubmit: (event) => {
      event.preventDefault();
      const secret = form.secret.value;
      form.secret.value = '';
      actions.unlock(secret);
    },
  }, [
    el('p', { class: 'lede' }, [
      'The wallet proved this is your account. The ledger key is sealed to your Stellar public key, and this browser does not have an unlock for the wallet signature yet. Paste the matching secret once. It stays in this tab and is never sent.',
    ]),
    field('Stellar secret key', textInput('secret', '', {
      type: 'password',
      autocomplete: 'off',
      spellcheck: 'false',
      placeholder: 'S…',
    })),
    el('button', { type: 'submit', class: 'btn btn-primary', disabled: state.busy || undefined }, [
      state.busy ? 'Unlocking…' : 'Unlock ledger',
    ]),
  ]);
  return form;
}

function createBlock(state, actions) {
  return el('div', { class: 'stack' }, [
    el('p', { class: 'lede' }, [
      'There is no tally stored yet. Creating one seals a new key to both allowlisted public keys.',
    ]),
    button(state.busy ? 'Creating…' : 'Create the tally', 'btn btn-primary', actions.create, {
      disabled: state.busy || undefined,
    }),
  ]);
}

function renderApp(state, actions) {
  const balance = tallyBalance(state.ledger);
  return shell(state, actions, [
    balanceCard(state, balance),
    banner(state.error, 'error'),
    banner(state.storageNotice, 'info'),
    banner(state.notice, 'info'),
    banner(state.persisted ? '' : 'Not saved remotely yet. Export a JSON backup before you close this tab.', 'warn'),
    tabs(state, actions),
    state.tab === 'bills' ? billsPanel(state, actions) : null,
    state.tab === 'jobs' ? jobsPanel(state, actions) : null,
    state.tab === 'history' ? historyPanel(state) : null,
    state.tab === 'backup' ? backupPanel(state, actions) : null,
  ]);
}

function balanceCard(state, balance) {
  const currency = state.ledger.currency;
  return el('section', { class: `balance balance-${balance.tone}`, id: 'balance' }, [
    el('p', { class: 'eyebrow' }, ['Running balance']),
    el('h1', { id: 'balance-sentence' }, [
      balance.net === 0 ? 'Settled up' : `${balance.sentence} ${formatMoney(balance.amount, currency)}`,
    ]),
    el('ul', { class: 'breakdown' }, [
      el('li', {}, [line('Bills', balance.bills, balance.people, currency)]),
      el('li', {}, [line('Jobs', balance.jobs, balance.people, currency)]),
    ]),
    balance.remaining > 0
      ? el('p', { class: 'hint' }, [
        `${formatMoney(balance.remaining, currency)} of bills is still unpaid to the biller. That part is not a debt between you.`,
      ])
      : null,
  ]);
}

function line(label, directed, people, currency) {
  let text = 'Settled';
  if (directed > 0) text = `${people[1].name} owes ${people[0].name} ${formatMoney(directed, currency)}`;
  if (directed < 0) text = `${people[0].name} owes ${people[1].name} ${formatMoney(-directed, currency)}`;
  return `${label}: ${text}`;
}

function tabs(state, actions) {
  const items = [
    ['bills', 'Bills'],
    ['jobs', 'Jobs'],
    ['history', 'History'],
    ['backup', 'Backup'],
  ];
  return el('div', { class: 'tabs', role: 'tablist' }, items.map(([id, label]) => (
    button(label, `tab${state.tab === id ? ' tab-on' : ''}`, () => actions.tab(id), {
      role: 'tab',
      'aria-selected': state.tab === id ? 'true' : 'false',
    })
  )));
}

function billsPanel(state, actions) {
  const editing = state.editor?.kind === 'bill';
  return el('section', { class: 'panel' }, [
    el('div', { class: 'panel-head' }, [
      el('h2', {}, ['Bills']),
      editing ? null : button('Add bill', 'btn btn-primary btn-small', () => actions.editBill(null)),
    ]),
    editing ? billEditor(state, actions) : null,
    state.ledger.bills.length
      ? el('div', { class: 'stack' }, state.ledger.bills.map((bill) => billCard(state, bill, actions)))
      : el('p', { class: 'empty' }, ['No bills yet.']),
  ]);
}

function billCard(state, bill, actions) {
  const currency = state.ledger.currency;
  const paid = bill.payments.reduce((n, row) => n + cents(row.amount), 0);
  const remaining = cents(bill.total) - paid;
  return el('article', { class: 'item', 'data-bill': bill.id }, [
    el('div', { class: 'item-top' }, [
      el('h3', {}, [bill.name]),
      el('div', { class: 'item-actions' }, [
        button('Edit', 'btn btn-ghost btn-small', () => actions.editBill(bill.id)),
        button('Remove', 'btn btn-ghost btn-small', () => actions.deleteBill(bill.id)),
      ]),
    ]),
    el('p', { class: 'figures' }, [
      `Total ${formatMoney(cents(bill.total), currency)}`,
      ` · Paid ${formatMoney(paid, currency)}`,
      remaining >= 0
        ? ` · Remaining ${formatMoney(remaining, currency)}`
        : ` · Overpaid ${formatMoney(-remaining, currency)}`,
    ]),
    el('ul', { class: 'who' }, state.ledger.people.map((person) => {
      const share = bill.shares.find((row) => row.publicKey === person.publicKey);
      const payment = bill.payments.find((row) => row.publicKey === person.publicKey);
      return el('li', {}, [
        `${person.name}: share ${formatMoney(cents(share?.amount || 0), currency)}, paid ${formatMoney(cents(payment?.amount || 0), currency)}`,
      ]);
    })),
  ]);
}

function billEditor(state, actions) {
  const people = state.ledger.people;
  const existing = state.editor.id
    ? state.ledger.bills.find((bill) => bill.id === state.editor.id)
    : null;
  const draft = state.editor.draft || existing || blankBill(people);
  const form = el('form', {
    class: 'editor stack',
    onsubmit: (event) => {
      event.preventDefault();
      actions.saveBill(readBill(form, people, state.editor.id));
    },
  }, [
    field('Name', textInput('name', draft.name, { required: 'true', placeholder: 'Rent - October' })),
    field('Total', moneyInput('total', draft.total)),
    el('p', { class: 'field-label' }, ['Who owes what share of the total']),
    ...people.map((person, index) => field(
      `${person.name}'s share`,
      moneyInput(`share-${index}`, amountOf(draft.shares, person.publicKey)),
    )),
    button('Split evenly', 'btn btn-ghost btn-small', () => {
      try {
        const total = parseMoney(form.total.value);
        const [first, second] = splitEven(total);
        form['share-0'].value = String(first / 100);
        form['share-1'].value = String(second / 100);
        form.dispatchEvent(new Event('input'));
      } catch (error) {
        showFormError(form, error);
      }
    }),
    el('p', { class: 'field-label' }, ['Who paid what']),
    ...people.map((person, index) => field(
      `${person.name} paid`,
      moneyInput(`paid-${index}`, amountOf(draft.payments, person.publicKey)),
    )),
    el('p', { class: 'hint', 'data-remaining': '1' }, ['Remaining']),
    banner(state.editor.error, 'error'),
    el('div', { class: 'btn-row' }, [
      el('button', { type: 'submit', class: 'btn btn-primary', disabled: state.busy || undefined }, [
        state.busy ? 'Saving…' : 'Save bill',
      ]),
      button('Cancel', 'btn btn-ghost', actions.cancelEdit),
    ]),
  ]);
  bindRemaining(form, state.ledger.currency);
  return form;
}

function bindRemaining(form, currency) {
  const out = form.querySelector('[data-remaining]');
  const update = () => {
    try {
      const total = parseMoney(form.total.value);
      const paid = parseMoney(form['paid-0'].value) + parseMoney(form['paid-1'].value);
      const remaining = total - paid;
      out.textContent = remaining >= 0
        ? `Remaining ${formatMoney(remaining, currency)}`
        : `Overpaid ${formatMoney(-remaining, currency)}`;
    } catch {
      out.textContent = 'Remaining —';
    }
  };
  form.addEventListener('input', update);
  update();
}

function readBill(form, people, id) {
  return {
    id,
    name: form.name.value,
    total: form.total.value,
    shares: people.map((person, index) => ({
      publicKey: person.publicKey,
      amount: form[`share-${index}`].value,
    })),
    payments: people.map((person, index) => ({
      publicKey: person.publicKey,
      amount: form[`paid-${index}`].value,
    })),
  };
}

function jobsPanel(state, actions) {
  const editing = state.editor?.kind === 'job';
  return el('section', { class: 'panel' }, [
    el('div', { class: 'panel-head' }, [
      el('h2', {}, ['Jobs']),
      editing ? null : button('Add job', 'btn btn-primary btn-small', () => actions.editJob(null)),
    ]),
    editing ? jobEditor(state, actions) : null,
    state.ledger.jobs.length
      ? el('div', { class: 'stack' }, state.ledger.jobs.map((job) => jobCard(state, job, actions)))
      : el('p', { class: 'empty' }, ['No jobs yet.']),
  ]);
}

function jobCard(state, job, actions) {
  const currency = state.ledger.currency;
  return el('article', { class: 'item', 'data-job': job.id }, [
    el('div', { class: 'item-top' }, [
      el('h3', {}, [job.name]),
      el('div', { class: 'item-actions' }, [
        button('Edit', 'btn btn-ghost btn-small', () => actions.editJob(job.id)),
        button('Remove', 'btn btn-ghost btn-small', () => actions.deleteJob(job.id)),
      ]),
    ]),
    el('p', { class: 'figures' }, [
      `Expected ${formatMoney(cents(job.expected), currency)}`,
      ` · Received ${formatMoney(cents(job.received), currency)}`,
    ]),
    el('ul', { class: 'who' }, state.ledger.people.map((person) => {
      const split = job.splits.find((row) => row.publicKey === person.publicKey);
      const held = job.receipts.find((row) => row.publicKey === person.publicKey);
      return el('li', {}, [
        `${person.name}: split ${formatMoney(cents(split?.amount || 0), currency)}, holds ${formatMoney(cents(held?.amount || 0), currency)}`,
      ]);
    })),
  ]);
}

function jobEditor(state, actions) {
  const people = state.ledger.people;
  const existing = state.editor.id
    ? state.ledger.jobs.find((job) => job.id === state.editor.id)
    : null;
  const draft = state.editor.draft || existing || blankJob(people, state.session.publicKey);
  const form = el('form', {
    class: 'editor stack',
    onsubmit: (event) => {
      event.preventDefault();
      actions.saveJob(readJob(form, people, state.editor.id));
    },
  }, [
    field('Name', textInput('name', draft.name, { required: 'true', placeholder: 'Fence repair' })),
    field('Expected pay', moneyInput('expected', draft.expected)),
    field('Received', moneyInput('received', draft.received)),
    el('p', { class: 'field-label' }, ['Split of the money received']),
    ...people.map((person, index) => field(
      `${person.name}'s split`,
      moneyInput(`split-${index}`, amountOf(draft.splits, person.publicKey)),
    )),
    button('Split evenly', 'btn btn-ghost btn-small', () => {
      try {
        const received = parseMoney(form.received.value);
        const [first, second] = splitEven(received);
        form['split-0'].value = String(first / 100);
        form['split-1'].value = String(second / 100);
      } catch (error) {
        showFormError(form, error);
      }
    }),
    el('p', { class: 'field-label' }, ['Who holds that money now']),
    ...people.map((person, index) => field(
      `${person.name} holds`,
      moneyInput(`held-${index}`, amountOf(draft.receipts, person.publicKey)),
    )),
    button('I hold all of it', 'btn btn-ghost btn-small', () => {
      try {
        const received = parseMoney(form.received.value) / 100;
        people.forEach((person, index) => {
          form[`held-${index}`].value = person.publicKey === state.session.publicKey ? String(received) : '0';
        });
      } catch (error) {
        showFormError(form, error);
      }
    }),
    el('p', { class: 'hint' }, [
      'The balance uses the split against who actually holds the received pay.',
    ]),
    banner(state.editor.error, 'error'),
    el('div', { class: 'btn-row' }, [
      el('button', { type: 'submit', class: 'btn btn-primary', disabled: state.busy || undefined }, [
        state.busy ? 'Saving…' : 'Save job',
      ]),
      button('Cancel', 'btn btn-ghost', actions.cancelEdit),
    ]),
  ]);
  return form;
}

function readJob(form, people, id) {
  return {
    id,
    name: form.name.value,
    expected: form.expected.value,
    received: form.received.value,
    splits: people.map((person, index) => ({
      publicKey: person.publicKey,
      amount: form[`split-${index}`].value,
    })),
    receipts: people.map((person, index) => ({
      publicKey: person.publicKey,
      amount: form[`held-${index}`].value,
    })),
  };
}

function amountOf(list, publicKey) {
  const row = (list || []).find((item) => item.publicKey === publicKey);
  return row ? row.amount : 0;
}

function historyPanel(state) {
  const rows = [...state.ledger.history].reverse();
  return el('section', { class: 'panel' }, [
    el('h2', {}, ['History']),
    rows.length
      ? el('ol', { class: 'history' }, rows.map((item) => el('li', {}, [
        el('p', { class: 'history-meta' }, [`${when(item.at)} · ${item.name}`]),
        el('p', { class: 'history-summary' }, [item.summary]),
      ])))
      : el('p', { class: 'empty' }, ['No changes yet.']),
  ]);
}

function backupPanel(state, actions) {
  const people = state.ledger.people;
  const nameForm = el('form', {
    class: 'stack',
    onsubmit: (event) => {
      event.preventDefault();
      actions.rename([nameForm['name-0'].value, nameForm['name-1'].value]);
    },
  }, [
    ...people.map((person, index) => field('Display name', textInput(`name-${index}`, person.name))),
    el('button', { type: 'submit', class: 'btn btn-ghost', disabled: state.busy || undefined }, ['Save names']),
  ]);
  const gistForm = el('form', {
    class: 'stack',
    onsubmit: (event) => {
      event.preventDefault();
      actions.saveGistSettings(gistForm['gist-id'].value, gistForm.token.value);
      gistForm.token.value = '';
    },
  }, [
    field('Gist id', textInput('gist-id', state.gistId, { placeholder: 'Leave blank to create one' })),
    field('Fine-grained GitHub token', textInput('token', '', {
      type: 'password',
      autocomplete: 'off',
      spellcheck: 'false',
      placeholder: state.hasToken ? 'Saved in this browser' : 'gist scope, stored only here',
    })),
    el('button', { type: 'submit', class: 'btn btn-ghost' }, ['Save token in this browser']),
  ]);
  const file = el('input', { type: 'file', accept: 'application/json,.json', class: 'input' });
  return el('section', { class: 'panel stack' }, [
    el('h2', {}, ['Backup and storage']),
    el('p', { class: 'lede' }, [
      state.storageKind === 'stellar'
        ? 'Saving to Stellar account data.'
        : state.storageKind === 'gist'
          ? 'Saving to a private GitHub Gist.'
          : 'No remote storage yet. Stellar account data is the default once dataAccount is set.',
    ]),
    el('p', { class: 'hint' }, [
      state.config.dataAccount
        ? `Data account ${shortKey(state.config.dataAccount)}`
        : 'No Stellar data account in config.js.',
    ]),
    el('div', { class: 'btn-row' }, [
      button('Reload', 'btn btn-ghost', actions.reload, { disabled: state.busy || undefined }),
      button('Save to Stellar', 'btn btn-primary', () => actions.saveTo('stellar'), {
        disabled: state.busy || !state.config.dataAccount || undefined,
      }),
      button('Save to Gist', 'btn btn-ghost', () => actions.saveTo('gist'), {
        disabled: state.busy || undefined,
      }),
    ]),
    gistForm,
    el('div', { class: 'btn-row' }, [
      button('Export JSON', 'btn btn-primary', actions.exportJson),
      button('Export encrypted', 'btn btn-ghost', actions.exportEncrypted),
    ]),
    field('Import JSON backup', file),
    button('Import', 'btn btn-ghost', () => actions.importJson(file.files && file.files[0]), {
      disabled: state.busy || undefined,
    }),
    el('p', { class: 'hint' }, [
      'Export JSON is readable. Keep that file private. Import replaces bills and jobs and appends a history entry.',
    ]),
    el('h3', {}, ['Names']),
    nameForm,
  ]);
}
