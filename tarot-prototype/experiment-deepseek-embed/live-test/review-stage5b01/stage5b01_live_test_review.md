# Stage 5B-0.1 — public HTTPS embed test candidate

Branch: `experiment/imperial-tarot-deepseek-live-test`

Baseline: `6eecf01cb7961565f37ac5d80e729ef419e0469c`

Production/main: `0dc66e6db4522276de7536ac8292af587b26e4a8`

Checkpoint: the single experimental commit containing this review; exact SHA is in the delivery report.

Public test page: **NOT PUBLISHED**.

## Ready-to-publish file

`tarot-prototype/experiment-deepseek-embed/live-test/index.html`

One self-contained HTML file with inline CSS and four local environment readouts:
origin, HTTPS, browser user agent and viewport. The only external targets are the
ordinary iframe and separate-tab control link, both exactly
`https://chat.deepseek.com/`. No Tarot code, shared styles, card data, prompt
generator, credential handling, API integration, proxy or backend are included.
The manual checklist is displayed as ordinary text; nothing is submitted or stored.

## Publication inspection and minimum proposal

The latest successful built-in `pages build and deployment` run is from **main**
at `0dc66e6db4522276de7536ac8292af587b26e4a8`:

[Observed Pages deployment](https://github.com/raroiipgs58985-bit/Kadat-Character-Generator/actions/runs/37225532230).

The Stage 5A and Stage 5B-0 experimental pushes only show `Validate Kadat` runs.
The tracked workflow is `.github/workflows/check.yml`, containing checks only;
no independent experimental Pages preview workflow was found. A direct
unauthenticated Pages-settings read returned 404, so it did not disclose the
settings. The source assessment is based on the actual deployment run and
tracked workflows, not that 404.

GitHub documents one project Pages site per repository and a chosen publishing
source. Switching that source or deploying an experimental tree would affect
the existing site; neither was done.

- [GitHub Pages site limits](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [Publishing sources](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Recorded repository observations](publication-inspection.json)

**PUBLICATION REQUIRES MAIN CHANGE**, using the existing safe publication route.
The proposal for explicit approval is to add **only the ready-to-publish HTML
file** to main in a separate additive commit. Do not merge this experimental
branch or its Stage 5A / Stage 5B-0 ancestors. Do not copy validation or review
files into main. No existing production file or Pages configuration needs an edit.

Expected URL after approval and the existing Pages build:

`https://raroiipgs58985-bit.github.io/Kadat-Character-Generator/tarot-prototype/experiment-deepseek-embed/live-test/`

This URL is **not currently published**. No main mutation, deployment,
publishing-source change, new repository or new deployment workflow was made.

## Automated bounded validation

**PASS 20/20**, covering our static page and preservation of the accepted files.
Actual rendered layout was checked at 1366, 320 and 414 px. The iframe and
external button fit at each width; the page has no horizontal overflow and no
local JavaScript exception. Origin, protocol, browser and viewport information
render correctly. The external control opened a separate ordinary tab.

There was one bounded browser pass. Its initial 19/20 result contained a test
assertion defect: the desktop assertion ignored the intentional 1100 px maximum
content width. Only that assertion was corrected. One targeted recheck used the
already-recorded measurements, with **0 new browser navigations and 0 new
DeepSeek requests**. No application changes or full-suite repeat occurred.
This history is retained in [validation.json](validation.json).

## Work-environment DeepSeek result

**INCONCLUSIVE.** The local HTTP iframe request again failed with
`net::ERR_EMPTY_RESPONSE`. The separate normal tab reached
`chrome-error://chromewebdata/`. General service unavailability is not classified
as iframe blocking. No successful external control, real public HTTPS iframe,
login or chat interaction could be established here. No remote DOM was accessed,
no credentials entered and no restrictions bypassed.

Manual verification on the public HTTPS page in a normal browser where DeepSeek
works separately is **required**. No Stage 5B-1 or final prompt work has started.

## Manual checklist

```text
DEVICE/BROWSER:
________________

DEEPSEEK OPENS SEPARATELY:
YES / NO

DEEPSEEK APPEARS IN IFRAME:
YES / NO / PARTIAL

LOGIN UI APPEARS IN IFRAME:
YES / NO / NOT TESTED

CHAT UI USABLE IN IFRAME:
YES / NO / NOT TESTED

OBSERVED ERROR:
________________
```

Do not include passwords, cookies, tokens or account information in the report.

Classification:

- **DIRECT EMBED: WORKS** — real HTTPS iframe displays the web interface with ordinary interaction.
- **DIRECT EMBED: BLOCKED** — external control works on the same device/browser, but embedding is specifically refused. Record the observable reason and stop.
- **DIRECT EMBED: PARTIAL** — page renders inside the frame but login/session/chat is unusable.
- **DIRECT EMBED: INCONCLUSIVE** — DeepSeek cannot be reached normally via the external control.

## Scope preservation

All additions are inside `tarot-prototype/experiment-deepseek-embed/live-test/`.
Stage 5A, Stage 5B-0 fallback, production Tarot, Stage 4A, engine, canonical
spreads, Archive, artwork mappings and the four Kadat generators remain unchanged.
API integration calls: **0**; keys: **0**; backend: **NONE**.

Unresolved: explicit approval for the one-file main addition, then the manual
real-browser check. Production and main remain at their accepted checkpoint.
