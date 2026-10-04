# Stage I validation

Historical Stage I record. D is now approved Visual Direction V1; current ritual/session validation is in `STAGE2_VALIDATION.md`.

Date: 2026-10-04 (Asia/Yekaterinburg). Base Kadat commit: `2792d775abf4e13f2ac741886b8ef9dde1cdb135`.

| Check                                                                | Result        |
| -------------------------------------------------------------------- | ------------- |
| Existing tracked Kadat files changed                                 | 0             |
| New files confined to `tarot-prototype/`                             | PASS          |
| Full existing `npm test` suite                                       | PASS          |
| Existing `npm run format:check`                                      | PASS          |
| Prototype A/B/C DOM interaction tests                                | PASS          |
| Actual Chromium: 360 / 390 / 412 / 430 / 1280 px                     | PASS          |
| Home / cards / ritual / completed views, 75 size/concept/view checks | PASS          |
| Comparison page at all five widths                                   | PASS          |
| Horizontal document overflow                                         | 0             |
| Broken local image assets after load                                 | 0             |
| JavaScript browser errors                                            | 0             |
| Native About/archive dialogs, Escape and transition skip             | PASS          |
| Card II / III cannot reveal before their turn                        | PASS          |
| Interpretation area absent until all three reveal                    | PASS          |
| Reversed artwork rotates; HTML labels remain readable                | PASS          |
| Physical flip duration / reduced-motion duration                     | 820 ms / 0 ms |
| Keyboard Enter reveals the active card; continuation receives focus  | PASS          |
| Actual browser smoke test for four existing generator modes          | PASS          |
| Production Tarot data / new game rules / API / backend integrated    | No            |

The existing Kadat suite also checks catalog equality, 507 character baselines, regiment construction and supplies, xeno race/beast flow, armor construction, storage, XLSX and HTTP serving. No generator or rules changes were made.

These browser checks used Linux Chromium and viewport/touch emulation, not physical Android or iOS devices. Final appearance remains subject to the user’s manual phone review. No visual direction was selected as the winner.

The portable self-contained `imperial_tarot_stage1.html` was also checked using `file://` at 390 px: all three concepts and full rituals pass without external asset requests. The user explicitly authorized publishing only `tarot-prototype/` to `main` for GitHub Pages review on 2026-10-04. All pre-existing tracked files remain byte-identical to the base Kadat commit; production Tarot data are excluded.

## Additional Concept D — 2026-10-04

Base published prototype: `a1ce7a1268c05f84c7d852fa3205cf1f16363294`.

The user retained A/C, rejected B and requested D as an A + C hybrid. Active comparison and navigation now list A / C / D. B's original body, stylesheet and assets remain in the repository as history; it is absent from the active comparison. D's additions are isolated in `concept-d.css` and `assets/card-back-d.svg`. The shared routing renders the new concept using the existing three demo cards and existing reveal mechanics.

| Check                                                             | Result                     |
| ----------------------------------------------------------------- | -------------------------- |
| Changes outside `tarot-prototype/`                                | 0                          |
| Original `prototype.css` and all pre-existing image/font bytes    | Unchanged                  |
| A/C Home, cards and ritual HTML: 5 widths × 3 views × 2 concepts  | 30 unchanged               |
| A/C before/after screenshot comparison                            | PASS with raster tolerance |
| D and active comparison: 360 / 390 / 412 / 430 / 1280 px          | 40 checks, PASS            |
| Horizontal overflow / broken images / browser errors              | 0 / 0 / 0                  |
| D ritual displays one full-size card at a time, including desktop | PASS                       |
| Strict I → II → III; no interpretation before completion          | PASS                       |
| Reversed artwork rotated 180°; captions remain readable           | PASS                       |
| Normal flip / reduced motion                                      | 820 ms / 0 ms              |
| Keyboard reveal, continuation focus, Escape, entry skip           | PASS                       |
| A/C/D comparison and preserved legacy B DOM interaction tests     | PASS                       |
| Full existing Kadat tests and format check                        | PASS                       |
| Production Tarot data integrated / Stage II begun                 | No / No                    |

All 30 A/C main-content snapshots are identical. Their screenshot comparison produced 28 identical PNGs; two captures differ only at a few low-contrast raster pixels (maximum channel delta 16/255, maximum mean channel delta 0.0013). Those two were visually inspected and accepted using normalized channel tolerance 0.1; no A/C CSS, artwork, dimensions or main-content markup were changed. The comparison switcher necessarily replaces B with D.

D's mobile Home and ritual, open/reversed cards and desktop Home were visually inspected. Browser tests use Linux Chromium viewports; physical Android/iOS review remains the user's next step. No production data or final artwork assignments were accessed.
