# Stellar TimeLock Vault

Non-custodial time-lock vault wallet for Android, built on Stellar/Soroban.

This repository is the **open-source security and legal reference** for the Stellar TimeLock Vault Android app. It does **not** contain the full application source code. It publishes what is needed to verify that the app is non-custodial, transparent about its on-chain interactions, and clear about privacy, terms, and disclosures.

## Key Features

- **Standard Time-Lock** — Lock XLM until a chosen unlock date enforced by Soroban smart contracts
- **Cooling-Off** — Advanced vaults with a cooling-off period before funds can move
- **Vesting Schedule** — Release funds over time according to a defined schedule
- **Multi-Asset Support** — Time-lock vaults for Stellar assets beyond native XLM

## Landing Site

- **`landing/`** — static site ready for GitHub Pages (or any static host). See [`landing/README.md`](./landing/README.md) and [`landing/FINDINGS.md`](./landing/FINDINGS.md).

## Google Play

[Stellar TimeLock Vault on Google Play](https://play.google.com/store/apps/details?id=com.stellartimelock.vault) *(placeholder — update when listing is live)*

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

The app communicates **only** with:

1. The Stellar Soroban RPC (default: Ankr)
2. The SimpleSwap API (when the optional swap feature is used)

There is:

- No proprietary backend
- No analytics
- No tracking
- No cloud storage of wallet data

All wallet data stays on-device. Encryption uses AES-256-CBC with HMAC-SHA256 (seed-derived / device-protected key material). Private keys and seed phrases never leave the device.

Source code excerpts for independent review are available in the app under **Settings → Audit Our Security Code**.

See [SECURITY.md](./SECURITY.md) for vulnerability reporting and the security model.

## Legal

| Document | File |
| --- | --- |
| Privacy Policy | [privacy.md](./privacy.md) |
| Terms of Service | [terms.md](./terms.md) |
| Legal & Disclosures | [disclosures.md](./disclosures.md) |

## License

Licensed under the [Apache License 2.0](./LICENSE).

Copyright © StellarTimeLock, LLC.

## Contact

**support@stellartimelock.com**

Website: [https://stellartimelock.com](https://stellartimelock.com)
