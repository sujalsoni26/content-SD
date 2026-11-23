# Case Study Template (module 14, High-Level Design)

Every HLD case study is one lesson bundle (`drafts/hld/<slug>/lesson.mdx` + `meta.json`) that follows `AUTHORING_BRIEF.md` and this section order. The order is the interview playbook's order, so a learner who has read `url-shortener` recognises every heading. The eighteen items the brief asks for map onto thirteen `##` sections plus deep dives.

| `##` section | Covers (brief items) | Form |
| --- | --- | --- |
| Requirements | 1 problem statement (lead paragraph), 2 functional, 3 non-functional, out of scope | Lead paragraph, then two bullet lists; non-functional items each carry a reason |
| Estimation | 4 capacity estimation and assumptions | Assumptions sentence first, then a table "Quantity / Working / Result"; close with the dominant number and the system shape (link `/learn/system-shapes`) |
| API | 5 API design | Table: Endpoint / Request / Success / Errors |
| Data model | 6 data model | SQL or text code block; one sentence per table on keys and indexes |
| High-level design | 7 architecture, 8 component responsibilities, 9 request and data flows | Mermaid `flowchart` of the architecture; bullet per component ("responsible for…"); one Mermaid `sequenceDiagram` for the hottest write or read path |
| Storage and caching | 10 database and storage choices, 11 caching strategy | Table or bullets: data class → store → why; cache tiers and keys |
| Scaling | 12 scaling strategy | Which tier grows how; sharding keys; fan-out choices |
| Consistency and availability | 13 | Per feature: strong or eventual, and why (link `/learn/consistency`, `/learn/cap`) |
| Failure and recovery | 14 failure scenarios and recovery | Table: Failure / What users see / How it heals |
| Security | 15 | Authn/authz, abuse the design invites, data protection; link the security module |
| Observability | 16 monitoring and observability | The 4–6 SLIs/metrics and one trace that prove health |
| Trade-offs and bottlenecks | 17 | The next thing to break; alternatives not taken and why |
| How it evolves | 18 evolution as scale increases | 10× and 100× in two short paragraphs |
| Deep dive: … (two or three) | the hardest problems | Each a `##` section, as `url-shortener` does |

Rules specific to case studies:

- **Numbers first.** Nothing is drawn before the estimation section has produced the dominant number. Every assumption is written as an assumption ("Assume 50M DAU…").
- **Justify every box** in one sentence containing "because" or "so that".
- **No universal answers.** Where two designs are defensible (fan-out on write vs on read; SQL vs wide-column), show both and state the condition that decides.
- **Reuse** the existing simulations and diagrams where they fit (`estimator` presets, `token-bucket`, `shard-router`, `cap-partition`, `polling-vs-ws`, `architecture-map`, `presigned-upload`) and link core lessons instead of re-teaching them.
- **Length:** 1,800–2,800 words plus diagrams. `minutes` 12–18.
- **Metadata:** `catTip`, `meow` and `recall` are about the design's key insight, not the template. `cards` ×2: one per deep-dive decision ("Problem → Decision and why").
- **Quiz:** two questions, scenario or decision style, assigned to the plan's `check-hld-n`.
- **Sources:** engineering blogs or papers for any real-system claim ("Instagram uses…" needs a citation or becomes "a system like Instagram could…").
