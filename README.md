# demireads

A private letters-and-numbers app for one child, built as an installable web
app (PWA) for one family tablet, in landscape.

It is not a product: no accounts, no server, no analytics, no other users. The
design rules it holds itself to are in [CLAUDE.md](CLAUDE.md), the full
requirements in [docs/SPEC.md](docs/SPEC.md), and the screen mockups in
[docs/design-reference/](docs/design-reference/).

## No family media lives here

Photos and voice clips are added through the parent area and stored only in
the browser's IndexedDB on the tablet. Nothing personal is committed, and
there is no server to upload to. `.gitignore` blocks media folders and audio
files, and this repository contains none.

The parent area can export everything — settings, progress, notes, photos and
clips — to a single JSON file, which is both the only backup and the way to
move work between devices.

## Screens

**Child side.** Home, Letter Garden, Family Alphabet Book, Count the Ducks,
A to Z Song, Find It, and Goodnight. Every control is a large picture or
letter, every touch target is at least 120 x 120 CSS px, and a wrong tap in
Find It names what was tapped and shows the right answer without any negative
sound or mark.

**Parent side**, behind a two-finger three-second hold: session length, names,
a word and a photo and a voice clip per letter, the full 26-letter progress
wall with manual override, notes, and backup.

## Commands

```sh
npm install
npm run dev         # development server
npm test            # Vitest
npm run typecheck
npm run build       # type checks, then builds to dist/
npm run preview     # serve the production build, to test offline
```

The learning rules live in `src/engine/` as pure TypeScript with no React and
no browser APIs, which is why they can be tested exactly: the spaced
repetition scheduler, Find It item selection, the session timer, the number
range progression and the letter sequence.

## Deployment

Pushing to `main` builds and publishes to GitHub Pages via
[.github/workflows/deploy.yml](.github/workflows/deploy.yml), which runs the
type check and the tests first. A project site is served from a subpath, so
the workflow sets the base path from the repository name.

The published site is public, as all GitHub Pages sites are. It carries no
family media: everything personal stays on the tablet that added it.
