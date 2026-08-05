# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Stellar TimeLock Vault, please report it privately:

**Email:** [support@stellartimelock.com](mailto:support@stellartimelock.com)

Please include:

- A clear description of the issue
- Steps to reproduce (if applicable)
- Potential impact
- Any suggested remediation

Do **not** open a public GitHub issue for security-sensitive reports. We will acknowledge receipt and work with you on coordinated disclosure.

## Security Model

Stellar TimeLock Vault is a **non-custodial** Android wallet:

- You alone control private keys and seed phrases
- We cannot access, freeze, recover, or move your funds
- There is no proprietary backend, analytics pipeline, tracking, or cloud wallet storage
- The app communicates only with the Stellar Soroban RPC and (optionally) the SimpleSwap API

### Encryption

Wallet data on device is protected with **AES-256-CBC** authenticated by **HMAC-SHA256**. Key material is seed-derived / device-protected. We cannot recover encrypted local data or reset a wallet on your behalf.

### On-device custody

All wallet data — including seed phrases, private keys, contacts, vault configurations, and local transaction history — remains on the device under your control.

## Audit Information

Source code excerpts for security review are available **in the app** under:

**Settings → Audit Our Security Code**

That screen includes excerpts covering encryption, key storage, secure wipe, key generation/import, and biometric unlock, plus a reference list of RPC endpoints, contract IDs, transaction types, and Soroban method names the wallet uses.

This public repository documents contracts, network endpoints, and legal/security posture. It does **not** ship the full application source tree.

## On-Chain Verification

All vault interactions are on-chain on Stellar/Soroban and can be inspected on public explorers (for example [Stellar Expert](https://stellar.expert/explorer/public)).

### Mainnet contract addresses

| Contract | Address |
| --- | --- |
| XLM Vault | `CCWDMIPD4ZTTIV5LR53PD325MS6VRGF3WJEJRKNCIKK3G7H6AXJ3UE4F` |
| Advanced Vaults (Cooling-Off, Vesting, Dead Man's Switch) | `CAPXQVGAD2TZNEDKZZDX3YKUBHQ2UI2XDI5AND6Z35D2YY2NZ7AJV6LM` |
| Multi-Asset Vault | `CBKOYL6BHVCHB4DJFVNHLGJKLCIFVRRRDVN2NRWX6TKRHQJQZQHPCACV` |

### Default RPC

- Soroban RPC: `https://rpc.ankr.com/stellar_soroban` (user-overridable in the app)

## Contact

**support@stellartimelock.com**
