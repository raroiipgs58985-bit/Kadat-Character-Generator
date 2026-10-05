# Stage 5B-2 — External Reader UI

Entry: `../experiment-convergence/index.html`, on the experimental branch only.
Baseline: `528eadc23eabde856376957b351d9c980519c5af`.

The completed Stage 5A view is enhanced through its read-only `getSession()`
boundary. Stage 5A continues to own drawing, order, the explicit XVI gate,
inspection, storage and full-session reset. Its JS/session/CSS files are unchanged.
Only its isolated HTML entry adds the Reader stylesheet and three local scripts.

The Reader calls the accepted Stage 5B-1 `fromCompletedSession(session)` directly.
It generates no interpretation and duplicates no prompt logic. Before a completed
XVI there is no dossier, clipboard action or external launch. Opening/closing the
panel does not mutate or save a session. Reset clears retained Reader text.

The desktop panel is a native modal dialog positioned on the right; the existing
spread stays visible. On mobile it becomes a full-screen layer. Escape and clear
return controls preserve keyboard focus and the completed session. Reduced motion
disables the small arrival transition. Optional plain-text preview is collapsed
initially, selectable and wrapped at a readable 16px. Clipboard refusal reveals
and selects the complete dossier for manual copying.

DeepSeek and ChatGPT are ordinary `target="_blank"` links with `noopener noreferrer`.
No prompt, cookies or credentials are passed to them. The user pastes manually
and may choose any other external reader. No AI/API, iframe, application backend,
authentication integration or automatic submission exists.

Validation: one bounded `validate-stage5b2.cjs` pass, one accepted session at
1366/320/414. It uses the existing temporary static review server. External link
actions are intercepted and aborted before contacting third parties. No previous
Stage 4A/4B/5A/5B-1 suite is run. Do not rerun the full pass after delivery.

See [implementation review](review-stage5b2/implementation.md) and
[bounded validation](review-stage5b2/validation.json) for the six screenshots.
Main and GitHub Pages remain unchanged. Stage 5B-3 has not started.
