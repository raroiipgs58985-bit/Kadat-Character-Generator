# Stage I validation

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
