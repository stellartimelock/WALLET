# Landing page extraction — findings

Source projects were inspected; **original files were not modified**.

## 1. Where the landing page lived

### Primary source (canonical)

`C:\SECRET\stellartimelock-web` — public landing repo (`stellartimelock-web` per MASTER_CONTEXT).

| Path | Role |
|------|------|
| `index.html` | Main landing (StellarOS / productivity messaging) |
| `assets/style.css` | Full visual system |
| `assets/main.js` | Typewriter + tagline fade-in |
| `assets/logo.png` | Hourglass brand mark |
| `privacy/index.html` | Privacy policy |
| `terms/index.html` | Terms of use |
| `disclosures/index.html` | Legal / IP disclosures |
| `delete-account/index.html` | Account deletion (productivity-era; omitted from wallet rebuild) |
| `CNAME` | `stellartimelock.com` |
| `robots.txt`, `sitemap.xml`, `vercel.json` | Hosting / SEO |
| `README.md`, `SECURITY.md`, `Whitepaper.md` | Docs |

### Snapshots inside app repo

`C:\SECRET\stellartimelock-app`:

- `gh_pages_check.html`, `live_check.html`, `privacy_check.html` — fetched copies used for verification
- No dedicated `web/` or `landing/` folder in the app tree
- `MASTER_CONTEXT.md` confirms `stellartimelock-web` is the landing page repo

### WALLET_OLD

`C:\SECRET\WALLET_OLD` — React Native / Expo app only. No dedicated marketing landing. Only Expo `dist/index.html` shell and `node_modules` HTML.

---

## 2. Visual styling extracted

### Color palette (`:root`)

| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `#05070d` | Page background |
| `--surface` | `#0d1525` | Cards / elevated panels |
| `--surface-elev` | `#151f32` | Code chip background |
| `--border` | `rgba(255,255,255,0.08)` | Hairlines |
| `--text` | `#e7ebf3` | Primary text |
| `--text-secondary` | `#a0a9bc` | Body / muted |
| `--text-tertiary` | `#5a6478` | Copyright / meta |
| `--teal` | `#14b8a6` | Accent, CTAs, links |
| `--teal-glow` | `rgba(20,184,166,0.35)` | Logo / CTA glow |
| `--gold` | `#d4af37` | Warning banner / code accent |

Background: `radial-gradient(ellipse at top, #0e1a2b 0%, #05070d 60%)`.

### Fonts

- Body: system UI stack (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, Roboto, Helvetica, Arial)
- Mono: `SF Mono`, Menlo, Consolas (used for `code` in security list)

### Layout structure

1. Sticky header — brand bar + links bar (Features / Security / FAQ / GitHub pill)
2. Hero — logo, typewriter title, uppercase teal tagline, lede, dual CTAs
3. Features — primary grid + secondary “Make it yours” style grid
4. Security bar — full-bleed surface with eyebrow, checklist, CTA
5. FAQ — `<details>` accordion
6. Pricing / get-app — eyebrow + checklist + CTA
7. Banners — gold privacy notice + teal authenticity block
8. Footer — social pills, legal pills, tagline, copyright

### Animation / effects

- Typewriter title (`main.js`, ~70–90ms/char)
- Blinking cursor (`@keyframes blink`)
- Tagline fade + `translateY` after typewriter completes
- Sticky header glass (`backdrop-filter: blur(14px)`)
- Feature card hover: teal border + `translateY(-2px)`
- CTA hover lift + teal glow shadow
- FAQ chevron rotate on open
- Logo teal drop-shadow

### Component patterns

- Pill CTAs (`border-radius: 999px`) — primary teal fill, ghost outline
- Feature cards — 16px radius, surface fill, hairline border
- Eyebrow pills — teal on translucent teal
- Footer / nav link pills — surface + border
- Security checklist with teal ✓ markers
- Gold warning banner / teal authenticity banner

---

## 3. Content that must be replaced (StellarOS / productivity)

Remove / do not carry forward:

- **StellarOS** / **StellarOS LLC** branding
- Productivity suite: encrypted notes, password manager, bill calendar, P&L ledger, TOTP authenticator, document storage, customizable dashboard, calculator widgets
- “All-in-one”, “super app”, “productivity workspace”, “Productivity, first.”
- FAQ items about bill calendar / ledger CSV import / “is StellarOS free”
- Smol Launch badge (optional; dropped in wallet rebuild)
- `delete-account` flow framed around notes/bills/ledger data
- Dead code in old `main.js` referencing bill cushion / P&L ledger tips

---

## 4. Wallet-only content sources (app)

Pulled from:

- `AppFeaturesModal.tsx` — “No custody. No admin. No backdoor. Your keys, your device.” + Soroban Mainnet lock copy
- `AdvancedVaultForm.tsx` — Cooling-Off / Vesting descriptions
- `SECURITY.md` (app) — non-custodial, keys never leave device, biometric / Keystore
- `settings.tsx` — “Your secret seed never leave this device”

Product name used: **Stellar TimeLock Vault**  
Entity: **StellarTimeLock, LLC**  
Features featured: Time-Lock vaults, Cooling-Off, Vesting, Multi-Asset, Swap (+ on-device wallet)

---

## 5. Files created (this rebuild)

Under `~/wallet-public/landing/`:

| File | Notes |
|------|-------|
| `index.html` | Wallet-only landing |
| `assets/style.css` | Same visual system (comment updated) |
| `assets/main.js` | Typewriter for “Stellar TimeLock Vault” only |
| `assets/logo.png` | Copied from stellartimelock-web (not modified at source) |
| `privacy/index.html` | Wallet-focused privacy |
| `terms/index.html` | Wallet-focused terms |
| `disclosures/index.html` | Wallet-focused disclosures |
| `robots.txt` | Allow all + sitemap |
| `sitemap.xml` | Home + legal |
| `CNAME` | `stellartimelock.com` |
| `.nojekyll` | GitHub Pages: serve as static files |
| `README.md` | Deploy notes |
| `FINDINGS.md` | This document |

Repo root: `~/wallet-public/` (git initialized).

---

## 6. NOT DONE

| Item | Reason |
|------|--------|
| Live Google Play listing URL verification | Placeholder `id=com.stellartimelock.app` kept; listing may not be public yet |
| Legal counsel review of privacy/terms/disclosures | Drafts adapted for wallet messaging; not a lawyer review |
| `delete-account` page | Productivity-era; less relevant for pure non-custodial keys-on-device — omitted intentionally |
| Deploy to GitHub Pages / custom domain DNS | Files are ready; push/host config not executed (not requested) |
| Copy of `Whitepaper.md` / old README easter eggs | Out of scope for wallet marketing page |
| iOS App Store CTA | App messaging is Android / Google Play focused |
| Commit of these files | User did not request a git commit |
