# RaveCall (prototype)

Connect to a concert's sound and control the volume in your own earbuds, and talk with friends during the show.

This version uses **fake data and no real audio**, so it runs in **Expo Go**.

## Screens
- **Join** – enter a concert code (try `NEON42`) or tap a nearby concert.
- **Concert** – volume slider, mute, and what's playing in your earbuds right now.
- **Friends** – create/join a group, mic toggle, and a per-friend
  "Lower concert when they talk" toggle (ducking) with an adjustable duck level.
  Friends "talk" randomly every few seconds, or tap **Test talk**.

## Run it
```
npm install
npx expo start
```
Scan the QR code with Expo Go on your phone (same Wi-Fi as your computer).
If it won't connect, try `npx expo start --tunnel`.

## Code layout
- `src/app/` – screens (Expo Router; each file is a tab)
- `src/state/RaveCallContext.tsx` – shared state, simulated talking, ducking logic
- `src/data/concerts.ts` – fake concerts and friends
- `src/components/ui.tsx` – colors and shared UI pieces
