# Stellar TimeLock — Landing

Static marketing site for the wallet-only product.

## Local preview

Serve the `landing` folder as the site root (relative asset paths):

```bash
# from the repo root
npx --yes serve landing
```

Or open `landing/index.html` via any static server.

## GitHub Pages

1. Deployed by `.github/workflows/deploy-landing.yml` (GitHub Actions) on pushes to `main` that touch `landing/`.
2. Settings → Pages → Source: GitHub Actions.
3. Optional: keep `CNAME` as `stellartimelock.com` and point DNS accordingly.
4. `.nojekyll` is included so GitHub Pages serves files as-is.

## Store listing

- Google Play: `https://play.google.com/store/apps/details?id=com.stellartimelock`
- Canonical / Open Graph URLs if the public domain changes

## Branding

- Product: **Stellar TimeLock**
- Entity: **StellarTimeLock, LLC**

## Shared tally

Unlisted page, not linked from the marketing site: https://stellartimelock.com/t/hhkbu88gx5i4/

Edit [`t/hhkbu88gx5i4/config.js`](./t/hhkbu88gx5i4/config.js) and set both Stellar public keys (`people[0]` is Isaac, `people[1]` is the buddy). Do not put secret keys or a GitHub token in that file. Storage defaults to Stellar `manageData` on `dataAccount` (both keys as signers, threshold 1). A private GitHub Gist is the fallback, with the token kept in the browser. See the root README for the signer and sign-in notes.

Source and tests live in `tally/`. Rebuild the page script with `npm test && npm run build` from that directory.
