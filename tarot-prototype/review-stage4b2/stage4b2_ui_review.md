# Imperial Tarot — Stage 4B-2 UI review

**STATUS: PASS.** Branch: `prototype/imperial-tarot-stage4b2`.

Baseline: `28de1159097b7814e6733dfead7c3e08bf69ba09`.

Checkpoint commit: the single Stage 4B-2 commit on this branch, containing this report; its parent is the baseline above. Resolve its exact SHA with `git log -1 --format=%H -- tarot-prototype/review-stage4b2/stage4b2_ui_review.md`. The delivery report also includes the full SHA. This avoids an impossible self-referential commit hash inside its own file.

The final reveal exposes `+++ РАСКЛАД ЗАВЕРШЁН +++` and `+++ ТОЛКОВАНИЕ ДОПУЩЕНО +++`. One action, «Запросить толкование», completes the session and opens its accepted reading. Nothing is interpreted during reveal. The primary screen preserves `prophecy.paragraphs` exactly, displays the optional question, and places structured sign details in a collapsed native disclosure. New reading resets the whole session through the existing confirmation.

Sacred Divinatio keeps its near-black background, bone text, tarnished gold and restrained burgundy rules. The primary prose uses the full available phone width and a constrained desktop column. Production artwork is reused; reversed Major images remain upright with a textual state in their details.

## Representative flows

| Flow | Result | Review reference |
| --- | --- | --- |
| Imperator, question, complete sequential reveal | PASS | [Desktop prophecy](screenshots/imperator-desktop.png) |
| Imperator, reversed Major, no question, reload | PASS | [Reversed artwork](screenshots/imperator-reversed-desktop.png); [414 px phone](screenshots/imperator-mobile-414.png) |
| Branch, shared forces/options and two unselected directions | PASS | [Branch prophecy](screenshots/branch-desktop.png) |
| Throne of Terra, advice and conditional outcome | PASS | [Throne prophecy](screenshots/throne-desktop.png) |
| Haloed Rosette, ten signs and positive card in Challenge | PASS | [Rosette prophecy](screenshots/rosette-desktop.png) |
| Astro-Horoscope, deferred result and 24 revealed cards | PASS | [Desktop limited result](screenshots/astro-deferred-desktop.png); [320 px phone](screenshots/astro-deferred-mobile-320.png) |

Expanded disclosure: [desktop](screenshots/rosette-details-desktop.png), [320 px phone](screenshots/rosette-details-mobile-320.png). All ten screenshots were captured once and visually inspected. Rosette's long question deliberately tests line breaks, literal angle brackets and a long unbroken word.

The captured UI evidence in [stage4b2_validation.json](stage4b2_validation.json) also contains the complete visible paragraphs and sign rows, including content below the screenshot viewport. Branch details retain groups `[3, 4]` and `[5, 6]`, with «Первое направление» and «Второе направление» and neither selected. Throne's final label is «Исход при следовании совету». Rosette's second card remains «Ближайшее испытание»; its seventh sign has the engine-backed note «Этот знак сопоставляется с настоящим».

## Astro presentation boundary

Stage 3's production Astro record was disabled and had no fixed count. `interpretation-ui.js` projects the already accepted Stage 4A record of 24 cards into the session interface, enabling only its deferred review. Original spread files are unchanged. The existing session adapter validates the completed session against this presentation projection.

There is no invented spatial map, zodiac house, individual role or interpretation order. The gallery is explicitly the order of card revelation. Engine output remains `deferred_complex_reading`, with no prophecy, role or sign framing. The limited-result explanation is UI text, not a source quotation. No local model is implemented.

## Bounded validation

**6/6 flows; 28/28 checks PASS.** One actual browser integration pass; no previous stage suite, source extraction, literary review or screenshot regeneration. Viewports: 320×860, 414×860/896, 1366×1000. Phone dialogs remain within the viewport and scroll when needed. No horizontal overflow, clipped headings/questions/states, resource errors or console errors were observed. Details thumbnails are 78×112 px on phones and 96×136 px on desktop. Reduced motion disables the new transitions and smooth scrolling. The question is display-only; a reload preserves the same complete engine output.

The first server-start attempt could not reach the page: zero ritual starts and zero interpretation calls. Its diagnostic record is [stage4b2_server_start_failure.json](stage4b2_server_start_failure.json); the test runner now owns its local server.

The actual integration pass initially reported 27/28 because the focus assertion measured programmatic focus while still in pointer mode, before the keyboard event. Only the assertion's observation order was corrected. [stage4b2_focus_recheck.json](stage4b2_focus_recheck.json) records the targeted Enter/Space disclosure check with a visible focus outline, using the cached accepted reading and **zero additional interpretation calls**. The other 27 checks and six flows were not rerun. The initial observations remain in the validation record for traceability. No product change was needed after the pass.

## Files changed

- `tarot-prototype/index.html`: static engine, adapter, bridge and presentation stylesheet wiring.
- `tarot-prototype/stage2.js`: final transition, interpretation screen, optional structured signs, deferred Astro review and existing reset/navigation integration.
- `tarot-prototype/interpretation-ui.js`: read-only adapter bridge and accepted Astro session projection; completed-reading cache.
- `tarot-prototype/interpretation-ui.css`: scoped Sacred Divinatio reading/detail styles, phone layout and focus/reduced-motion rules.
- `tarot-prototype/tests/stage4b2-ui.cjs`: guarded six-flow integration pass.
- `tarot-prototype/tests/stage4b2-focus-recheck.cjs`: guarded, cached-output assertion recheck.
- `tarot-prototype/review-stage4b2/`: this review, three JSON records and ten screenshots.

The accepted engine, session adapter, frozen Data V1.0.0 bundle/files, production card IDs/spread files/artwork assignments and the four Kadat generators are unchanged. No dependency was added to the application, no AI/API/NLP/backend was introduced, and interpretation uses local static files only.

Known unresolved issues: **none found in this integration scope**. Astro's intentionally deferred interpretation is an accepted limitation. Main remains unchanged; no merge, deployment or GitHub Pages publication. Stop after the checkpoint branch push; manual review comes next.
