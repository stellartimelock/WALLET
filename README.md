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
