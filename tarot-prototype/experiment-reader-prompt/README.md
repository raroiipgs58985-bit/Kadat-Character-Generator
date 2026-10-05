# Stage 5B-1 — Convergence Reader prompt generator

Isolated local context assembly for an external Reader. No reading is generated
locally; no service is contacted and no production UI is modified.

Functional baseline: `865423f7f4c3bbc6710c28408d91f71582a01539`, containing
accepted Stage 5A and Stage 5B-0/0.1. Approved production/main
`31d7755b68768a7bc1461afa63592fb945e6c743` is preserved as an additional parent
of the Stage 5B-1 checkpoint. Its live-test file remains byte-identical.

## Input and output

`reader-prompt.js` consumes either an actual completed Stage 5A session through
`fromCompletedSession(session)`, or its prepared
`convergence-stage5a-v1` contract through `fromReaderInput(input)`.
Both return the same complete plain-text prompt. The existing Stage 5A
`restore`/`toReaderInput` adapter is reused without changes. Incomplete sessions,
wrong counts/order/identities, duplicate cards, mismatched versions and invented
Minor orientation fields are rejected. The contract entry point is intended for
data already produced by a completed Stage 5A session.

```js
const reader = require("./reader-prompt.js");
const prompt = reader.fromCompletedSession(completedConvergenceSession);
```

CLI usage (stdout contains only the prompt):

```sh
node tarot-prototype/experiment-reader-prompt/generate.cjs stage5a-reader-input.json
```

The module also exports a browser global when loaded with the existing
production, frozen-data and Stage 5A globals. This stage does not add a page,
clipboard button, external-service control or integration to any existing UI.

## Frozen semantic authority

Uses existing Stage 4A **1.0.0 / FROZEN** from
`../interpretation-stage4b1/data-v1.0.0.js`, whose original JSON is under
`../interpretation-stage4b1/frozen-data/data/`. No semantic data copy or new
meaning dataset is authored here. The Interpretation Engine is not loaded.

The dossier includes exactly the selected 16 identity/state references,
production names, types, available ranks/suits, selected-state RU keywords and
one existing core fragment per state. Existing contextual notes and bounded
source variations/limitations are preserved. Only suits actually represented
are included, once each, as supplementary context. No artwork identifiers,
paths, internal fragment IDs, traces, session noise or unused-card semantics
appear in the prompt.

Reversed Major uses its own source state; its upright core is not inserted.
Minor remains standard. Discordia suit tendencies do not create card reverse
states. Unenumerated variations and unresolved Stage 4A issues remain limited
rather than invented or corrected.

The question is preserved verbatim. No local analysis or NLP is performed.
Path names/positions are structural coordinates only. Reader instructions ask
for internal analysis of question → five paths → comparison → XVI → synthesis,
then one Russian literary prophecy and concise secondary path explanations.
No private chain-of-thought is requested. Model compliance cannot be guaranteed
by a prompt generator and is reserved for manual review.

## Review and bounded validation

[Six-fixture review](review-stage5b1/stage5b1_prompt_review.md) includes all
questions, ordered card summaries and complete TXT prompt locations.
[Two complete copy/paste prompts](review-stage5b1/two-complete-prompts.md) are
also embedded directly for manual external-chat evaluation.

The validator performs checks 1–39 once and writes the six outputs once; it
refuses to overwrite the accepted artifacts. Check 40 is necessarily performed
after checkpoint/sync:

```sh
node tarot-prototype/experiment-reader-prompt/validate-stage5b1.cjs --finish-checkpoint
```

This final continuation checks Git only, prints the completed 40-check result,
and neither rewrites files nor regenerates fixtures/prompts. Do not rerun the
full bounded pass after delivery. Frozen Stage 4A/4B/5A validation is not run.

No AI, DeepSeek, API, key, backend, production deployment or main merge.
Stage 5B-2 has not started.
