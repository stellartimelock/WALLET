// Public tally settings. Put public keys here only.
// Never put a secret key or a GitHub token in this file.
window.TALLY_CONFIG = {
  people: [
    { name: "Isaac", publicKey: "" },
    { name: "Buddy", publicKey: "" },
  ],
  currency: "USD",
  // Option B, the default: encrypted chunks in this account's data entries.
  horizon: "https://horizon.stellar.org",
  networkPassphrase: "Public Global Stellar Network ; September 2015",
  dataAccount: "",
  // Option A fallback: private gist id. The token is entered on the page.
  gistId: "",
  // "xchacha20poly1305" (default) or "aes-256-gcm"
  alg: "xchacha20poly1305",
};
