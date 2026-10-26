# Twigg — Beta Web App (mocked frontend)

Invite-only ride coordination for Cairo commuters. This is the full beta frontend from
`Twigg_App_Overview_Beta_Spec` (Draft 2.0), running entirely on a mock database in the browser.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build
```

## Demo credentials

| What | Value |
| --- | --- |
| OTP code (all SMS is mocked) | `246810` |
| Open invite code / link | `TW-CAIRO1` → `/invite/TW-CAIRO1` |
| Sign in as Nour (verified passenger) | `010 0123 4567` |
| Sign in as Omar (verified carpooler) | `011 1234 5678` |
| Admin dashboard | `/admin`, passcode `twigg-admin` |

The floating **Demo** button switches personas, self-approves an unverified account, opens admin,
and resets the data. Remove `src/components/DemoPanel.tsx` when the backend lands.

## Google Maps

Start/destination pickers (Offer a ride, Request a trip, Home search → **Map**) show the route on a
real Google map.

- **No key (default):** a keyless Google Maps embed previews the real road route between the two
  hubs. You choose hubs from the dropdowns.
- **With a key:** copy `.env.example` to `.env.local` and set `VITE_GOOGLE_MAPS_API_KEY`, then restart
  `npm run dev`. The map becomes interactive: tap a hub (or anywhere within 12 km of one) to set the
  start (A) or destination (B), and the dropdowns stay in sync. Enable **Maps JavaScript API** on the
  key; also enable the **Routes API** to draw real roads with Google distance and time (otherwise
  a dashed straight line is shown). If Google rejects the key, the app falls back to the embed.

Hubs stay the unit of matching (spec §5). The map is a way to choose them, not free-form addresses.
Picker code: `src/components/map/HubMapPicker.tsx`, config: `src/lib/maps.ts`.

## Stack

React 19 + TypeScript, Vite, Tailwind CSS v4, React Router 7, Zustand (persisted), Motion, Lucide,
`@vis.gl/react-google-maps`.

## Architecture

```
src/
  api/index.ts        ← THE backend seam. Every mutation is an async function here.
  store/db.ts         ← Mock DB (zustand + localStorage). Tables mirror future backend entities.
  store/selectors.ts  ← Read hooks + pure selectors (seats taken, ratings, participants…)
  lib/types.ts        ← Domain model (User, Ride, SeatRequest, TripRequest, Review, Incident…)
  lib/geo.ts          ← Pre-defined hubs, static distance math, pickup suggestions
  lib/maps.ts         ← Google Maps key/config, nearest-hub snapping, embed URLs
  lib/fuel.ts         ← (Distance ÷ Consumption) × Price, split with host-included toggle
  data/seed.ts        ← Seed data (Egyptian personas, real Cairo routes)
  pages/              ← auth/, app/, profile/, settings/, admin/
```

**Swapping in a real backend:** replace the bodies in `src/api/index.ts` with HTTP calls and move
reads from `useDB` selectors to a query library (e.g. TanStack Query). Screens only call `api/*`
functions and selector hooks, so the UI should not need to change. The simulator at the bottom of
`api/index.ts` (mock hosts and riders replying after a delay) goes away when real users exist.

Admin-editable constants (fuel prices, consumption, support number, invite limit, review threshold,
native-only flags) live in one `AppConfig` object, ready to become a config endpoint.

## Flows implemented

- Splash → auth routing; Sign in (phone + OTP); invite-only Sign up (code or link) with a 7-step
  progressive onboarding; "Unable to sign in?" help
- Beta disclaimer on first entry (unskippable; acceptance timestamp is stored)
- Waiting room for unverified users (photo, interests, music, ride personality, bio), with route
  guards and disabled CTAs until an admin verifies them
- Home: hub/zone search, filters (date, seats, Flexible/Sharp), public rides feed, public trip
  requests feed for hosts
- Host: create/draft/publish rides, multiple cars, public/private, accept/reject requests,
  3–5 suggested pickups with distance labels, confirm ride, cancel
- Passenger: request seats, post trip requests (public, or private by target ride / share link),
  accept host offers
- Lifecycle: Draft → Pending → Confirmed → Active (pre-ride safety checklist; every participant
  confirms) → Completed / Cancelled
- Fuel estimate and split with disclaimers; offline settlement (Pending/Settled, method, amount)
- Reviews (1–5 + tag) → moderation; hidden until the ride threshold (feature flag)
- Safety reports from a ride, a profile or Support; support number and microcopy
- Profile, privacy toggles, role switch, cars, invites (5 per member, unique codes and links)
- Notifications inbox; Settings; Beta Terms / Disclosures; "Coming in the native app" placeholders
- Admin: overview, verification queue (social verification), members (manual suspend/reinstate),
  rides and settlement overview, safety reports with action log, review moderation, fuel benchmarks

Out of scope per the spec: payments, background/live tracking (section 8 is struck through in
Draft 2.0), automated penalties, compensation, and dark mode (deferred to native).
