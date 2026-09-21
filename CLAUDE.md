# CLAUDE.md

## What this is

A private learning app for one child, Sebastian (age 2), to build early letter and number recognition. It runs as an installable web app (PWA) on one family tablet, in landscape. It is not a product: no accounts, no server, no analytics, no other users.

Full requirements live in `docs/SPEC.md`. The phased plan lives in `docs/BUILD_PLAN.md`. Visual mockups live in `docs/design-reference/` (see the README there). Read the relevant section of the spec before starting any task.

## Non-negotiable rules

These come from the design goals for a two-year-old. Do not trade them away for convenience.

1. **No failure feedback on the child side.** No buzzers, red X marks, "wrong," shaking, or score loss. A wrong tap names what was tapped and gently highlights the right answer.
2. **No network at runtime.** After install, the app must work fully offline. No analytics, telemetry, crash reporting, remote fonts, CDNs, or third-party calls. Fonts are self-hosted.
3. **Family media never enters the repo.** Photos and voice clips are added through the parent area and stored only in the browser's IndexedDB on the tablet. Never commit personal media. `.gitignore` must exclude any local media folders.
4. **No text-based navigation for the child.** Every child-side control is a large picture or letter. Text on child screens is for the parent's benefit only.
5. **Touch targets on child screens are at least 120 x 120 CSS px.** Parent-area targets are at least 44 x 44.
6. **Every child tap gives immediate feedback** (sound or motion within about 100 ms).
7. **Sessions end.** The session timer always wins; when it expires, the Goodnight screen shows and the child side stays locked until the parent gate is passed.
8. **Respect reduced motion.** Honor `prefers-reduced-motion`.

## Tech stack

- Vite + React + TypeScript (strict mode).
- Plain CSS with CSS custom properties for design tokens (no CSS framework).
- IndexedDB for all persistent data, through a small typed wrapper in `src/storage/`. A helper library such as Dexie or idb is acceptable; confirm the current API in its docs before using it.
- PWA: web app manifest plus a service worker that precaches the app shell. A Vite PWA plugin is acceptable; confirm current configuration options in its docs.
- Fonts: Fredoka (display) and Nunito (body), self-hosted (for example via Fontsource packages; confirm package names before installing).
- Tests: Vitest for logic. The scheduler and session timer must have unit tests.

If you are unsure whether a library function or config option exists, check the installed version's documentation or type definitions rather than guessing.

## Project layout (target)

```
src/
  app/            routing, app shell, session controller
  screens/        one folder per screen (Home, LetterGarden, FamilyBook, CountDucks, AlphabetSong, Goodnight, parent/*)
  components/     shared UI (BigTile, HomeButton, ParentGate, SpeakerButton)
  engine/         scheduler (spaced repetition), sequencing, session timer; pure TypeScript, no React
  storage/        IndexedDB access, export/import
  audio/          audio playback, speech fallback, recording
  content/        default content: letters, sounds, example words, number set, default sequence
  styles/         tokens.css, global.css
docs/
```

Keep `engine/` free of React and browser APIs so it stays unit-testable.

## Design tokens

Take these from the mockups. Define them once in `src/styles/tokens.css`.

| Token | Value | Use |
|---|---|---|
| `--ground` | `#FBF6EC` | child-side background |
| `--ground-parent` | `#F3EEE3` | parent-side background |
| `--ink` | `#2B2A33` | text |
| `--tomato` | `#C8431F` | tile color 1 (white text) |
| `--teal` | `#17706F` | tile color 2 (white text) |
| `--sun` | `#F2C14E` | tile color 3 (ink text) |
| `--plum` | `#5B4B9A` | tile color 4 (white text) |
| `--sand` | `#EFE8DA` | quiet buttons, unlit tiles |
| `--night` | `#1E2A4A` | Goodnight background |

Tile colors cycle in the order tomato, teal, sun, plum by item index.

## Commands

Keep these accurate.

- Install: `npm install`
- Dev server: `npm run dev`
- Tests: `npm test` (watch mode: `npm run test:watch`)
- Type check: `npm run typecheck`
- Build: `npm run build` (type checks first, then builds to `dist/`)
- Serve the production build: `npm run preview` — use this with the network disabled in dev tools to check offline behavior

## Definition of done for any task

- Type check passes, tests pass, build succeeds.
- The feature works offline (test with the network disabled in dev tools after a production build).
- Child-side screens were checked at 1180 x 820 in landscape.
- No new runtime network requests were introduced.
- The non-negotiable rules above still hold.

## Working style

- Work in the phases in `docs/BUILD_PLAN.md`, one phase at a time. Stop at the end of each phase and summarize what changed and how to test it on the tablet.
- Ask before adding a dependency that is not listed in this file.
- Prefer small, readable code over clever abstractions. This app has one user.
