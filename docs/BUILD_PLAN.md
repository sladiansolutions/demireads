# Build plan

Work one phase at a time. At the end of each phase, stop, summarize the changes, and list how to test them on the tablet. Each phase has a prompt you can paste into Claude Code.

## Phase 0: Scaffold

**Prompt:**
> Read CLAUDE.md and docs/SPEC.md. Scaffold the project as described in CLAUDE.md: Vite, React, TypeScript strict, Vitest, the target folder layout, design tokens in src/styles/tokens.css, self-hosted Fredoka and Nunito fonts, and npm scripts for dev, test, typecheck, and build. Add a .gitignore that excludes node_modules, dist, and any local media folders. Fill in the Commands section of CLAUDE.md. Do not build any screens yet. Show me the dependency list before installing.

**Done when:** `npm run dev`, `npm test`, `npm run typecheck`, and `npm run build` all succeed on an empty app.

## Phase 1: Shell, Home, Letter Garden, Family Book

**Prompt:**
> Implement phase 1 from docs/BUILD_PLAN.md. Build the app shell with simple in-app routing, the Home screen, Letter Garden, and Family Alphabet Book, matching docs/design-reference/. Use the default content in src/content/ with speech synthesis as the audio fallback. For now, the Letter Garden active set is the letters of the child's name from settings (default "Sebastian"). No storage yet beyond in-memory state.

**Done when:** on the tablet, he can tap tiles on Home, explore letters with sound, and page through the book.

## Phase 2: Storage, parent gate, parent area, media

**Prompt:**
> Implement phase 2. Add the IndexedDB storage layer from SPEC section 6, the parent gate from SPEC section 4, and the parent area from SPEC section 3.8 except manual override and notes export. Parents must be able to upload a photo and an audio clip per letter and see them used in Letter Garden and Family Book. Request persistent storage on first launch.

**Done when:** photos and voices added in the parent area survive closing and reopening the app.

## Phase 3: Count the Ducks, A to Z Song, session timer, Goodnight, PWA

**Prompt:**
> Implement phase 3. Build Count the Ducks with the number rules in SPEC 5.5, the A to Z Song screen, the session timer from SPEC 5.6, and Goodnight with its lock. Make the app an installable offline PWA. Write unit tests for the session timer and number range progression.

**Done when:** the app installs to the home screen, works in airplane mode, and ends sessions with Goodnight at the set limit.

## Phase 4: Learning engine and Find It

**Prompt:**
> Implement phase 4. Build the scheduler in src/engine/ exactly as SPEC 5.2 to 5.4, as pure TypeScript with thorough Vitest tests first. Then build the Find It screen and the All 26 letters parent view, and connect Letter Garden's active set to the scheduler. Add the manual override in the parent area.

**Done when:** tests cover every rule in SPEC 5.3, and the letter wall reflects real progress.

## Phase 5: Polish and extras

Done early, in phase 2: in-app voice recording, with the file picker kept as
the fallback. Also added in phase 2, outside the original plan: a parent
setting for Family Book page order, and bundled default illustrations for the
example words.

Options, in suggested order:
- Notes with export and import (JSON).
- Song timing marks so letters light in sync with a recorded song.
- Parent reordering of the letter sequence.
- Media export for backup.

## Testing on the tablet

- Deploy the production build to a static HTTPS host after each phase.
- Open it on the tablet, add it to the home screen, then turn on airplane mode and relaunch.
- Enable Guided Access (iPad) or screen pinning (Android) before handing it to him.
- Watch him use it. His behavior is the real test of each screen.
