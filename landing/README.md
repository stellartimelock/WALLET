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
