# Senior Scam Checker — browser extension

Manifest V3 extension (Chrome, Edge, Brave — any Chromium browser). Right-click
selected text on any page (Gmail, Facebook Messenger web, any website) and
choose **"Check for scam"**, or open the toolbar popup to paste text or
upload a photo. Talks directly to the same deployed backend the mobile app
and WhatsApp bot use (`worker/src/index.ts`'s `/check` endpoint) — no backend
changes needed to run this.

## Load it locally

1. Go to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**, select this `extension/` folder
4. Select text on any page → right-click → **Check for scam**, or click the
   toolbar icon to open the popup

## Monetization scaffold (not wired to real payments yet)

- `lib/usage.js` tracks a soft free-tier cap (5 checks/month, stored in
  `chrome.storage.local`, resets automatically each calendar month).
- When the cap is hit, the popup shows an "Upgrade" prompt. Right now the
  upgrade button just opens a `mailto:` link to capture interest — replace
  this with a real checkout (Stripe Checkout is the least-effort option) once
  a price point is picked, and swap `isPro` from a local flag to something the
  backend can verify (a license key checked against `/check`, e.g.), since a
  client-only flag is trivially bypassable by anyone who opens dev tools.

## What's a placeholder right now

- `icons/*.png` are flat-color placeholder squares generated locally, not
  real branding — same as the mobile app's icon situation.
- No options page yet for entering a license key after upgrading.

## Publishing to the Chrome Web Store

1. Create a one-time $5 developer account at
   https://chrome.google.com/webstore/devconsole
2. Zip this folder's contents (not the folder itself): `cd extension && zip -r ../scam-checker-extension.zip .`
3. Upload the zip in the Developer Dashboard, fill in the listing (screenshots,
   description, privacy policy URL — reuse the one in the root `README.md`),
   submit for review.
4. Firefox/Safari need separate packaging (`manifest_version` differences)
   if you want to expand beyond Chromium browsers later.
