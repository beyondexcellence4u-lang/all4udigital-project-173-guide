# All4UDigital AI Marketing Guide

This repository contains a two-page static lead-capture experience that sends validated lead details and the visitor's voluntary marketing-consent choice directly to the active Make webhook.

## Project structure

- `index.html` — required lead form
- `thank-you.html` — guide download and optional booking invitation
- `script.js` — browser-side form validation and direct JSON submission to Make
- `public/OFFICIAL_LOGO.png` — official brand logo
- `public/Project-173-Build-Your-2027-Marketing-Campaign-Guide-Final.pdf` — downloadable guide
- `scripts/verify-public-static.js` — focused static-publication verifier
- `vercel.json` — privacy, indexing, and security headers

## Hosting

The project requires no build command or serverless runtime. Any static host can serve the repository files as-is. The form sends JSON to the active Make bridge at `https://hook.us2.make.com/y39yq1zceealuufs1wskuayaygd0iia4`; Make owns the downstream CRM configuration.

The browser treats only a 2xx Make response as success and then opens `thank-you.html`. Make returns the plain-text response `Accepted`, so the browser does not parse response JSON.

The payload includes the optional `marketingConsent` boolean, the displayed `consentText`, and an ISO `consentCapturedAt` timestamp. The checkbox is unchecked by default and is not required. The site intentionally contains no analytics, trackers, email or SMS automation, API keys, or publishing controls.

## Local review

Run `node scripts/verify-public-static.js` before publication. A basic static server is sufficient for local preview. Use test details only when an end-to-end Make submission has been approved.
