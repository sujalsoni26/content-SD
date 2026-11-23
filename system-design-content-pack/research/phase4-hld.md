# Research notes — Phase 4 (module 14: high-level design case studies)

Date: 2026-11-22. Sources per study are in `drafts/hld/<slug>/meta.json` and `SOURCE_MANIFEST.md`.

## Method

Each study follows `plan/CASE_STUDY_TEMPLATE.md` (thirteen sections plus two or three deep dives) and the rule that nothing is drawn before the estimation produces the dominant number. Review recomputed every estimate from the stated assumptions (all figures reproduce), checked every real-system claim against its source or had it rewritten as "a system like X could…", and checked that each study reuses existing simulations (`shard-router`, `cap-partition`, `estimator`, `token-bucket`, `architecture-map`, `polling-vs-ws`) and registered diagrams (`presigned-upload`, `cdn-edges`, `rate-limit-vs-shedding`) instead of describing them again.

## Verified claims worth knowing

| Study | Claim | Status |
| --- | --- | --- |
| `design-key-value-store` | Cassandra defaults: `num_tokens` 16, `phi_convict_threshold` 8, `max_hint_window` 3 h, `gc_grace_seconds` 864,000, tombstone warn/fail 1,000/100,000; Dynamo (3,2,2) and the 10-entry vector clock cap | verified against the Cassandra documentation and the Dynamo paper |
| `design-file-storage` | Dropbox 4 MB blocks, SHA-256 blocklists and `need_blocks`; Magic Pocket; conflicted copies; S3 pre-signed URL limit of seven days | verified; GFS figures via Wikipedia (secondary) with the paper as reference |
| `design-instagram` | Sharded ID layout (41/13/10 bits), the 2012 Cassandra adoption and the 2016 ranked feed ("70 percent missed") | the ID post could not be fetched and is cited as secondary; the 2016 announcement is verified; Twitter's 800-entry timelines and 2012 fan-out figures are from High Scalability and InfoQ (secondary/reference) |
| `design-pastebin` | S3 POST-policy `content-length-range`; lifecycle expiry is asynchronous and not a deadline; PostgreSQL partition drop versus bulk delete; RFC 9110's 413 "Content Too Large" | verified |
| `design-rate-limiter` | Redis script atomicity, `TIME` in scripts, effects replication since Redis 5, `NOSCRIPT`, hash tags; Cloudflare's 0.003% error on 400M requests; Stripe and Envoy fail-open defaults; RFC 6585 and RFC 9110 | verified; the IETF RateLimit header draft is cited without a version number because it keeps changing |
| `design-notification-system` | SQS visibility timeout 30 s, FIFO 300 calls/s per action, DLQ keeps the original timestamp; APNs 410 with timestamp, collapse ids, 4 KB payload, token refresh at most every 20 minutes; FCM `QUOTA_EXCEEDED` backoff of a minute, four-week default lifespan, four collapse keys; Twilio callbacks may arrive out of order; SES sandbox 200/day | verified; the 2,000 email/s and 500 SMS/s provider limits are stated assumptions |

## Decisions recorded

- The comprehensive URL shortener case study stays at its existing slug and moved to module 14 (`check-url-shortener.moduleId` is now `hld`); module 6 keeps the playbook with cross-references, as the owner asked.
- The `hld` flashcard deck is embedded at the end of `case-study-method` ("Come back here after each study"), because the practice page lists only the two original decks until recommendation 12 in `recommendations/APP_CHANGES.md` is applied.
- Estimation tables use `\~` for approximations because `~` inside a table cell is interpreted by the Markdown pipeline.
