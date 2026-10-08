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

## Shared tally

Unlisted page, not linked from the marketing site: https://stellartimelock.com/t/hhkbu88gx5i4/

Edit [`t/hhkbu88gx5i4/config.js`](./t/hhkbu88gx5i4/config.js) and set both Stellar public keys (`people[0]` is Isaac, `people[1]` is the buddy). Do not put secret keys or a GitHub token in that file. Storage defaults to Stellar `manageData` on `dataAccount` (both keys as signers, threshold 1). A private GitHub Gist is the fallback, with the token kept in the browser. See the root README for the signer and sign-in notes.

Source and tests live in `tally/`. Rebuild the page script with `npm test && npm run build` from that directory.
