# The enchanted Midnight Study Room

## Direction confirmed October 29, 2026

Lía wants an interactive, explorable room with functional objects. She selected a tiny companion, window worlds, connected rooms, and secret discoveries, and then approved the full proposed set of room tools. She explicitly allowed layout changes while preserving the existing midnight-blue, lavender, warm-paper and soft-gold atmosphere. This work starts from the original `main` room, independently of the earlier submission-tracking draft PR.

## Implemented

- Original animated vector companion with cat, owl, and ghost appearances, naming, petting, gentle idle movement, and sleep during focus. The companion starts the original focus timer, opens review cards for explaining aloud, or accompanies a visit to the balcony. No care penalties or expiring streaks.
- Four illustrated animated window worlds: enchanted forest, moonlit sea, rainy city, snowy village. User-controlled synthesized rain, wind, and wave textures; separate levels and master volume, off on every reload. Still mode and reduced-motion support.
- Navigable balcony with a persistent wall-clock break countdown, short movement prompts, and saved reflections. Break countdown completion never forces navigation.
- Discoverable brass key opens a greenhouse. Topic plants grow from actual focus sessions completed after this update, filtered by course or across all subjects. Plants never decay; they show topic notes and a study action.
- Four original field-journal discoveries, earned from exploration or completed focus sessions: key, moth, shell, star. A visible moth visits the lamp after the first completed focus block. No secrets expire.
- Six course books with autosaved plain-text notes, a resume bookmark, plain-text/Markdown import into an empty book, and manually authored question/answer cards. Review answers stay hidden until revealed; the companion does not invent or grade content.
- Floating SVG chalkboard with pointer drawing, typed labels, undo, local saving, and a self-contained SVG download. One shared board, not separate per-course boards.
- Loose-thought drawer with saved timestamps and reviewed checkboxes.
- Observatory with user-created process/concept constellations: 2–8 named stars connect in order, saved in a library.
- New data is local to the browser, stored separately from the original room key. Original Backup & restore now includes this extension. Restore adds missing records and discoveries; it does not overwrite existing notes or records. No accounts, network integrations, backend sync, or remote academic data added.

## Running and building

`python _source/build.py _source/room.dc.html .` rebuilds the production page and cache version. It includes `room-worlds-core.js`, `enchanted-room.js`, and `enchanted-room.css` in the offline app shell. The source builder can use root-level bundled fonts/icons when duplicate `_source` asset directories are absent.

`node --test tests/enchanted-room.test.cjs` runs the regression tests.

## Verified

Seven automated checks cover schema migration, unique world visits, deduplicated focus sessions and course minutes, additive backup merge, persisted companion/break/reflection data, the original timer bridge, and full-room backup integration preserving existing tasks.

Browser QA on an isolated local preview verified: all window worlds; generated-audio start/stop controls; hidden-key discovery and greenhouse access; creating a topic plant; a real one-minute focus session started by the companion and its moth discovery; course notes/bookmarks and persistence through refresh; adding a review card and revealing its saved answer; chalkboard drawing and typed text; a saved thought; balcony break countdown and reflection; a five-star/four-connection constellation; and navigation among the rooms. Code and generated files contain no QA sample records.

## Limits

No PDF annotation or durable PDF import, microphone recording, AI tutoring, multiplayer, real-world weather feed, account sync, or grades integration is included. The spoken-explanation action is a practice prompt with saved review cards. Course content must be supplied by the user. Historical study time predating this update is not credited to plants. Existing Google Sheets task synchronization remains unchanged and does not carry the new room tools. Desktop browser layout was tested; installed Windows and mobile/offline behavior require device-specific verification.

## QA pass, October 29, 2026 (branch `claude/room-qa-fixes`)

Found in a browser review of the live build and fixed here:

- The window worlds were an overlay on top of the room, so they covered the sill plant (it could still be clicked, but only its pot showed) and stayed bright when the lamp was dimmed. They are now painted inside the room's own window (`#ew-window-slot` in `_source/room.dc.html`), under the mullions and the plant, and dim with the lamp. Still mode and reduced motion reach them there too.
- The world label sat on the windowsill and over the top of the timer panel. It is now a short label inside the bottom of the window.
- The companion's name ("Moth") overlapped "Chalkboard" in the dock, and the companion sat on top of the dock. The companion now rests in the space under the desk; the dock is centred.
- The lamplight moth appeared over the notebook page (nowhere near the lamp) as a tiny text glyph that was hard to see. It is now a small drawn moth beside the lamp shade.
- The Beyond door covered the right end of the desk. It is narrower and sits in the wall strip.
- Toasts covered the dock. They now appear at the top.
- Chalkboard: at laptop heights the board pushed its own buttons below the fold. The board now fits with its controls.
- Room-picker buttons ran their two lines together ("The moonlit balcony Breaks & reflections"). They now break onto two lines.
- Companion appearance and course-book page buttons now show which one is selected.
- Re-drawing a dialog (next card, choosing a world) lost the place to return focus to, so closing it dropped keyboard focus. Focus now stays on the same button and returns to the room object that opened the dialog.
- Observatory: the sea scene's moon and horizon cut through the star map, and the companion sat inside it. It now has its own night dome with scattered stars, and the companion sits beside the map. In the greenhouse and observatory the companion sits in the corner.
- The first plant growth stage (50 minutes) now adds a visible leaf.
- Phones held upright: the 16:10 room was scaled to about a quarter size (unreadable). On narrow portrait screens it now keeps a readable size and scrolls sideways, starting at the desk.

Follow-up in the same branch:

- Phones held upright: a room dialog or drawer that opens off to the side now scrolls into view.
- The cat's eyes are open while it's awake, so it visibly closes them to rest during a focus block.
- The greenhouse shelf boxes are lighter.

Review follow-up (Codex findings):

- Course books: changing the course with the keyboard re-draws the dialog, and focus used to jump to the Close button because only buttons were matched. Focus now returns to the same control by its label (form fields) or text (buttons). The review card and its Reveal/Show toggle keep focus through a flip via a stable `data-focus-key`. Closing still returns focus to the room control that opened the dialog. Covered by a keyboard-only browser check.
- What opening the app writes (unchanged behaviour, documented): when the enchanted data has no recorded window visit (a new browser, cleared site data, or the first open after upgrading from the pre-enchanted room), `boot()` records the current world as visited and saves `midnight-study-room.enchanted.v1` once. Like every enchanted save, it stores the normalised object (`RoomWorldsCore.norm`), so unknown or invalid fields in that key are dropped. Once a visit is recorded, opening the app writes neither key; the only write is the room's storage-availability probe (`__msr_probe`), which is removed immediately. The room's own `midnight-study-room.v1` is written only when its state differs from what is saved. This matches `main` exactly.

Checks run for this pass:

- `node --test tests/enchanted-room.test.cjs`: 7 of 7 pass.
- `node tests/room-layout.browser.cjs http://localhost:8731/` (needs Playwright and a local server, see the file header): 17 browser checks, including overlap checks, lamp dimming, focus return, the companion focus block and moth, persistence after refresh, and Settings › Backup restore into a fresh browser.
