# Sebastian's ABC and 123 app: specification

## 1. Goals and non-goals

**Goals.** Support early letter recognition (uppercase shapes, names, and sounds), early number sense (counting 1 to 10, recognizing small quantities, matching numerals to quantities), and enjoyment of letters, through short sessions a parent can share with the child.

**Non-goals.** Teaching reading or writing, replacing shared book reading, maximizing time on screen, supporting other children or devices.

**Evidence note.** The design choices (errorless feedback, name letters first, co-play prompts, short sessions, spaced review) are based on general findings in early childhood development research. Specific thresholds in this document (active set size, promotion rules, timings) are design heuristics chosen for this app, not research-validated values. Tune them by watching the child.

## 2. Platform

- Installable PWA, landscape, primary target a single tablet (design size 1180 x 820 CSS px; layouts must scale to other tablet sizes).
- Fully offline after first load.
- Locked in single-app mode by the OS (Guided Access on iPad, screen pinning on Android). The app does not attempt to enforce this itself.
- Hosted as a static site over HTTPS (required for service workers). Any static host works. The repository contains no personal media, so hosting the code publicly exposes nothing private, but a private repository is still recommended.

## 3. Screens

Mockups for each screen are in `docs/design-reference/`. Match their layout, colors, and type.

### 3.1 Home (child)
- Greeting: "Hi, Sebastian!" (child's name stored in settings).
- Four large tiles: Letters, Family Book, 1 2 3, A to Z.
- Small, muted lock button in the top right opens the parent gate.
- If a session has expired, Home is replaced by Goodnight.

### 3.2 Letter Garden (child)
- Shows the current **active set** of letters (maximum 7) as large colored tiles.
- Tapping a tile: the tile bounces, the spotlight panel shows the letter large, and audio plays "[Letter] is for [example word]." The phonics sound is not spoken here; it appears only in the parent-facing co-play prompts.
- Spotlight panel shows two example pictures for the selected letter: parent photos first if present, otherwise default illustrations.
- A speaker button replays the sound.
- Taps here count as **exposures only**, never as evidence of knowing.
- Co-play prompt: after every 5th tap, a small parent-facing line appears for 5 seconds, for example "Ask him: what else starts with /b/?"

### 3.3 Family Alphabet Book (child)
- One page per letter, all 26 available from day one, in the current sequence order.
- Page shows parent photo (or default illustration), the letter large, "is for [word]", and a speaker button playing the recorded voice (or speech fallback).
- Large previous and next arrows plus swipe. Page dots at the bottom.
- No questions, no scoring.

### 3.4 Count the Ducks (child)
- Shows N ducks on a pond, where N comes from the number scheduler (starts at 1 to 3).
- Each tap on an uncounted duck lifts it, shows the next number above it, and plays that number word.
- After the last duck: the numeral appears large, audio says "[N] ducks!", with emphasis on the total.
- "Again" button resets with a new N.
- Completing a round records one correct counting trial for N.

### 3.5 A to Z Song (child)
- All 26 letters in a grid, unlit.
- Play: letters light up one at a time in order, current letter slightly enlarged, synced to a recorded song if the parent provided timing marks, otherwise at a fixed interval (700 ms default).
- Pause and resume. Exposure only, no scoring.

### 3.6 Find It (child) [phase 4]
- Prompt audio: "Where is [letter]?" Shows 2 choices at first, up to 4 as difficulty grows.
- Correct tap: celebration animation and sound, record correct.
- Other tap: names the tapped letter ("That's M!"), then highlights the target ("Here's B!"), record incorrect. No negative sound.
- This is the **only** activity that produces recognition evidence for letters.
- Distractor difficulty: easy distractors are visually distinct from the target; harder levels allow visually similar pairs (see 5.4).

### 3.7 Goodnight (child)
- Calm night scene, "Goodnight, letters!" and "See you tomorrow, [name]."
- Plays a short goodnight audio clip once.
- Stays until the parent gate is passed. No other controls on the child side.

### 3.8 Parent area
Reached only through the parent gate. Contains:
- **Session length** slider: 5, 10, 15, 20 minutes (default 10).
- **Child's name** and **family names** (used to build the letter sequence, see 5.2).
- **Letter progress** summary and a button to the full 26-letter wall.
- **Photos and voices**: per letter, add or replace a photo and a voice clip; per number 1 to 10, a voice clip; one goodnight clip; one song clip.
- **Notes**: free text with date, for off-screen observations.
- **Export** and **Import** of progress, settings, and notes as JSON. (Media export is optional, phase 5.)
- **Manual override**: set any letter's box by hand.
- **Unlock**: ends Goodnight lock and starts a fresh session on next visit to Home.

### 3.9 All 26 letters (parent)
- Grid of all 26 letters, each showing its state with color and a text label: Knows it, Learning, New, Not started.
- "Up next" line showing the next letters in the sequence.

## 4. Parent gate

- Hold two fingers on the lock button for 3 seconds. A ring fills during the hold; releasing early cancels silently.
- Desktop development fallback: in dev builds only, a mouse hold of 3 seconds also works.
- No gate on leaving the parent area.

## 5. Learning engine

### 5.1 Items
- Letters: 26 uppercase letters, each with name audio, sound audio, sound label (for example `/b/`), and default example words.
- Numbers: 1 to 10, each with number word audio.

### 5.2 Letter sequence
Order in which letters enter the active set:
1. Distinct letters of the child's name, in order of first appearance (for "SEBASTIAN": S, E, B, A, T, I, N).
2. First letters of family names entered by the parent, skipping duplicates.
3. Remaining letters from a default order stored in `src/content/sequence.ts`, which keeps visually similar pairs apart and places Q, X, Z last. The default order is a design choice; the parent can reorder in a later phase.

### 5.3 Boxes and state
Each letter is in one state:
- `0` Not started (not yet in the active set)
- `1` New
- `2` Learning
- `3` Knows it

Rules:
- The active set is all letters in states 1 and 2, capped at 7. Letters in state 3 leave the Letter Garden but appear in Find It as review.
- **Introduce a new letter** (0 to 1) when the active set has fewer than 7 letters, or when at least 70 percent of active letters are in state 2 and at most 2 are in state 1. Introduce at most 1 new letter per day.
- **Promote** one state when the letter has at least 2 correct Find It responses on each of 2 different calendar days since its last state change.
- **Demote** one state (never below 1) after 2 incorrect Find It responses for that letter within a single session.
- Parent manual override always wins and resets the counters for that letter.

### 5.4 Find It item selection
- Pick targets by weight: state 1 weight 3, state 2 weight 2, state 3 weight 1.
- Do not repeat the same target twice in a row.
- Number of choices: 2 by default; 3 once 5 letters are in state 3; 4 once 10 are.
- Visually similar pairs (for distractor difficulty): E/F, P/R, B/P, O/Q, C/G, M/N, M/W, V/W, I/L, U/V. Use a similar-pair distractor only when the target is in state 3.

### 5.5 Numbers
- Counting range starts at 1 to 3. Expand to 1 to 5 after 5 completed rounds at the current maximum across at least 2 days, then 1 to 10 by the same rule.
- Pick N uniformly within the current range, avoiding repeating the same N twice in a row.

### 5.6 Session timer
- Starts on first child-side interaction after unlock.
- Counts only while the app is visible.
- When it reaches the limit, the current interaction finishes (for example the counting audio completes), then Goodnight shows.

## 6. Data model (TypeScript)

```ts
type LetterState = 0 | 1 | 2 | 3;

interface LetterProgress {
  letter: string;                 // "A".."Z"
  state: LetterState;
  exposures: number;              // taps in Letter Garden, Family Book views
  correctByDay: Record<string, number>;   // "YYYY-MM-DD" -> count since last state change
  sessionMisses: number;          // reset each session
  lastStateChange: string;        // ISO date
}

interface NumberProgress {
  currentMax: 3 | 5 | 10;
  roundsAtMaxByDay: Record<string, number>;
}

interface MediaAsset {
  id: string;
  kind: "photo" | "audio";
  target: { type: "letter" | "number" | "goodnight" | "song"; key?: string };
  label?: string;                 // e.g. "Sebastian", "ball"
  blob: Blob;
  createdAt: string;
}

interface Settings {
  childName: string;
  familyNames: string[];
  sessionMinutes: 5 | 10 | 15 | 20;
  songIntervalMs: number;
}

interface Session {
  id: string;
  startedAt: string;
  endedAt?: string;
  activeMs: number;
  events: Array<{ at: string; type: string; item?: string; correct?: boolean }>;
}

interface Note { id: string; date: string; text: string; }
```

Stores in IndexedDB: `letters`, `numbers`, `media`, `settings`, `sessions`, `notes`.

## 7. Audio

- Playback priority for any clip: parent recording, then bundled default recording if present, then the browser's speech synthesis as a fallback.
- Mobile browsers typically require a user gesture before audio can play; unlock audio on the first tap after launch.
- Recording inside the app (for example with the MediaRecorder API) is a phase 5 feature. Browser support and permissions vary, so uploading a clip recorded elsewhere must always remain available.
- Keep clips short (under 5 seconds for letters and numbers).

## 8. Storage durability

- Request persistent storage on first launch where the browser supports it.
- Show the last export date in the parent area and a gentle reminder if it is older than 30 days.
- Clearing site data or uninstalling the web app will erase progress and media; state this plainly in the parent area.

## 9. Accessibility and motion

- Child tiles use color plus a large glyph; parent views always pair color with a text label.
- Contrast: text meets WCAG AA for its size.
- With `prefers-reduced-motion`, replace bounces and lifts with brief opacity or scale changes under 150 ms.

## 10. Acceptance checklist (whole app)

- [ ] Works in airplane mode after install.
- [ ] No network requests in the production build's network log after load.
- [ ] No child-side path leads to a settings screen without the parent gate.
- [ ] Goodnight appears at the time limit and persists across app restarts until unlocked.
- [ ] A wrong tap in Find It produces no negative sound or visual.
- [ ] Scheduler unit tests cover introduce, promote, demote, cap of 7, and one-new-letter-per-day.
- [ ] Export then import on a clean install restores progress and settings.
