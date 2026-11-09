# The Football Atlas

**Live: https://payrghfgh.github.io/the-football-atlas/** · deployed to GitHub Pages from this repo on
every push to `main` (see `.github/workflows/deploy.yml`).

A searchable encyclopedia of football: **88 players, 29 nations, 147 clubs and 25 World Cup
editions (1930 → 2026)** in one statically generated Next.js site.

Every player page carries career numbers, a six-axis skill profile, an EA-FC-style rating card
(exportable as a PNG), honours, an international record and a computed list of similar players.
Every World Cup from 1930 to 2026 has a timeline node — including the two cancelled years, which
are kept on the line rather than skipped. The 2026 edition is recorded as played: Spain beat
Argentina 1–0 after extra time in New York New Jersey on 19 July 2026, with Kylian Mbappé taking the
Golden Boot and Rodri the Golden Ball.

---

## Stack, and why

| Choice | Reason |
| --- | --- |
| **Next.js 15 (App Router) + TypeScript** | The brief asks for it; every page is prerendered at build time, so the site is static-deployable with no server. |
| **Tailwind CSS 3** | Design tokens live in CSS variables, so the light/dark themes swap without duplicating classes. |
| **Recharts** | Radar + bar charts are the only chart types needed; Recharts keeps them declarative and SSR-safe. |
| **Framer Motion** | Used for one thing only — a 220 ms fade-and-rise on scroll — and disabled under `prefers-reduced-motion`. |
| **html-to-image** | Renders the rating card to PNG in the browser, so there is no server-side image service. |
| **country-flag-icons** | Vector flags (never emoji), imported per country code and tree-shaken. |
| **Local JSON dataset** | Data is read on the server from `src/data/*.json`. Swap the file, rebuild, ship. No API keys. |
| **Canvas + rAF for the game** | The penalty shootout draws at 240×160 and scales up with nearest-neighbour, so the pixel art costs no image requests and no extra dependencies. |

Fonts (Bebas Neue for display, Inter for body) are self-hosted through `@fontsource`, so the build
never calls Google Fonts.

---

## Run it locally

```bash
npm install
npm run dev          # http://localhost:3000
```

Production build:

```bash
npm run build && npm start
```

Other scripts:

```bash
npm run typecheck    # tsc --noEmit
npm run data         # rebuild src/data/*.json from scripts/*.py
```

No environment variables are required. Copy `.env.example` to `.env.local` only if you want to set
`NEXT_PUBLIC_SITE_URL` for canonical URLs and the sitemap.

---

## Deploy

**Netlify** — connect the repository. Build command `npm run build`, publish directory `.next`
(the Netlify Next.js runtime handles the rest), Node 20. No environment variables needed.

**Vercel** — import the repository and accept the detected defaults.

**Any static host** — the build prerenders all 276 routes; `next export`-style hosting works if you
prefer it, and there are no runtime APIs to configure.

---

## Extending the dataset

The whole site reads from five files in `src/data/`. They are generated from readable Python source
in `scripts/`, but you can also edit the JSON directly — nothing else needs to change.

```
src/data/players.json      ← the player records
src/data/countries.json    ← derived from players, plus country metadata
src/data/clubs.json        ← derived from players, plus honours
src/data/tournaments.json  ← 1930 → 2026
src/data/meta.json         ← counts, snapshot date, scope statement, data gaps
```

### Add a player

Append an object to `players.json` (or a record to `scripts/players_*.py` and run `npm run data`).
The shape is the one the brief specifies:

```jsonc
{
  "id": "lionel-messi",              // slug, also the URL: /players/lionel-messi
  "name": "Lionel Messi",
  "fullName": "Lionel Andrés Messi Cuccittini",
  "photoUrl": null,                  // set to a licensed image URL to replace the monogram
  "nationality": "Argentina",
  "countryCode": "AR",               // ISO 3166-1 alpha-2, used for the flag
  "confederation": "CONMEBOL",
  "position": "RW",
  "secondaryPositions": ["CAM", "ST"],
  "dateOfBirth": "1987-06-24",
  "heightCm": 170,
  "preferredFoot": "Left",
  "shirtNumber": 10,
  "clubs": ["Barcelona", "Paris Saint-Germain", "Inter Miami"],
  "careerGoals": 850,
  "careerAssists": null,             // null → renders "—" with a "not recorded" tooltip
  "internationalCaps": 196,
  "internationalGoals": 114,
  "worldCupGoals": 13,
  "worldCupAppearances": 26,
  "honours": ["FIFA World Cup 2022", "8× Ballon d'Or"],
  "attributes": { "pace": 82, "shooting": 92, "passing": 92,
                  "dribbling": 96, "defending": 34, "physical": 64 },
  "overall": 94,
  "potential": 94,
  "skillMoves": 4,
  "weakFoot": 2,
  "workRate": "Medium/Low",
  "playStyles": ["Technical Dribbler", "Incisive Pass"],
  "era": "2000s-2020s",
  "bio": "60–120 words…",
  "ratingSource": "Atlas model v1",  // or "EA FC 25" when you hold the licensed values
  "ratingEdition": "Atlas model v1",
  "goalsBreakdown": { "openPlay": 600, "header": 40, "penalty": 60,
                      "freeKick": 40, "leftFoot": 595, "rightFoot": 255 }
}
```

Then run `npm run build`. New players appear automatically in the index, the search palette, the
sitemap and (if you add them to `squadIds`) their country and club pages.

### Swap in a bigger dataset

`src/lib/data.ts` is the only place that touches the JSON. Point it at a larger file (or a
database query) and the rest of the site follows, because every page reads through
`allPlayers`, `getPlayer`, `allCountries`, `getCountry`, `allClubs`, `getClub` and `allTournaments`.

### Attach official ratings

Set `ratingSource` to the edition name on any record where you hold published values (for example
`"EA FC 25"`). The rating card, the radar caption and the home-page card read that field and label
the numbers as official instead of "Estimated · Atlas model v1". Until then **no number on this site
is presented as an official EA rating.**

---

## Data honesty

This is a deliberate part of the build, not a disclaimer bolted on:

- **Scope is stated, never hidden.** The defined scope is every player who appeared in a World Cup
  squad 1930–2022, plus a 2026 pool and current internationals — roughly 4,800 players. This build
  ships a **curated subset of 87**, and the Players page prints the count it is actually showing next
  to the total, with a link to the scope note on `/about`.
- **The 2026 record is complete, the players' 2026 tallies are not.** The tournament node carries
  the verified result, awards, team/match/goal counts and total attendance (6,810,966). Player
  career totals were recorded before the 2026 edition and are deliberately *not* topped up, because
  per-player 2026 figures are not in this snapshot — the player pages say so.
- **Unknown values are `null`.** They render as `—` with a `not recorded` tooltip: FIFA rankings,
  country win/draw/loss records, per-club and per-season appearance totals, several attendance
  figures, and every career assist count.
- **Ratings are estimates and say so.** All overall and attribute values come from the Atlas model
  (position + era baseline, adjusted for recorded output and physical profile). The method is
  documented on `/about#methodology`.
- **The goal breakdown is modelled.** It is derived from shooting/physical scores and preferred foot,
  and is labelled "Estimated (Atlas model)" wherever it appears.
- **Photographs are not shipped.** `photoUrl` is `null`, so the UI renders a deterministic monogram
  whose alt text says there is no photograph in the dataset. Drop in licensed URLs to change that.
- **Snapshot date is visible** in the footer, on `/about`, and in `meta.json` (`2026-11-05`).

Sources cited on `/about`: FIFA tournament archives, RSSSF, national federation archives, and the
EA FC rating databases (as the future source for official ratings).

---

## Project structure

```
src/
  app/
    layout.tsx                 fonts, theme script, header/footer
    page.tsx                   home: hero, stat strip, player of the day, leaderboard, timeline teaser
    players/page.tsx           index shell (Suspense + client explorer)
    players/[id]/page.tsx      profile: radar, rating card, stats, honours, similar players
    countries/…                index grouped by confederation, country detail
    clubs/…                    index by squad size, club detail
    timeline/page.tsx          the 1930–2026 rail
    compare/page.tsx           up to four players, URL-synced
    about/page.tsx             scope, methodology, data gaps, sources
    search/page.tsx            full-page search
    play/page.tsx              pixel penalty shootout (canvas game)
    not-found.tsx              404
    sitemap.ts, robots.ts
  components/                  header, palette, table, charts, rating card, timeline, compare…
  data/                        the JSON dataset
  lib/                         typed data access + formatting helpers
scripts/
  players_*.py, tournaments.py, metadata.py   the dataset source
  build_dataset.py             generates src/data/*.json (deterministic, seeded)
  screenshots.mjs              captures the handoff screenshots
```

### Features map

| Brief | Where |
| --- | --- |
| Global search with instant results, `/` shortcut | `components/CommandPalette.tsx` (also `⌘K`) |
| Virtualised, sortable, filterable player table | `components/PlayersExplorer.tsx` |
| URL-synced filters, shareable links | same file — every control writes to the query string |
| Rating card exportable as PNG | `components/RatingCard.tsx` (`html-to-image`) |
| Random player | header button, `components/SiteHeader.tsx` |
| Light/dark toggle | `components/ThemeToggle.tsx` + CSS variables |
| Loading skeletons | `app/players/loading.tsx`, `app/players/[id]/loading.tsx`, inline Suspense fallbacks |
| Empty states | player table, compare, search, club honours |
| Keyboard navigation | palette (↑ ↓ ↵ esc), timeline rail (← →), game (arrows + space), skip link, visible focus rings |
| Pixel penalty game | `components/PenaltyGame.tsx` — 5 shots, aim/power phases, keeper AI, best score in localStorage |

---

## The penalty shootout game

`/play` is a small arcade game drawn entirely on a `<canvas>` at 320×200 and scaled up with
`image-rendering: pixelated` — no sprites, no image requests, no game libraries.

**On screen** — three tiers of stand with a crowd, floodlights throwing cones across the pitch, a goal
with angled side netting and depth, a keeper with an idle pose and a full-stretch dive, a striker who
follows through as the ball leaves, a ball with a trail and spin detail, confetti on a goal, and a
scoreboard carrying the running score, the shot number, your best and a pip per penalty (green goal,
red save, grey off target).

**Playing it**

- **Aim** — anywhere in the goal mouth, not a fixed grid. Arrows/WASD (hold Shift for fine aim), the
  on-screen pad, or the pointer: move to aim, click to lock.
- **Power** — a bar sweeps between 6% and 100% with a highlighted sweet-spot band. Above 94% the ball
  climbs over the bar; below 20% the keeper reaches it. Space or Strike releases.
- **The keeper** — he dives at the ball rather than at a zone. The shot is judged on the distance
  between where the ball lands and his hands, and he reads your aim more often each round, so the
  corner that worked in round one gets closed down by round five.
- **Difficulty** — Amateur, Pro and World class change how often he reads you, how far his dive can
  stray and how far he can reach. The choice is remembered.
- **Summary** — after five penalties you get a verdict (Perfect five → Nightmare) with goals, saves,
  shots off target and the difficulty you played, plus your best score kept in `localStorage`.
- **Accessibility** — every shot is announced through an `aria-live` region, all controls exist as
  buttons so the game is playable without a pointer, and the flight and confetti animations are
  skipped under `prefers-reduced-motion`.

## Screenshots

The captures below are produced locally by `scripts/capture-all.mjs` and `scripts/capture-game.mjs`.
They are build artifacts, so they are not committed — regenerate them with the commands underneath.
Taken from the production build at 1440 px (`mobile-home.png` at 390 px):

- `home.png`
- `player.png` — `/players/lionel-messi`
- `timeline.png` — `/timeline?year=1986`
- `players-index.png`
- `mobile-home.png`

Regenerate them after a build with:

```bash
npm run build
node scripts/capture-all.mjs     # every page, light + dark + mobile, into screenshots/all/
node scripts/screenshots.mjs     # the three handoff shots only
```

Both need `puppeteer-core` and a local Chromium, and both serve the exported `out/` folder themselves.

## Deploying to GitHub Pages

The build is a **static export** (`output: "export"`), so `npm run build` writes `out/` — that folder
is the whole site.

```bash
NEXT_PUBLIC_BASE_PATH=/<repo-name> npm run build     # project page: <user>.github.io/<repo-name>/
npm run build                                        # user page or custom domain: no base path
```

Then publish `out/`. Two ways:

1. **Branch** — copy `out/` to a `gh-pages` branch and set Settings → Pages → Source to that branch.
   `public/.nojekyll` is already in the repo so the `_next` folder is served.
2. **Actions** — add a workflow that runs `npm ci`, then
   `NEXT_PUBLIC_BASE_PATH=/${{ github.event.repository.name }} npm run build`, uploads `out/` with
   `actions/upload-pages-artifact` and deploys with `actions/deploy-pages`. Set Pages → Source to
   “GitHub Actions”.

`npm start` no longer applies — with a static export there is no Node server. Preview locally with
`npx serve out` or `python3 -m http.server --directory out`.

---

## The fictional entry

`scripts/players_fictional.py` holds one record that is **not a real footballer**: Gurman Singh
Bindra, an England forward at Manchester United rated 99, with 108 career goals and ten elasticos,
supplied by the project's owner. It is in the dataset with `isFictional: true` and appears with a
“Fictional” badge on the player index, the home page and its own profile, where a notice states
plainly that no real player is being described. It is excluded from the defined scope and from the
honesty claims in this README. Delete the file's entry (and re-run `npm run data`) to remove it.

## Licence / attribution

Football records are facts; the editorial selection, copy and design here are the project's own.
No EA Sports assets, logos or licensed rating values are included. Club and competition names are
used descriptively.
