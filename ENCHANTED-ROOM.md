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
