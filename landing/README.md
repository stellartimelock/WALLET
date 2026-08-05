# Stellar TimeLock Vault — Landing

Static marketing site for the wallet-only product. Visual identity extracted from `stellartimelock-web` (StellarOS-era); content rewritten for Time-Lock Vaults.

## Local preview

Serve the `landing` folder as the site root (relative asset paths):

```bash
# from wallet-public/
npx --yes serve landing
```

Or open `landing/index.html` via any static server.

## GitHub Pages

1. Push `wallet-public` (or only the contents of `landing/`) to a public repo.
2. Settings → Pages → deploy from `/` (if repo root *is* these files) or from `/landing` if the repo keeps this layout.
3. Optional: keep `CNAME` as `stellartimelock.com` and point DNS accordingly.
4. `.nojekyll` is included so GitHub Pages serves files as-is.

## Placeholders to update

- Google Play URL in `index.html` (`#play-store-cta` and pricing CTA)
- Authenticity banner “listing (placeholder)” line once the store page is live
- Canonical / Open Graph URLs if the public domain changes

## Branding

- Product: **Stellar TimeLock Vault**
- Entity: **StellarTimeLock, LLC**
- See `FINDINGS.md` for full extraction notes.
