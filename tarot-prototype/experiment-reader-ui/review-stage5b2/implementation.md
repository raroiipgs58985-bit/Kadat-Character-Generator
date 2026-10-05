# Imperial Tarot — Stage 5B-2 checkpoint review

Branch: `experiment/imperial-tarot-reader-ui`

Baseline: `528eadc23eabde856376957b351d9c980519c5af`.
Checkpoint: delivered HEAD on this branch; the exact hash accompanies the final report.
Production main remains `31d7755b68768a7bc1461afa63592fb945e6c743`.

Reader UI: PASS. [Validation report](validation.json): **40/40 PASS**.

## Implementation

The completed Convergence view now offers **ЗАПРОСИТЬ ТОЛКОВАНИЕ**.
Before all 16 reveals, finished status and the explicit XVI action, no dossier,
copy action or external launch is available. A forced premature UI action was
also rejected. Stage 5A remains the sole owner of draw/reveal/session state.

The native Reader dialog appears on the right at 1366px and fills the viewport
at 320/414px. The completed spread is retained, with no redraw or reroll. Escape,
close and return controls restore focus. Reduced motion is respected.

The UI calls the accepted Stage 5B-1 `fromCompletedSession(session)` directly.
No generator or Reader Protocol is duplicated or rewritten. The question,
ordered identities and actual states remain verbatim. The optional preview is
collapsed initially, selectable plain text, wrapped at 16px, and complete.

Clipboard success is announced inside the panel. Clipboard refusal expands the
preview and selects the full underlying text Range for manual copying.
DeepSeek and ChatGPT links open separate contexts, with no prompt, cookies,
credentials, automatic insertion or submission. Users can choose another Reader.

Byte equivalence was checked against direct Stage 5B-1 generation, repeated
opening and actual clipboard readback, using one accepted completed session:
`06-ambiguous`. UTF-8: **25,079 bytes**. SHA-256:
`d036c9d2e3038f31fd2f3715a9e938264a6d49b4d8221ff7f9fa2d5995513c09`.

## Changed files

- `experiment-convergence/index.html`: local stylesheet/scripts and presentation description only.
- `experiment-reader-ui/reader.js`: availability gate, native panel, clipboard and plain-text preview.
- `experiment-reader-ui/reader.css`: isolated responsive Sacred Divinatio presentation.
- `experiment-reader-ui/README.md`: integration boundary and scope.
- `experiment-reader-ui/validate-stage5b2.cjs`: one bounded UI pass.
- `experiment-reader-ui/verify-copy-layout.cjs`: minimum targeted continuation.
- This isolated review directory: reports, diagnostics and six screenshots.

Stage 5A `session.js`, `convergence.js`, `convergence.css` and production
`ritual-session.js` are byte-unchanged. Stage 5B-1, Stage 4A 1.0.0, Interpretation
Engine, artwork files/mappings, canonical spreads, Archive and all four Kadat
generators are unchanged.

## Validation scope and continuation

One bounded integration pass, one accepted session at 1366/320/414. No upstream
validation suite or literary review ran. External navigation was intercepted
and aborted before contacting third-party websites; neither site availability
nor authentication was re-investigated. AI/API calls: 0; API keys: 0;
application backend: NONE; iframe: NONE.

The initial browser launch stopped before **any UI check**: the existing scratch
Chromium was truncated (69,928,960 bytes). A complete vendor binary (209,022,176
bytes) was restored to a separate scratch directory from the already present
Chromium 153.0.0 compressed package. The [launch diagnostic](browser-launch-failure.json)
was preserved; the unstarted UI pass continued.

The [initial UI result](validation-initial-ui.json) was 39/40. Actual clipboard
copies and underlying DOM Range were byte-exact, but Chrome's rendered
`Selection.toString()` omits a terminal LF. Check 14 now permits that final LF
difference only for rendered selection, while clipboard/Range equality remains
strict. Visual review also found an awkward heading word break at 320px; only
that heading's size was adjusted. [Targeted verification](targeted-copy-layout.json)
rechecked **14, 36, 38**. No full-suite rerun. Only the 320px screenshot and the
desktop preview framing were updated; the final review set contains six images.

## Screenshots

| Reference | View |
| --- | --- |
| [01 — Completed Convergence](screenshots/01-completed-convergence.png) | Spread before Reader opens |
| [02 — Desktop Reader](screenshots/02-desktop-reader.png) | 1366px, dossier collapsed |
| [03 — Desktop prompt preview](screenshots/03-desktop-prompt-preview.png) | Full plain-text dossier in the scrollable preview |
| [04 — Mobile Reader](screenshots/04-mobile-320-reader.png) | 320px |
| [05 — Mobile Reader](screenshots/05-mobile-414-reader.png) | 414px |
| [06 — Copy success](screenshots/06-copy-success.png) | Restrained in-panel status |

## Recovery preservation and delivery

On recovery, no Stage 5B-2 implementation or branch existed. The original
worktree had an unrelated modified `assets/artworks/adeptio_07.jpg` (blob
`d0b6c450e484dcffcd8470a904462174a0229150`). It was preserved untouched outside
this dedicated worktree and excluded from the checkpoint. This branch contains
the accepted artwork blob `d00e5108c6001da9b0114e6846fa5f6eb0acf94e`.

Known Stage 5B-2 issues: NONE. Experimental checkpoint only; no merge to main,
no GitHub Pages publication, no Stage 5B-3 or other spread implementation.
