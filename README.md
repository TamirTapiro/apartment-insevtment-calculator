# Apartment Investment Calculator (Israel)

A single-page, bilingual (Hebrew/English), light/dark, ₪/$ calculator for evaluating an apartment as an investment in Israel. Enter purchase, mortgage, renovation, tax and operating costs; see total investment, monthly cost, gross/net yield, cash flow, cash-on-cash and payback.

No build step, no dependencies — plain HTML/CSS/ES-module JS.

## Run locally
Because it uses ES modules, open it through a local server (not `file://`):

```bash
python -m http.server 8000    # then open http://localhost:8000
# or: npx serve
```

## Tests
```bash
npm test    # runs node --test on the calc engine
```

## Deploy to GitHub Pages
1. Push this repo to GitHub.
2. Settings → Pages → Source: `main` branch, `/root`.
3. Open the published URL.

## Updating figures
All tax brackets, ceilings and default fees live in `js/data.js`. Update them there when the 2026 references change; `npm test` guards the math.

> Estimates only — 2026 reference figures, not tax advice.
