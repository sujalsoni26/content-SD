# Simulation spec: `jwt-inspector`

## 1. Identity

- Registry name: `jwt-inspector`. Files: `components/diagrams/interactive/jwt-inspector.tsx`; token encoding, the simulated clock and the checklist in `_jwt-inspector-sim.ts`; real signing and verification through `crypto.subtle` (RSASSA-PKCS1-v1_5 with SHA-256, a 2048-bit key pair generated once on mount) with a documented fallback (§8).
- Embedded by `content/lessons/oauth-jwt.mdx` directly under "The validation checklist" (`<Interactive name="jwt-inspector" />`) once implemented.
- Kicker **"Verify it"**. Title **"JWT inspector"**. Hint: "Decode a token, then run the verification checklist. Change one claim or the algorithm and see which step rejects it."

## 2. Learning objective

The learner can list the verification steps in order (parse, find the key by `kid` in the configured JWKS, verify the signature with an allow-listed algorithm, check `iss`, check `aud`, check `exp` and `nbf` with a small skew, and only then read `sub` and `scope`), and explain why a verifier that trusts the token's own `alg` header accepts forged tokens.

## 3. Initial state

- A valid token: header `{ "alg": "RS256", "typ": "JWT", "kid": "2026-11-a" }`; payload `{ iss: "https://auth.example.com", sub: "user-42", aud: "photos-api", exp: now + 3600, nbf: now, iat: now, jti: "f3a9c1", scope: "media:read" }`, signed with the mounted key pair.
- Verifier configuration shown beside the token: expected issuer `https://auth.example.com`, expected audience `photos-api`, algorithm allow-list `RS256, ES256`, JWKS URL `https://auth.example.com/.well-known/jwks.json` holding `kid 2026-11-a`, clock skew 60 s.
- The simulated clock is a fixed epoch (not `Date.now()`), so results are deterministic. The checklist shows all steps passed and the verdict **Accepted**.

## 4. User controls

| Control | Type | Options / range | Default | Effect |
| --- | --- | --- | --- | --- |
| Tamper with payload | `SegmentedControl` | None · sub = user-1 · exp = yesterday · aud = billing-api · iss = https://evil.example · nbf = +10 min | None | Re-encodes the payload **without re-signing** (the attacker has no private key) |
| Header `alg` | `SegmentedControl` | RS256 · none · HS256 (public key as secret) | RS256 | Rewrites the header; `none` drops the signature; HS256 signs with HMAC using the public key bytes as the secret, as the historical confusion attack did |
| Verifier | `SegmentedControl` | Strict: allow-list per key · Lax: trust the header | Strict | Whether step 3 uses the configured algorithm for the key or whatever the header claims |
| Clock skew | `RangeField` | 0–300 s, step 30 | 60 | Tolerance applied to `exp` and `nbf` |
| Advance clock 1 hour | `Button` | — | — | Moves the simulated clock forward |
| Rotate signing key | `Button` | — | — | Issues a new key pair with `kid 2026-12-a`, re-signs the token, keeps the old key in the JWKS until the clock passes its last token's expiry |
| Reset | `Button` | — | — | §9 |

## 5. State model and transitions

State: `{ header, payload, signature, verifier, clock, jwks, cachedJwks }`. On every change the checklist runs in order and stops at the first failure:

1. **Parse:** three base64url parts, header is JSON with `typ` JWT. Fails for a missing third part when `alg` is `none` and the verifier is strict (step 3 reports the real reason).
2. **Key:** read `kid`; if it is not in the cached JWKS, re-fetch the JWKS (simulated, logged as "JWKS re-fetched") and retry; fail if still unknown.
3. **Signature:** strict mode verifies with the algorithm configured for that key (RS256) and rejects `none` or HS256 outright; lax mode uses the header's algorithm, so `none` means "no signature to check" and HS256 recomputes the HMAC with the public key bytes, both of which **pass**.
4. **Issuer:** `iss` equals the expected issuer.
5. **Audience:** `aud` contains `photos-api`; the failure message names cross-JWT confusion.
6. **Time:** `clock ≤ exp + skew` and `clock ≥ nbf − skew`; the message states how far outside the window the token is.
7. **Claims released:** `sub` and `scope` are shown as "handed to authorisation" only when every step passed.

Tampering changes the payload bytes but keeps the old signature, so steps 1–2 pass and step 3 fails in strict mode; in lax mode with `alg: none` the tampered payload is **accepted**, which is the point.

## 6. Visual representation

- **Stage (DOM, not SVG):** the token string in three colour-coded segments (header `dg-box--accent`, payload `dg-box`, signature `dg-box--ghost`), decoded header and payload as key-value tables, the verifier configuration as a card, and the checklist as an ordered list where each step shows pass, fail (with the message) or skipped. The verdict is a banner: **Accepted** (`dg-box--accent`), **Rejected at step N** (`dg-box--bad`), or **Accepted, forged** (`dg-box--bad` with the text "Your verifier trusted the header. Anyone can mint this token.").
- **Stats (plain grid):** Verdict · Failed step · Time to expiry · Algorithm the verifier used · Key id.
- **Note (aria-live):** mirrors the first failing step's message, or "All seven checks passed. Now, and only now, read `sub` and `scope`."
- **EventLog** "Verifier events" (last 10): "JWKS re-fetched: kid 2026-12-a added", "clock advanced to +1 h", "payload changed, signature kept".

## 7. Expected output

| Setting | What the learner sees |
| --- | --- |
| Tamper sub = user-1 | Rejected at step 3: the signature no longer matches the payload |
| Tamper exp = yesterday | Rejected at step 6: "expired 23 h ago; a 60 s skew cannot help" |
| Tamper aud = billing-api | Rejected at step 5: a token minted for another API, cross-JWT confusion |
| alg none, Strict | Rejected at step 3: "none is not in the allow-list for this key" |
| alg none, Lax | **Accepted, forged** banner, even with a tampered payload |
| HS256 with public key, Lax | **Accepted, forged**: algorithm confusion |
| Advance clock 1 hour | Rejected at step 6 exactly when `clock` passes `exp + skew`; raising skew to 300 s delays it by four minutes, no more |
| Rotate signing key | Step 2 re-fetches the JWKS once, then passes; the old key stays listed until its tokens expire |

## 8. Edge cases

- `nbf = +10 min` is rejected until skew reaches 600 s, which the slider cannot reach, so the learner sees that skew is for seconds of drift, not minutes.
- If `crypto.subtle` is unavailable (very old browsers, some embedded webviews), the widget falls back to a simulated signature (a keyed hash over the signing input) and states in the note that signatures are simulated; the checklist logic is identical.
- Key generation is asynchronous; until the key pair exists the stage shows a skeleton and the controls are disabled, so the first render cannot show a false verdict.

## 9. Reset and reduced motion

- Reset restores §3 with the current key pair (no regeneration) and clears the log.
- There is no animation loop; reduced motion changes nothing except that the verdict banner appears without a transition.

## 10. Companion events

- Once, on the first **Accepted, forged** verdict: `{ type: "diagram", mood: "confused", message: "The header said none and the verifier believed it. The token's header is input, not instruction." }`
- Once, on the first fully passing verification after a rejection: `{ type: "diagram", mood: "happy", message: "Signature, issuer, audience, expiry. Now you may read the claims." }`

## 11. Concept explanation

A JWT is three base64url strings: a header saying how it was signed, a payload of claims, and a signature over both. Verification is a fixed order of questions: can I parse it, which key does it name and do I have that key from a URL I configured, does the signature verify with the algorithm I allow for that key, did the issuer I expect mint it, is it addressed to me, is it within its time window allowing a little clock drift. Only then are the claims trustworthy. The two historic failures, accepting `alg: none` and verifying HS256 with an RSA public key as the secret, both come from letting the token tell the verifier what to do.

## 12. Accessibility

- The token is a read-only `textarea` with an `aria-label`; the checklist is an `<ol>` whose items announce their status in text, not only by colour; the verdict banner is `aria-live="assertive"` because it is the result the learner is waiting for; all controls are native and keyboard reachable.
