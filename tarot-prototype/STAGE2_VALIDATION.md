# Imperial Tarot — Stage II validation

Date: 2026-10-04. Result: **PASS — 40/40**. Scope: `tarot-prototype/` only.

Visual Direction V1: **D — Sacred Divinatio**. Stage I parent: `32d9d48eddf31ab537ad9959d432aa2cfdeec7b0`. Production Kadat base: `2792d775abf4e13f2ac741886b8ef9dde1cdb135`.

| #   | Check                                          | Result | Evidence                                                                                                                                                                  |
| --- | ---------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | Concept D preserved as Visual Direction V1     | PASS   | Same D palette, type, back, thin frame and manuscript caption; existing D CSS unchanged.                                                                                  |
| 02  | No new visual concept created                  | PASS   | D is active; A/C remain references and B remains archived.                                                                                                                |
| 03  | 3-card UX supported                            | PASS   | Imperator; full lifecycle at all six viewport sizes.                                                                                                                      |
| 04  | 6-card UX supported                            | PASS   | Branch; full lifecycle at all six sizes.                                                                                                                                  |
| 05  | 7-card UX supported                            | PASS   | Throne of Terra; full lifecycle at all six sizes.                                                                                                                         |
| 06  | 10-card UX supported                           | PASS   | Haloed Rosette; full lifecycle at all six sizes.                                                                                                                          |
| 07  | 24-card UX supported                           | PASS   | Astro-Horoscope; full 24-step lifecycle at all six sizes. Position functions remain SOURCE_INCOMPLETE.                                                                    |
| 08  | Sequential reveal enforced                     | PASS   | Session reducer accepts reveal only at opened_count and active index.                                                                                                     |
| 09  | Future positions cannot be opened              | PASS   | Disabled map controls plus engine guards; synthetic future clicks tested.                                                                                                 |
| 10  | Individual reroll impossible                   | PASS   | No reroll action; duplicate reveal is a no-op.                                                                                                                            |
| 11  | Cards selected without replacement             | PASS   | Partial Fisher–Yates with unbiased integer sampling; unique card IDs in all sessions. SVG reuse is not card reuse.                                                        |
| 12  | Major orientation exactly 50/50                | PASS   | Independent uniform uint32 modulo 2; each half contains 2^31 outcomes. No weights or quotas. Both boundary bits tested.                                                   |
| 13  | Orientation generated once and immutable       | PASS   | Deep-frozen draws; progress updates retain original draws; restore performs no RNG call.                                                                                  |
| 14  | Upright Major uses Upright artwork state       | PASS   | Draw image equals card.upright.image; DOM src checked.                                                                                                                    |
| 15  | Reversed Major uses Reversed artwork state     | PASS   | Draw image equals card.reversed.image; states use different existing SVGs.                                                                                                |
| 16  | Reversed Major artwork also rotates 180°       | PASS   | Browser computed transform matrix(-1, 0, 0, -1, 0, 0).                                                                                                                    |
| 17  | Reversed UI labels readable                    | PASS   | Labels remain outside rotated image; numeral/labels unrotated in browser.                                                                                                 |
| 18  | Minor orientation not randomized               | PASS   | RNG called only for Major; deterministic 24-card test: 24 identity draws + 6 Major coins, no Minor coins.                                                                 |
| 19  | Minor artificial reversed state absent         | PASS   | No orientation field on Minor draws; malformed Minor orientation rejected on restore.                                                                                     |
| 20  | Minor artificial reversed artwork absent       | PASS   | Minor data has a single image and no reversed field.                                                                                                                      |
| 21  | Minor artificial reversed meaning absent       | PASS   | Demo data contains no meanings of any kind.                                                                                                                               |
| 22  | Interpretation hidden until all cards complete | PASS   | No meaning data; interpretation view additionally requires explicit finished state. Closed cards have no card face/name in DOM.                                           |
| 23  | Last card enables ritual completion            | PASS   | Finish button appears only after all positions open; next button absent.                                                                                                  |
| 24  | Interpretation remains placeholder only        | PASS   | Explicit post-completion action opens Stage III notice; no predictions/keywords.                                                                                          |
| 25  | Reset confirmation works                       | PASS   | Escape/cancel preserves session; confirm deletes it; new cards drawn only after new-start confirmation. Tested incomplete and completed sessions.                         |
| 26  | Session state remains stable                   | PASS   | Reload, Home, reference A/C navigation, overview and interrupted flip retain draws/orientations/progress.                                                                 |
| 27  | 360 px tested                                  | PASS   | 360×800, all five spreads.                                                                                                                                                |
| 28  | 390 px tested                                  | PASS   | 390×844, all five spreads.                                                                                                                                                |
| 29  | 412 px tested                                  | PASS   | 412×915, all five spreads.                                                                                                                                                |
| 30  | 430 px tested                                  | PASS   | 430×932, all five spreads.                                                                                                                                                |
| 31  | 1366×768 tested                                | PASS   | All five spreads, desktop map and focused card.                                                                                                                           |
| 32  | 1920×1080 tested                               | PASS   | All five spreads, desktop composition.                                                                                                                                    |
| 33  | 24-card mobile stress test passed              | PASS   | One 310 px focused card, modal map, full sequential reveal, revisit, reload and reset at each phone size. No overflow.                                                    |
| 34  | prefers-reduced-motion supported               | PASS   | Normal transition 0.82s; reduced transition 0s; both actual reveal paths tested.                                                                                          |
| 35  | Keyboard/accessibility basics preserved        | PASS   | Semantic buttons, focus-visible, native dialogs/Escape, 44 px map targets, Enter reveal and focus on continue; descriptive labels.                                        |
| 36  | Existing four Kadat generators unchanged       | PASS   | Zero tracked changes outside prototype vs original Kadat base; full existing npm test passed, including 507 character baseline scenarios and four-mode workflows/storage. |
| 37  | Production Tarot dataset not integrated        | PASS   | Runtime uses only stage2-data.js: 28 demo card identities, no 78-card import or final assignments.                                                                        |
| 38  | Final Blanche library not integrated           | PASS   | Same three demo SVGs; all existing 10 asset files unchanged; no images added/downloaded for runtime.                                                                      |
| 39  | No runtime AI/API                              | PASS   | Static local scripts/assets; no fetch, API, backend or interpretation service.                                                                                            |
| 40  | GitHub Pages compatibility preserved           | PASS   | Relative local URLs; no build/configuration/dependency changes; published only prototype files.                                                                           |

## Source discipline

The provided **The Emperor's Tarot v1.30** was checked directly as text and rendered diagrams (PDF pages 20–22; 24-card count on page 7). Four defined schemes follow those diagrams rather than general Tarot conventions.

- Imperator: three cards, left-to-right, past / present-problem / suggested solution or outcome.
- Branch: functions of III–IV and V–VI are described jointly; no invented separate function for either member of a pair.
- Throne: inverted V with I–VII ordered as shown.
- Haloed Rosette: VII–X above the cross; VI above the centre, III below, IV left and V right as shown. I–II share the centre; hit areas are slightly separated for accessibility.
- Astro-Horoscope: page 7 confirms 24 cards; page 21 explicitly permits rows/columns and other patterns, but does not supply position functions or a fixed canonical order. The prototype uses a permitted 4×6 overview. All function labels remain null and SOURCE_INCOMPLETE is visible in selection, confirmation and overview. Numbers are UX reveal indices, not invented interpretation rules.

The former package's spread metadata was read only for comparison. No production card dataset, final artwork assignment or final artwork file was imported. The source PDF/ZIP themselves are not part of this deployment.

## Test evidence

- `node tarot-prototype/tests/stage2.test.cjs`: PASS. Pure engine checks, rejection-sampling edge case, independent Major bit mapping, freeze/no-reroll guards, 200 sampled sessions, corrupt restore rejection, all five DOM flows, escaped optional question, 24-step progression and restoration with RNG disabled.
- `node tarot-prototype/tests/prototype.test.cjs`: PASS. Historical A/C/B flow and active comparison routes.
- `npm test`: PASS. Existing Kadat regression suite, including source catalogs, Persona/Regimentum/Xenos/Armatura, saving/import/export/reset and HTTP assets.
- Prettier checks for changed prototype files and existing repository: PASS.
- Actual Chromium viewport matrix: **30 complete lifecycles**, **155 screen audits**, **24 map geometry/sequence audits**, zero broken images, zero unintended horizontal overflow and zero browser errors. 36 reference comparisons preserve A/C main markup, styles and geometry. Existing CSS/SVG/font files are byte-identical (12 preserved files: two stylesheets plus ten assets).
- Focused ritual card widths: 310 px on the four phone widths; 280 px at 1366×768 and 350 px at 1920×1080. Mobile chrome is reduced only during the ritual to leave room for artwork and readable captions. Home retains the approved D composition.

## Limits of this stage

This is a UX prototype with 28 demo identities and three reused SVGs, not the production deck or an artistic assignment. It does not implement interpretation, advanced Archive Arcana, production integration or Stage III. If sessionStorage is unavailable, navigation is stable in memory but reload cannot retain the session; Home states this limitation.

Automated tests verify keyboard basics and geometry, supplemented by visual review. They are not a claim of a full assistive-technology audit across every browser/device.
