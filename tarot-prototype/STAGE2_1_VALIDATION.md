# Imperial Tarot — Stage 2.1 validation

Date: **2026-10-04**. Result: **PASS — 18/18**. Scope: **`tarot-prototype/` only**.

Approved visual direction remains **D — Sacred Divinatio V1**. No new concept, production card/artwork integration, interpretation engine or Stage III.

## Patch checks

| #   | Check                                                           | Result | Evidence                                                                                                                                                                                                 |
| --- | --------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | User can type a question                                        | PASS   | Native textarea + submit form; actual browser input and continue/start at all six viewports. Theme-marker navigation no longer cancels form submission.                                                  |
| 02  | Typed question stored unchanged                                 | PASS   | `session.question` equals the field value; no trim or length cap. Exact Cyrillic question, spaces, leading newline, multiline/HTML-shaped text and >600 characters tested. Output is escaped plain text. |
| 03  | Question survives ritual navigation                             | PASS   | First reveal, next position, Home, reference C/D and resume retain the original string and session draws.                                                                                                |
| 04  | Question survives restored session                              | PASS   | Refresh preserves `session.question`, status, drawn cards, orientations and active position. Restore uses the session string rather than an empty draft and requests no entropy.                         |
| 05  | Empty question becomes QUESTION_UNSPOKEN                        | PASS   | Empty textarea produces `question: ""`, `question_status: "QUESTION_UNSPOKEN"`; UI and reload checked at every viewport.                                                                                 |
| 06  | Reset clears old question                                       | PASS   | Confirmation removes the session and draft; the next textarea is empty. Cancel/Escape preserves both question and draws.                                                                                 |
| 07  | Desktop opened positions show actual card thumbnails            | PASS   | Overview image source and `data-card-id` equal each opened session draw. Partial 10-card Rosette checked at 1366×768 and 1920×1080.                                                                      |
| 08  | Unopened positions show card backs                              | PASS   | All unopened positions use `assets/card-back-d.svg`; no future artwork/card ID exposed in map DOM.                                                                                                       |
| 09  | Current position remains identifiable                           | PASS   | `is-current`, `aria-current="step"`, thin gold border and crimson underline follow the active position before/after opening.                                                                             |
| 10  | Completed spread visually shows actual cards in their positions | PASS   | All image sources/IDs matched to draws in completed Branch, Throne, Rosette and other supported configurations. The completion screen retains the geometric visual map.                                  |
| 11  | Reversed Major thumbnail matches actual state                   | PASS   | Uses its stored Reversed asset and computed 180° matrix; position-number overlay has no transform. Active card agrees with the same draw.                                                                |
| 12  | Mobile active card remains large                                | PASS   | 310 px focused card at all four phone widths. Overview and question disclosure do not reduce it.                                                                                                         |
| 13  | Mobile layout has no new overflow                               | PASS   | 66 screen audits, including all six sizes; no unintended horizontal overflow or broken images. Overview targets ≥44 px with no overlaps/out-of-viewport controls.                                        |
| 14  | Astro-Horoscope is not presented as fixed 24 cards              | PASS   | SOURCE_FLEXIBLE, disabled entry, null count, empty positions; no 24-card label or fictional grid. Engine also rejects attempts to start this disabled spread.                                            |
| 15  | Four confirmed fixed spreads remain usable                      | PASS   | Imperator 3, Branch 6, Throne 7, Rosette 10; complete sequential lifecycle at every tested viewport.                                                                                                     |
| 16  | Generic 24-position stress fixture remains functional           | PASS   | LARGE_SPREAD_STRESS_TEST is separate from source spreads; full 24-step lifecycle, overview, completion/reset at all six sizes. Developer session uses a separate storage key.                            |
| 17  | Production dataset is still not integrated                      | PASS   | Same 28 demo identities and three original SVG illustrations; no production package/final Blanche files or meanings. All original assets byte-identical.                                                 |
| 18  | Existing four Kadat generators unchanged                        | PASS   | Zero changes outside prototype vs original Kadat base and patch parent; existing `npm test` passed, including four-mode workflows and 507 character baseline scenarios.                                  |

## Browser evidence

Actual Chromium interactions with Playwright, plus visual review of screenshots. This is a browser viewport test, not a claim of testing physical devices or every assistive technology.

| Viewport  | Fixed spreads  | Internal fixture | Question scenario                                         |
| --------- | -------------- | ---------------- | --------------------------------------------------------- |
| 360×800   | 3 / 6 / 7 / 10 | 24 positions     | Exact text, reveal/navigation, refresh, empty, reset PASS |
| 390×844   | 3 / 6 / 7 / 10 | 24 positions     | Exact text, reveal/navigation, refresh, empty, reset PASS |
| 412×915   | 3 / 6 / 7 / 10 | 24 positions     | Exact text, reveal/navigation, refresh, empty, reset PASS |
| 430×932   | 3 / 6 / 7 / 10 | 24 positions     | Exact text, reveal/navigation, refresh, empty, reset PASS |
| 1366×768  | 3 / 6 / 7 / 10 | 24 positions     | Side QUAESTIO, restored exact text, empty/reset PASS      |
| 1920×1080 | 3 / 6 / 7 / 10 | 24 positions     | Side QUAESTIO, restored exact text, empty/reset PASS      |

**30 full lifecycles; 66 screen audits; 96 overview geometry/state audits; zero browser errors.** The exact mobile scenario used `Что ожидает экспедицию?`. Every opened thumbnail was checked against its own draw; normal/reversed states and position labels were checked via computed styles. Completed 6/7/10-card desktop maps were visually reviewed. Phone QUAESTIO is collapsed by default and readable when expanded.

36 comparisons of A/C home/card/ritual markup, styles and geometry match the pre-patch build. Twelve original styles/assets (two base stylesheets and ten asset files) remain byte-identical. Focused-card widths remain 310 px on phones, 280 px at 1366×768 and 350 px at 1920×1080.

## Session compatibility and source correction

- Existing v1 demo-session storage key is retained. Missing historical `question_status` is derived from the saved string; a stale draft cannot replace a nonempty session question.
- Legacy `astro_horoscope` sessions with 24 draws are explicitly migrated to **LARGE_SPREAD_STRESS_TEST** without changing question, cards, states or progress. The UI identifies them as an internal technical test. Reset returns the ordinary selector to the four supported fixed spreads. A new canonical 24-card Astro session cannot be started.
- An old preparation screen selecting Astro is returned to the spread selector with its question draft preserved and an explanation that this spread is flexible/unavailable.
- The previous fixed-count Astro claim is withdrawn. The source permits multiple shapes and supplies no unified card count/fixed geometry. This correction follows the user's source clarification; no new research, downloads or invented position meanings.
- Developer fixture route: `?concept=d&fixture=large-spread`. It is absent from the normal spread selector and uses its own storage key, tested not to erase the ordinary session.

## Preserved mechanics

Without-replacement draw; strict reveal sequence; no individual reroll; independent exact 50/50 Major coin; immutable card/orientation/art state; separate Major images and additional Reversed 180° rotation; upright UI labels; Minor single state without orientation or reversed fields; confirmation before reset; local session persistence; interpretation unavailable until completion and still a placeholder only.

Normal flip remains **0.82 s**, reduced-motion transition **0 s**. Keyboard Enter reveal, focus on continue, native disclosures/dialogs and Escape were exercised. Semantic submit also reads the current field when input events are absent (autofill/IME regression test).

## Technical checks

- `node tarot-prototype/tests/stage2.test.cjs` — PASS: exact question/submit/restore/reset, legacy migration, actual map images/states, all four fixed flows and internal 24, RNG/immutability/sequence guards.
- `node tarot-prototype/tests/prototype.test.cjs` — PASS: A/C/B historical flows and comparison routes.
- `npm test` — PASS: existing Kadat regressions, data/storage/import/export and HTTP assets.
- `npm run check` and Prettier checks — PASS.
- Git diff outside `tarot-prototype/` vs Stage II parent and original Kadat base — empty.

Static local relative assets/scripts preserve GitHub Pages compatibility. No new dependencies, network/AI services, source images, production artwork or final dataset. If sessionStorage is unavailable, the existing explicit memory-only fallback still applies; refresh cannot recover unsaved storage. Text already lost by the former build cannot be reconstructed.
