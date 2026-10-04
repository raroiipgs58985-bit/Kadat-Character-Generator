# Imperial Tarot — Stage 3 production integration validation

Date: **2026-10-04**. Result: **PASS — 38/38**. Scope: **`tarot-prototype/` only**. Visual direction: **D — Sacred Divinatio V1**. This stage integrates the supplied final data/artworks into the existing ritual; interpretation remains a placeholder.

## Frozen content counts

| Measure                                        |              Result |
| ---------------------------------------------- | ------------------: |
| Cards / Major / Minor                          |        78 / 22 / 56 |
| Major artwork assignments                      |                  44 |
| Minor artwork assignments                      |                  56 |
| Total artwork assignments                      |                 100 |
| Unique artwork IDs / underlying identities     |             99 / 99 |
| Physical artwork files                         | 99: 96 JPEG + 3 PNG |
| Missing files / unresolved duplicate conflicts |               0 / 0 |
| Authorized intentional artwork reuse           |        1: JB-LX-073 |
| Missing required Russian meanings              |                   0 |
| Documented nonblocking source/metadata records |                   8 |

`major_16 / The Hulk / Upright = JB-LX-073` and `mandatio_07 / The Speaker = JB-LX-073`. Both use the same unchanged physical file. No artistic assignment was replaced.

## Checks

| #   | Check                                               | Result | Evidence                                                                                                                                                                |
| --- | --------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | Existing D visual direction preserved               | PASS   | All three stylesheets, card backs, old SVG/font assets unchanged; no new concept or redesign.                                                                           |
| 02  | Exactly 78 canonical cards                          | PASS   | Unique `card_id`/`id`, 22 Major and 56 Minor in JSON and runtime adapter.                                                                                               |
| 03  | Four canonical Minor suits and source rank order    | PASS   | Adeptio / Discordia / Excuteria / Mandatio, 14 cards each; final package IDs/order/names retained.                                                                      |
| 04  | 44 Major artwork assignments                        | PASS   | Every Major has separate upright/reversed mappings, matched to supplied final JSON and CSV.                                                                             |
| 05  | 56 Minor primary assignments only                   | PASS   | One artwork per Minor; no artificial reversed fields.                                                                                                                   |
| 06  | 100 final assignments preserved exactly             | PASS   | Independent frozen mapping fingerprint plus per-card/state checks against provided package JSON/CSV.                                                                    |
| 07  | 99 physical artworks and identities                 | PASS   | 99 files, 99 artwork IDs, 99 underlying identity IDs in physical manifest.                                                                                              |
| 08  | The Hulk Upright remains JB-LX-073                  | PASS   | Explicit assertion for `major_16.upright`; actual file `major_16_upright.jpg`.                                                                                          |
| 09  | The Speaker remains JB-LX-073                       | PASS   | Explicit assertion for `mandatio_07`; same artwork, identity and physical path as Hulk Upright.                                                                         |
| 10  | Intentional reuse is permitted, not blocking        | PASS   | Single manifest record with two assignments; no forced uniqueness of artworks.                                                                                          |
| 11  | All referenced physical files exist                 | PASS   | 100 references resolve to 99 readable assets; every file hash checked.                                                                                                  |
| 12  | Original source images unchanged                    | PASS   | SHA-256 equality for all 99 against final ZIP; no crop/re-encode/upscale/fill or generated art.                                                                         |
| 13  | English card names/source fields/meanings available | PASS   | Source strings copied from final package and checked against supplied PDF; documented source discrepancies preserved.                                                   |
| 14  | Russian meanings use supplied XLSX                  | PASS   | All 44 Major states and 56 Minor meanings match original sheet cells; verbatim strings retained. No new translation.                                                    |
| 15  | Missing localization not invented                   | PASS   | Required meaning omissions: zero. Missing optional RU source-image descriptions: 64 explicit nulls.                                                                     |
| 16  | Major variations separate from meanings             | PASS   | Existing EN/RU variation fields remain separate; not concatenated into meaning strings.                                                                                 |
| 17  | Four fixed source spreads preserved                 | PASS   | Imperator 3, Branch 6, Throne 7, Rosette 10 retain approved Stage 2.1 geometry and short labels.                                                                        |
| 18  | Position functions source-grounded EN/RU            | PASS   | PDF pp. 20–22 functions and verbatim Russian sheet/cell values; Branch paired functions kept shared.                                                                    |
| 19  | Astro-Horoscope remains flexible/disabled           | PASS   | Null count, empty positions, `SOURCE_FLEXIBLE`, no canonical 24-card label/grid; engine rejects launch.                                                                 |
| 20  | Internal 24-position fixture remains functional     | PASS   | Separate route/storage; all six viewport lifecycles and 200 simulated sessions completed. No source functions invented.                                                 |
| 21  | Draw without replacement uses card identity         | PASS   | Unique card IDs in 1,000 simulations; deliberate shared artwork can occur on two distinct cards.                                                                        |
| 22  | Major orientation probability exactly 50/50         | PASS   | Independent uniform `randomBelow(2)` using unbiased uint32 parity; exactly 2³¹ outcomes per state. Boundary/residue tests passed.                                       |
| 23  | Orientation generated once and immutable            | PASS   | Frozen draws reused by progress updates and restore; navigation/restore tested with entropy disabled.                                                                   |
| 24  | Major uses its correct artwork state                | PASS   | All 44 mappings verified; each draw’s image/artwork/identity matches its assigned state.                                                                                |
| 25  | Reversed Major also rotates artwork 180°            | PASS   | Active card and overview computed CSS matrices checked; UI labels/numbers stay unrotated.                                                                               |
| 26  | Minor remains single-state                          | PASS   | No orientation coin/property, reversed image/state/meaning or CSS rotation; browser Minor reveal checked.                                                               |
| 27  | Sequential reveal and no individual reroll          | PASS   | Future positions disabled; engine rejects skip/reopen/reroll; next requires explicit action.                                                                            |
| 28  | Meanings remain hidden throughout ritual            | PASS   | Source meaning strings do not enter active-card, map or completed-spread DOM; no keyword/interpretation display.                                                        |
| 29  | Completion and interpretation placeholder preserved | PASS   | Last card enables finish; separate finish then interpretation action; no interpretation engine, AI text or forecast.                                                    |
| 30  | Question input remains exact and optional           | PASS   | Cyrillic question, whitespace, multiline/HTML-shaped text and >600 characters; empty question becomes QUESTION_UNSPOKEN.                                                |
| 31  | Production session persists and reset confirms      | PASS   | Home/A/C/overview/refresh retain question/draws/orientations/progress; Escape cancels reset; confirmation clears session/draft.                                         |
| 32  | Stale demo sessions safely invalidated              | PASS   | Session version 2 + production data version; old draw set rejected without RNG/remapping, question kept as draft and notice shown.                                      |
| 33  | Actual overview thumbnails and completed layouts    | PASS   | Every opened src/card ID/reversed state matched to its stored draw; closed slots remain backs; complete maps contain all drawn cards.                                   |
| 34  | Mobile 360 / 390 / 412 / 430 tested                 | PASS   | All four fixed spreads + internal24 at each width; active card 310 px, collapsible QUAESTIO, no horizontal overflow/broken assets.                                      |
| 35  | Desktop 1366×768 / 1920×1080 tested                 | PASS   | All four fixed spreads + internal24; active widths 280/350 px; partial/full Rosette, Branch and Throne visual review.                                                   |
| 36  | Accessibility and reduced motion preserved          | PASS   | Keyboard Enter reveal, focus on continue, semantic forms/dialogs/disclosures, Escape, map targets ≥44 px; 0.82 s flip / reduced 0 s.                                    |
| 37  | Artwork loading remains limited                     | PASS   | Home: zero artwork requests. Focused/next preload only; lazy opened thumbnails. Initial ritual audits saw 1–3 unique requests, never all 99.                            |
| 38  | Prototype isolation / static Pages compatibility    | PASS   | Zero changes outside tarot-prototype vs patch parent/original Kadat; existing regressions pass; no new dependency/backend/API/runtime AI or main-app Tarot integration. |

## Test evidence

- `node tarot-prototype/tests/stage3.test.cjs` — PASS. **1,000 sessions / 10,000 draws**, 200 sessions per fixed spread and internal fixture. One observed run: **1,428 Upright / 1,368 Reversed / 7,204 Minor**. This sample is a sanity check, not proof that a finite run must produce equal counts; the 1:1 probability follows from the unbiased bit algorithm.
- Production tests check frozen package mapping/file fingerprints, 100 lookup states, 99 file hashes, source fields, exact reuse, `getMeaning`/`getReadingContext`, without-replacement identity selection, immutable progression/restore, incompatible-data rejection, native question flow and interrupted flips.
- `node tarot-prototype/tests/stage2.test.cjs` — PASS. Historical demo regressions remain executable without loading demo content on the public page.
- `node tarot-prototype/tests/prototype.test.cjs` — PASS. Reference concepts retain their historical flows.
- `npm test` / `npm run check` — PASS. Existing four Kadat generators, storage/import/export, rules and 507 character baseline scenarios remain valid.
- Prettier checks on changed code/data/docs and existing repository format check — PASS.

Actual Chromium viewport interactions and screenshot review: **30 full lifecycles; 66 screen audits; 96 overview geometry/state audits; 36 before/after A/C reference comparisons; zero browser errors.** No map overlap, undersized touch targets, unintended horizontal overflow or broken images. This is browser viewport testing, not a claim of physical-device testing or comprehensive screen-reader certification.

| Viewport  | Four fixed spreads | Internal 24 | Exact question / navigation / refresh / empty / reset |
| --------- | ------------------ | ----------- | ----------------------------------------------------- |
| 360×800   | 3 / 6 / 7 / 10     | PASS        | PASS                                                  |
| 390×844   | 3 / 6 / 7 / 10     | PASS        | PASS                                                  |
| 412×915   | 3 / 6 / 7 / 10     | PASS        | PASS                                                  |
| 430×932   | 3 / 6 / 7 / 10     | PASS        | PASS                                                  |
| 1366×768  | 3 / 6 / 7 / 10     | PASS        | PASS                                                  |
| 1920×1080 | 3 / 6 / 7 / 10     | PASS        | PASS                                                  |

## Sources and package integrity

Source package SHA-256: `5d3bd931d33cc0dc9d677089f7138226ad9a7c8cc1a0ac8b850fc7118ba4c74f`. Runtime data version: `blanche-final-v1-5d3bd931d33c`. Total original image bytes: **25,566,854**. No new images or external versions downloaded. Ten stale dimension records are corrected only in metadata with the old values preserved.

See [STAGE3_SOURCE_CONFLICTS.md](STAGE3_SOURCE_CONFLICTS.md) for all eight nonblocking records, including the superseded ZIP blocking note and the accepted flexible Astro policy. Automated curation is disabled; source meaning/localization disagreements remain explicit.

Stage 3 stops at production-content integration into the isolated prototype. No full interpretation, production main-app integration, new visual direction or further stage implemented.
