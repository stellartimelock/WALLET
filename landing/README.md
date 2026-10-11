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

## Survey

The quiz source is `survey/index.html`. It stays in this folder so the main site can still open `/survey/`, and it is not linked from the homepage. Its public address is https://whatappfitsyou.stellartimelock.com/ — see `whatappfitsyou/` for the separate Pages project. The main GitHub Pages site cannot take a second custom domain.

Email has no backend. The only value to paste is `SURVEY_ACCESS_KEY` in `assets/survey.js`.

TODO: create a Web3Forms access key for isaacdschuster@gmail.com at https://web3forms.com and paste it there. Until then, the form posts through FormSubmit to that address (confirm FormSubmit's one-time activation email). A visitor who enters an email gets a copy of their results. See the comment above `SURVEY_ACCESS_KEY`.

## Store listing

- Google Play: `https://play.google.com/store/apps/details?id=com.stellartimelock`
- Canonical / Open Graph URLs if the public domain changes

## Branding

- Product: **Stellar TimeLock**
- Entity: **StellarTimeLock, LLC**

