# Imperial Tarot — Stage 4C UI review

**STATUS: PASS — 16/16 UI checks.** Branch: `prototype/imperial-tarot-stage4c`.

Baseline: `40ba079635c4341cbce73b2a9c163e5421c4f0a3`.

Checkpoint: the single Stage 4C commit containing this report. Resolve its exact SHA with `git log -1 --format=%H -- tarot-prototype/review-stage4c/stage4c_ui_review.md`; the delivery report supplies the full SHA. The report cannot contain its own commit hash without changing that hash.

The public `/tarot-prototype/` entry opens Sacred Divinatio directly. Existing `?concept=a`, `?concept=c` and `?concept=d` URLs also reach the accepted design. The obsolete comparison link, concept selectors and preview bar are absent. Historical concept implementations remain in the repository. Registrum Kadat and the existing transition entry remain available.

Phone prophecy text is 21 px with a 1.72 line height. The question is 19 px, spread title 26 px, disclosure/action text 14 px. A compact 82×112 px artwork context appears above the full-width question and prophecy. The phone reading has 16 px outer margins. Desktop retains its existing typography and side artwork composition.

Expanded signs retain their structure and collapsed default. Thumbnails are 84×120 px; names are 22 px and role/state labels 14 px. Explanatory prose is 18 px and spans the full sign width below the artwork/name block. Branch retains the shared III–IV forces/options group and the two unselected V–VI directions.

## Six review screenshots

| View | Reference |
| --- | --- |
| Landing, 414 px; prototype selectors removed | [Landing](screenshots/01-tarot-landing-mobile-414.png) |
| Final prophecy, 320 px | [320 px reading](screenshots/02-prophecy-mobile-320.png) |
| Final prophecy, 414 px | [414 px reading](screenshots/03-prophecy-mobile-414.png) |
| Expanded signs, 414 px | [Signs](screenshots/04-signs-expanded-mobile-414.png) |
| Final prophecy, 1366 px | [Desktop](screenshots/05-prophecy-desktop-1366.png) |
| Unchanged Archive placeholder, 414 px | [Archive](screenshots/06-archive-placeholder-mobile-414.png) |

All six screenshots were captured once and visually inspected. No old Stage 4B screenshot was regenerated. Layout observations also cover 375 and 390 px. Main prose uses the available phone width; sign prose spans its row. No horizontal overflow or clipped reading headings, questions, names or states was observed.

## Bounded UI validation

[stage4c_ui_validation.json](stage4c_ui_validation.json) records the 16 requested UI checks. One Imperator reveal session used the saved accepted draw, then displayed its saved accepted reading. Branch was inspected only as a saved completed reading. The source is the existing Stage 4B-2 validation artifact. Prophecy paragraph arrays match those saved outputs exactly.

**New interpretation calls: 0. New random draws: 0.** The local review harness rejected any attempted engine interpretation. No Stage 4A validation, 60-check engine suite, 24-check synthesis regression, six-flow Stage 4B-2 run or 28-check Stage 4B-2 suite was executed.

The initial Archive assertion expected single line breaks, while browser `innerText` inserts blank lines between block elements. Its diagnostic record is [stage4c_ui_validation_initial.json](stage4c_ui_validation_initial.json). Only the assertion was corrected to compare the three existing content blocks exactly. Passed checks 01–03 and the landing screenshot were retained; pending checks continued. No application change followed this observation.

The generator check initially used the wrong accessibility role. Its correction then needed explicit navigation-button scope because the body also carries `data-registry-mode`. [stage4c_generator_selector_initial.json](stage4c_generator_selector_initial.json) retains that selector diagnostic; [stage4c_generator_recheck.json](stage4c_generator_recheck.json) records the final scoped button check. Only the four generator entry points and the frozen-file diff were checked again. No Tarot flow, interpretation or screenshot was repeated. All four generator entries load; no full generator workflow was performed.

Keyboard disclosure, sequential reveal, final interpretation gating, full reset and return to Kadat passed. Archive markup, behavior and supporting CSS remain unchanged. Application console/resource errors: none.

## Changed files and boundaries

- `tarot-prototype/index.html`: production page metadata, noscript wording and cache versions for the changed UI assets.
- `tarot-prototype/prototype.js`: direct Sacred Divinatio entry and removal of the public comparison chrome; history navigation stays on Sacred Divinatio.
- `tarot-prototype/interpretation-ui.css`: mobile final-reading and sign typography/layout only.
- `tarot-prototype/review-stage4c/`: this report, validation/diagnostic records and six screenshots.

`stage2.js`, ritual reveal CSS, Archive implementation, session adapter, randomization, seed behavior, interpretation engine, synthesis, Stage 4A data, card names/IDs, artwork assignments, spread definitions, Astro semantics and all four Kadat generators are unchanged. Interpretation content and question display-only behavior are unchanged. No application dependency, AI/API/LLM/NLP/backend was added.

Known application issues in this scope: **none found**. Main and production Pages remain at the baseline. This checkpoint is for manual review; no main merge or publication is part of Stage 4C.
