# Scam Checker

Paste a suspicious text/email or take a photo of a letter, and get a plain
English verdict: likely a scam, looks legitimate, or uncertain — plus what to
do next. Built for older adults who are frequent scam targets.

- `App.tsx`, `components/`, `lib/`, `constants/` — the Expo (React Native +
  TypeScript) app.
- `worker/` — a Cloudflare Worker backend that holds the Anthropic API key and
  proxies the scam-check request to Claude.

## 1. Run the backend locally

```
cd worker
cp .dev.vars.example .dev.vars   # then paste in a real Anthropic API key
npm run dev                       # starts on http://localhost:8787
```

Sanity check it's working:

```
curl -X POST http://localhost:8787/check \
  -H "Content-Type: application/json" \
  -d '{"text":"You won a $1000 gift card, click here to claim now!"}'
```

You should get back `{"verdict":"scam", "reason": "...", "action": "..."}`.

## 2. Run the app locally

In a second terminal, from the project root:

```
npm start
```

Scan the QR code with the Expo Go app on your iPhone and Android phone. The
app talks to `http://localhost:8787` by default (see `lib/api.ts`), which
works from a simulator but **not from a physical phone** unless your phone
and computer are on the same network and you point it at your computer's LAN
IP, e.g.:

```
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.23:8787 npm start
```

(Find your LAN IP with `ipconfig getifaddr en0` on macOS.)

## 3. Deploy the backend for real

The app in production needs the worker deployed somewhere public — testing
via Expo Go against `localhost` only works while your computer is running.

```
cd worker
npx wrangler login                        # opens a browser to log into Cloudflare (free account is fine)
npx wrangler secret put ANTHROPIC_API_KEY # paste your real key when prompted
npm run deploy                            # deploys to https://senior-scam-checker-api.<your-subdomain>.workers.dev
```

Then set that URL for the app build (see `eas.json` / EAS secrets below), so
the shipped app points at the real backend instead of `localhost`.

## 4. Build and submit to the app stores (EAS)

This machine doesn't have Xcode or Android Studio installed, so builds run in
Expo's cloud (EAS Build) instead of locally — no local Xcode/Android Studio
needed.

```
npx eas login                     # create a free Expo account if you don't have one
npx eas init                      # links this project to your Expo account
npx eas secret:create --scope project --name EXPO_PUBLIC_API_BASE_URL --value https://<your-worker-url>
npx eas build --platform all      # builds the iOS .ipa and Android .aab in the cloud
```

Submitting to the stores additionally requires:

- **Apple Developer Program** ($99/yr) — enroll at
  https://developer.apple.com/programs/enroll/. Identity verification can
  take anywhere from under an hour to ~48 hours, so start this early.
- **Google Play Console** ($25 one-time) — sign up at
  https://play.google.com/console/signup.

Once both are set up:

```
npx eas submit --platform ios       # goes to TestFlight, then submit for App Store review from App Store Connect
npx eas submit --platform android   # goes to Play Console, promote from internal testing to production when ready
```

You'll also need a public URL for `PRIVACY.md` in this repo — both stores
require a privacy policy link in the listing (GitHub's raw file view or
GitHub Pages both work for this).

## What's a placeholder right now

- The app icon/splash screen (`assets/icon.png`, etc.) are the generic Expo
  defaults — fine for TestFlight/internal testing, but swap in real branding
  before a public store listing.
- `PRIVACY.md` has a placeholder contact email — fill in a real one before
  submitting to the stores.
