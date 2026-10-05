# Stage 5B-0 — DeepSeek Web embed feasibility spike

Isolated experiment from accepted Stage 5A `496f2b6838842df0a2a37cc92d6ad497e38cc697`.
Branch: `experiment/imperial-tarot-deepseek-embed`.

Open `index.html` through the repository's existing static preview server:

```sh
node scripts/serve.cjs 4186
```

Then visit `http://127.0.0.1:4186/tarot-prototype/experiment-deepseek-embed/`.
The surrounding spread and question are static mock content. No Stage 5A session,
production card data, draw logic, or interpretation engine is loaded.

The Reader opens as a right-side panel on desktop and a full-screen dialog on
mobile. The default fallback copies one harmless mock string and opens
[`https://chat.deepseek.com/`](https://chat.deepseek.com/) in a separate ordinary
tab with `noopener noreferrer`. Copying does not send the text anywhere.

The embed test creates one ordinary cross-origin iframe on an explicit click.
It does not inspect the remote document, detect login state, read cookies,
insert text, or send a prompt. The test button is disabled after one attempt.
Returning to the fallback removes the iframe. There is no implementation for
authentication, API calls, a proxy, or a Neural Diviner.

## Observed feasibility result

**DIRECT EMBED: PARTIAL — viability not established.** In the tested browser the
iframe navigation failed with `net::ERR_EMPTY_RESPONSE`; the frame remained
blank. No DeepSeek document response headers were available to establish a
`frame-ancestors` or `X-Frame-Options` policy. The normal external tab also
reached `chrome-error://chromewebdata/`. A separate, verified-TLS HEAD request
received HTTP 403 from CloudFront. These observations do not prove that the
service explicitly prohibits framing.

**Login UI: NOT TESTABLE.** No credentials were requested or entered. No login
or CAPTCHA interaction occurred. There were no retries or restriction bypasses.

Fallback functionality and responsive layout passed one bounded **20/20**
compatibility/UI pass. “Open DeepSeek” PASS means that the control opened the
correct official URL in a separate tab; it does **not** mean that DeepSeek loaded
successfully in this environment.

See [the review](review-stage5b0/stage5b0_embed_review.md) and
[machine-readable evidence](review-stage5b0/validation.json). The validator
refuses to overwrite an existing result or regenerate screenshots; do not run
another pass over the accepted artifacts.

This checkpoint does not start Stage 5B-1, change Stage 5A, or publish production.
