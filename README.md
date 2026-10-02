# Stellar TimeLock

Non-custodial time-lock vault wallet for Android, built on Stellar/Soroban.

This repository is the **public security and legal reference** for the Stellar TimeLock Android app. It does **not** contain the full application source code or complete vault contract source. Backend and full contract implementations remain proprietary by design. What is published here supports verification that the app is non-custodial, transparent about on-chain interactions (contract IDs), and clear about privacy, terms, and disclosures — including security modules/excerpts and documentation.

## Key Features

- **Standard Time-Lock** — Lock XLM until a chosen unlock date enforced by Soroban smart contracts
- **Cooling-Off** — Advanced vaults with a cooling-off period before funds can move
- **Vesting Schedule** — Release funds over time according to a defined schedule
- **Dead Man's Switch** — Check-in cadence with beneficiary release if missed (early access)
- **Multi-Sig** — Require multiple approvals before funds move (early access)
- **HTLC** — Hash time-locked contracts for atomic-style swaps (early access)
- **Multi-Asset Support** — Time-lock vaults for Stellar assets beyond native XLM
- **Swap** — Optional on-device signed swaps via third-party partners

## Landing Site

- **`landing/`** — static site ready for GitHub Pages (or any static host). See [`landing/README.md`](./landing/README.md).

## Shared tally

Unlisted page for a two-person tally (bills, jobs, and who owes whom). It is not linked from the site, sends `noindex,nofollow`, and is left out of the sitemap. This repository is public, so the path is not a secret from anyone reading it. The ledger is encrypted to the two allowlisted Stellar keys.

**URL:** https://stellartimelock.com/t/hhkbu88gx5i4/

**Add the buddy’s public key:** edit [`landing/t/hhkbu88gx5i4/config.js`](./landing/t/hhkbu88gx5i4/config.js). Set `people[0]` to Isaac’s Stellar public key (`G…`) and `people[1]` to the buddy’s name and public key. Leave secret keys and GitHub tokens out of that file. Redeploy the landing site.

**Where it is stored:** by default, one encrypted JSON ledger is written in chunks to Stellar data entries (`manageData`) on `dataAccount`. Create that account, add both public keys as signers (weight 1), set the low/medium/high thresholds to 1, and fund it with a few XLM for fees and reserves. If that account is unreachable, the page falls back to a private GitHub Gist. Each person pastes a fine-grained token (Gists read/write) into the Backup tab; it stays in that browser. Export / Import JSON is on that same tab.

Sign in with Freighter, Albedo, or a secret pasted into the local signer. The secret is used only in the tab and is not sent. The first time someone opens an existing tally with a wallet, they paste the secret once so the key sealed to their account can be unwrapped. After that, the wallet signature can open it.

## Google Play

[Stellar TimeLock on Google Play](https://play.google.com/store/apps/details?id=com.stellartimelock)

## Mainnet Contract Addresses

| Contract | Address |
| --- | --- |
| XLM Vault | `CCWDMIPD4ZTTIV5LR53PD325MS6VRGF3WJEJRKNCIKK3G7H6AXJ3UE4F` |
| Advanced Vaults (Cooling-Off, Vesting, Dead Man's Switch) | `CAPXQVGAD2TZNEDKZZDX3YKUBHQ2UI2XDI5AND6Z35D2YY2NZ7AJV6LM` |
| Multi-Asset Vault | `CBKOYL6BHVCHB4DJFVNHLGJKLCIFVRRRDVN2NRWX6TKRHQJQZQHPCACV` |

Verify on [Stellar Expert](https://stellar.expert/explorer/public):

- [XLM Vault](https://stellar.expert/explorer/public/contract/CCWDMIPD4ZTTIV5LR53PD325MS6VRGF3WJEJRKNCIKK3G7H6AXJ3UE4F)
- [Advanced Vaults](https://stellar.expert/explorer/public/contract/CAPXQVGAD2TZNEDKZZDX3YKUBHQ2UI2XDI5AND6Z35D2YY2NZ7AJV6LM)
- [Multi-Asset Vault](https://stellar.expert/explorer/public/contract/CBKOYL6BHVCHB4DJFVNHLGJKLCIFVRRRDVN2NRWX6TKRHQJQZQHPCACV)

## Network

- **Default Soroban RPC:** `https://rpc.ankr.com/stellar_soroban` (user-overridable in the app)
- **Horizon:** `https://horizon.stellar.org`

## Security Disclosure

The app communicates with:

1. The Stellar Soroban RPC (default: Ankr)
2. Optional third-party swap partner APIs (when the swap feature is used)

There is:

- No analytics
- No tracking
- No cloud storage of wallet data by StellarTimeLock, LLC

All wallet data stays on-device. Encryption uses AES-256-CBC with HMAC-SHA256 (seed-derived / device-protected key material via Android Keystore / SecureStore). Optional biometric unlock is available where supported. Private keys and seed phrases never leave the device.

Source code excerpts for independent review are available in the app under **Settings → Audit Our Security Code**, and related modules/docs are referenced in this repository. Full app backend and complete vault contract source are not published here.

See [SECURITY.md](./SECURITY.md) for vulnerability reporting and the security model.

## Legal

| Document | File |
| --- | --- |
| Privacy Policy | [privacy.md](./privacy.md) |
| Terms of Service | [terms.md](./terms.md) |
| Legal & Disclosures | [disclosures.md](./disclosures.md) |

## License

Published security modules/excerpts and documentation in this repository are licensed under the [Apache License 2.0](./LICENSE) where indicated. The Stellar TimeLock Android app backend and complete vault contract source remain proprietary.

Copyright © StellarTimeLock, LLC.

## Contact

**StellarTimeLock@gmail.com**

Website: [https://stellartimelock.com](https://stellartimelock.com)
