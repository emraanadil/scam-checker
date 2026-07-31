# Senior Scam Checker — browser extension

Manifest V3 extension (Chrome, Edge, Brave — any Chromium browser). Right-click
selected text on any page (Gmail, Facebook Messenger web, any website) and
choose **"Check for scam"** to get a verdict as an in-page card, or open the
toolbar popup to paste text or upload a photo. Talks directly to the same
deployed backend the mobile app and WhatsApp bot use
(`worker/src/index.ts`) — no backend changes needed to run the free tier.

## Structure

- `manifest.json` — MV3 config
- `background.js` — service worker: context menu, injects the in-page card, calls the API
- `content.js` — the in-page verdict card, rendered inside a Shadow DOM host so it never inherits or leaks CSS from the page it's injected into
- `popup.html/js/css` — toolbar popup (paste text / upload photo)
- `options.html/js/css` — settings page (appearance, text size, Pro license)
- `welcome.html` — first-run onboarding page, opened once on install
- `lib/api.js` — shared fetch helpers for `/check` and `/license/verify`
- `lib/usage.js` — soft free-tier counter (5 checks/month) stored in `chrome.storage.local`
- `lib/license.js` — Pro license activation + periodic server re-validation
- `lib/theme.js` / `lib/appearance.js` — shared brand colors and the dark-mode/text-size CSS variables, kept in sync with the mobile app's `constants/theme.ts`

## Load it locally

1. Go to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**, select this `extension/` folder
4. Select text on any page → right-click → **Check for scam**, or click the
   toolbar icon to open the popup

## Monetization

Free tier: 5 checks/month, tracked client-side. Pro: one-time $19.99 purchase,
unlocks unlimited checks everywhere the same browser profile is signed in.

**This is real, not a placeholder** — `worker/src/license.ts` backs a
`/license/verify` endpoint against a Cloudflare KV namespace
(`LICENSES`, bound in `worker/wrangler.toml`). A key is valid only if it
exists in that store with the value `active`. The extension re-checks the
stored key against the server once a day, so a refunded/revoked key stops
working within 24 hours.

**What's still manual** (by design, until there's real sales volume to
justify automating it): the "Buy Pro" button opens a `mailto:` to
`emraanadil.dsp@gmail.com` rather than a checkout page. After collecting
payment by whatever means (PayPal, Venmo, Stripe Payment Link — anything),
issue the buyer a key yourself:

```
cd worker
npx wrangler kv key put --binding=LICENSES "<key-you-make-up>" "active" --remote
```

Email that key to the buyer; they paste it into **Settings → Activate**.
Revoke a key (refund, chargeback) with:

```
npx wrangler kv key delete --binding=LICENSES "<key>" --remote
```

**Next step to actually automate this**: replace the `mailto:` with a Stripe
Payment Link or Checkout session, and add a Stripe webhook route on the
worker that auto-generates and KV-writes a key (and emails it) on successful
payment. Needs a Stripe account — that part has to be a human decision
(pricing, business entity, tax handling), not something to wire up silently.

## Icon credit

The shield-check glyph in `icons/` is [Lucide](https://lucide.dev)'s
`shield-check` icon (`icons/source.svg` has the original), composited onto a
brand-blue rounded square and rasterized with `rsvg-convert`. Lucide is
ISC-licensed — free for commercial use, no attribution legally required, but
crediting it here since it's their design. To swap in a different Lucide
icon later: grab the SVG from
`https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/<name>.svg`,
drop its `<path>` into `icons/source.svg`, then re-run
`rsvg-convert -w <size> -h <size> source.svg -o icon<size>.png` for 16/32/48/128.

## What's a placeholder right now

- No options page yet for bulk-managing licenses (KV writes are done via the
  `wrangler` CLI, above).

## Publishing to the Chrome Web Store

1. Create a one-time $5 developer account at
   https://chrome.google.com/webstore/devconsole
2. Zip this folder's contents (not the folder itself):
   ```
   cd extension && zip -r ../scam-checker-extension.zip . -x '*.DS_Store'
   ```
3. Upload the zip in the Developer Dashboard. Suggested listing copy:
   - **Name**: Senior Scam Checker
   - **Summary**: Right-click any suspicious text to instantly check if it's a scam. Plain-English verdicts, built for the whole family.
   - **Category**: Productivity or Social & Communication
   - **Privacy policy URL**: the one in the root `README.md`
   - Screenshots: capture the in-page card on a real email/message, and the popup — do this after loading the extension locally
4. Submit for review (usually a few days for a new extension, longer if
   permissions look broad — `activeTab` + `scripting` + one `host_permissions`
   entry scoped to our own API is about as minimal as this kind of extension
   gets, which helps).
5. Firefox/Safari need separate packaging (`manifest_version` differences)
   if you want to expand beyond Chromium browsers later.
