# RaveCall (prototype)

Connect to a concert's sound and control the volume in your own earbuds, and talk with friends during the show.

Audio runs on **LiveKit Cloud**. Because LiveKit needs native code, the app runs in a
**development build**, not Expo Go.

## How it works
- Each concert is a LiveKit room named `concert-<CODE>` (e.g. `concert-NEON42`).
  The venue streams music into it; phones listen.
- Each friend group is a room named `group-<CODE>` for voice chat.
- Your volume slider and mute control the concert audio on your phone only.
- **Ducking:** when a friend with "Lower concert when they talk" on is speaking
  (detected by LiveKit), the concert drops to the "volume while talking" level.
- Tokens come from LiveKit Cloud's **development token server**
  (`src/livekit/config.ts`). Development only: replace with your own token endpoint before launch.

## Build and run (Android)
```
npm install
npx eas-cli@latest login
npx eas-cli@latest build --profile development --platform android
```
Install the APK on your phone from the link EAS gives you. Then each time you code:
```
npx expo start --dev-client
```
Open RaveCall on your phone (not Expo Go) and connect to the dev server.
Only rebuild when native packages change.

## Testing the concert audio
There's no real venue, so `tools/venue.html` pretends to be one:
1. Open `tools/venue.html` in Chrome on your computer (double-click it).
2. Pick a concert code (`NEON42`) and a music file, then click **Start streaming**.
3. In the app, join `NEON42`. You should hear the music.

## Code layout
- `index.ts` – entry; registers LiveKit before the app loads
- `src/app/` – screens (Expo Router; each file is a tab)
- `src/state/RaveCallContext.tsx` – LiveKit rooms, volume, mic, ducking logic
- `src/livekit/` – LiveKit setup and token config
- `src/data/concerts.ts` – concert list (still hard-coded)
- `src/components/ui.tsx` – colors and shared UI pieces
- `tools/venue.html` – laptop page that streams music into a concert room
