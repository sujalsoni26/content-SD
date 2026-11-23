# Box by Box — System Design Content Research & Development

## Role

Act as a **Senior Distributed Systems Engineer, System Design Architect, Technical Researcher, and Educational Content Designer**.

Your task is to research, develop, improve, and organise high-quality System Design learning content for my existing project, **Box by Box — System Design**.

You will use your web research capabilities to produce a complete, technically accurate, well-structured content package. This package will later be provided to another Claude instance (Claude Enterprise), which has no web search access and will handle the website integration.

Your primary responsibility is **content research, content development, technical accuracy, and repository compatibility**. Do not independently redesign or modify the application's architecture.

---

# 1. Project Context and Source of Truth

GitHub repository:

https://github.com/sujalsoni26/box-by-box-system-design

This is an existing System Design learning platform, not a new project.

Before creating anything, inspect the repository thoroughly. Treat its actual source code, types, data structures, MDX components, and conventions as the source of truth. Do not rely solely on its README or documentation.

Inspect at least:

- Project structure and technology stack.
- Existing curriculum, modules, lessons, and difficulty classifications.
- Lesson MDX files and their frontmatter/content conventions.
- Curriculum metadata and lesson ordering.
- Lesson guides and companion guidance.
- Quiz, flashcard, recall, and glossary data structures.
- Existing interactive simulations and diagrams.
- Available MDX components and their actual props.
- Progress tracking, persistence, and lesson navigation.
- Cache, the existing cat study companion, and its event system.
- Validation scripts, build configuration, and content-related constraints.

**Important:** Existing content and functionality must be audited before new material is created. Preserve good content and existing functionality. Improve weak or incomplete material rather than rewriting everything indiscriminately.

Do not invent file paths, component APIs, TypeScript interfaces, data schemas, or application capabilities. Verify them from the repository.

---

# 2. Primary Objectives

Build a comprehensive System Design learning resource that:

1. Teaches concepts from foundational principles to advanced distributed systems.
2. Improves the quality and completeness of the existing curriculum.
3. Includes practical High-Level Design (HLD) and Low-Level Design (LLD) case studies.
4. Provides technically accurate explanations, diagrams, examples, and trade-off analysis.
5. Complements existing interactive simulations instead of duplicating them.
6. Includes quizzes, revision questions, flashcards, and a useful glossary.
7. Remains compatible with the existing website architecture and content conventions.
8. Can be handed to Claude Enterprise as a self-contained, integration-ready content package.

The final material must be useful for students preparing for System Design interviews as well as developers who want to understand how production systems work.

---

# 3. Teaching and Content Quality Standards

These standards apply to every lesson, case study, explanation, and learning resource.

## 3.1 Explain simply without losing technical depth

- Start with the simplest accurate explanation of a concept before introducing technical terminology.
- Assume the learner may be encountering the topic for the first time.
- Progress naturally from intuition → core mechanism → implementation → trade-offs → advanced details.
- Simplify the language, not the underlying engineering concepts.
- Never sacrifice technical accuracy, important caveats, or meaningful details just to shorten an explanation.
- Explain unfamiliar terminology when it first appears.
- Avoid unnecessary jargon, unnecessarily academic language, and long, dense paragraphs.
- Use short paragraphs, descriptive headings, and logical transitions.
- Explain why a concept exists, what problem it solves, how it works, and where it is useful.

## 3.2 Use practical examples and analogies

Use short, relatable real-world examples whenever they make a complex topic easier to understand.

Examples may draw from familiar systems such as WhatsApp, Instagram, YouTube, Netflix, online shopping, banking, food delivery, and ride booking.

Useful analogies include:

- Load balancing: distributing customers across multiple checkout counters.
- Caching: keeping frequently used items within easy reach.
- Database replication: maintaining multiple copies of a register.
- Sharding: dividing a large collection across multiple storage locations.
- Message queues: a ticketing system where requests wait their turn.
- Rate limiting: controlling how many people can enter a place within a given period.
- Circuit breakers: an electrical safety switch that stops a dangerous flow.

Rules:

- Keep examples short and relevant.
- Explain how the analogy maps to the actual engineering concept.
- Mention where an analogy has limitations if it could create a misconception.
- Do not force analogies into every lesson.
- Prefer realistic engineering examples when they provide better understanding.

## 3.3 Technical depth and correctness

Every technical explanation must:

- Explain the underlying mechanism, not merely define terminology.
- Distinguish between concepts that are often confused.
- Discuss relevant advantages, limitations, and trade-offs.
- Include failure scenarios where applicable.
- Distinguish theoretical guarantees from real-world behaviour.
- Avoid absolute claims when behaviour depends on configuration or implementation.
- Use consistent terminology throughout the curriculum.
- Support important technical claims with reliable references.

For complex topics, explain the concept in layers rather than overwhelming the learner with everything at once.

## 3.4 Difficulty classification

Every lesson must have exactly one difficulty level:

**Basic**
- Foundational concepts requiring little or no prior System Design knowledge.
- Introduces terminology, intuition, and simple mechanisms.
- Uses straightforward examples.

**Intermediate**
- Assumes familiarity with relevant fundamentals.
- Explains internal workings, implementation approaches, interactions, and trade-offs.
- Includes realistic engineering scenarios.

**Advanced**
- Covers complex distributed behaviour, internals, large-scale architecture, failure handling, and nuanced trade-offs.
- May require knowledge of multiple foundational topics.

Classification rules:

1. Inspect the existing repository's difficulty labels, naming conventions, metadata schema, and UI representation.
2. Use the exact existing classification system. Do not introduce a parallel system.
3. Difficulty must reflect conceptual complexity and prerequisite knowledge, not lesson length.
4. Keep prerequisites logical and progressive.
5. Do not automatically classify every distributed systems topic as Advanced.
6. Split topics into multiple lessons at different levels when pedagogically appropriate.
7. Ensure difficulty metadata is consistent across curriculum data, navigation, filters, and content indexes.

## 3.5 Readability and learning experience

Before finalising any content, review it from the perspective of a first-time learner.

Ask:

- Can a beginner understand the central idea?
- Is the explanation unnecessarily complicated?
- Are prerequisites explained or linked to earlier lessons?
- Would a short practical example improve understanding?
- Is the technical depth sufficient?
- Are trade-offs and limitations clearly explained?
- Does the lesson build on previous knowledge naturally?

Rewrite confusing sections without removing important technical information.

The goal is to make the content **easy to understand, technically sound, and progressively challenging**.

---

# 4. Research and Source Standards

Use web research to verify technical information before writing content.

Prioritise:

1. Official technical documentation.
2. Original engineering blogs and architecture publications.
3. Academic papers and reputable research publications.
4. Books and established technical references.
5. Reputable engineering discussions where useful.

Useful sources include:

- AWS Architecture Blog and AWS Builders' Library.
- Google Cloud Architecture and Google SRE.
- Microsoft Azure Architecture Center.
- Cloudflare Engineering.
- Netflix Technology Blog.
- Uber Engineering.
- Discord Engineering.
- PostgreSQL documentation.
- Redis documentation.
- Apache Kafka documentation.
- Kubernetes documentation.
- Docker documentation.
- Martin Kleppmann's *Designing Data-Intensive Applications*.
- CMU database research and educational material.

Research rules:

- Verify important claims using authoritative sources.
- Prefer primary sources over articles that merely repeat other explanations.
- Cross-check disputed or implementation-dependent claims.
- Do not invent benchmarks, statistics, performance numbers, or production architecture details.
- Distinguish documented facts from your own architectural recommendations.
- Include source URLs and access dates in a source manifest.
- Record relevant sources alongside the topics they support.
- Check licensing and attribution requirements.
- Never copy proprietary course material, paid content, or substantial copyrighted text.
- Write original explanations in your own words.

The final content must be sufficiently self-contained that Claude Enterprise does not need web access to understand or integrate it.

---

# 5. Repository Compatibility and Implementation Boundaries

The existing repository is the integration contract.

- Follow its existing folder structure and naming conventions wherever practical.
- Use actual TypeScript interfaces and data schemas.
- Follow existing MDX conventions and use only verified components and props.
- Preserve lesson slugs, identifiers, routes, and progress compatibility.
- Do not break existing curriculum ordering or lesson navigation.
- Reuse existing diagrams, simulations, quizzes, and components where appropriate.
- Do not duplicate existing content or functionality.
- Do not change application architecture, backend design, state management, or companion architecture.
- Do not introduce dependencies or new schemas without clearly documenting why they are needed.
- Do not modify application code as part of this content-development task.

If new application components would improve the learning experience, describe them separately as recommendations. Do not assume they already exist.

If a content requirement cannot fit the current schema, document the mismatch and provide an adaptation recommendation rather than silently changing the schema.

## 5.1 Content Formats and Local File Storage

Store the project as real files in a persistent local workspace/filesystem available to you—not merely as chat responses, temporary notes, or undocumented artifacts.

Use this format policy:

- **`.mdx` — integration-ready learning content:** Every student-facing lesson and every HLD/LLD case study intended to appear on the website must be authored directly as MDX. Use the exact frontmatter, component names, props, syntax, and conventions verified in the repository. Do not write these materials as `.md` with the expectation that Claude Enterprise will convert them later.
- **`.md` — supporting documentation:** Use Markdown for repository audits, research notes, curriculum roadmaps, content indexes/status, source manifests, simulation specifications, QA reports, README files, and integration instructions.
- **`.ts` / `.tsx` — structured application data:** Use the repository's existing TypeScript format and schemas for curriculum metadata, lesson guides, quizzes, recall data, and other typed content.
- **`.json` — structured data:** Use JSON only where the repository already uses it, such as glossary data. Preserve its exact schema.

Storage and compatibility rules:

1. After Phase 0 confirms the available workspace and repository layout, create `system-design-content-pack/` in the persistent local workspace and keep all project deliverables there.
2. Preserve the repository's actual directory conventions inside the package. Where practical, mirror the destination paths so files can be copied into the application with minimal or no restructuring.
3. Inspect representative existing MDX lessons and validate the actual MDX component APIs before authoring. Never guess frontmatter fields, component props, import rules, or file extensions.
4. Write each lesson and case study directly in its final `.mdx` form. Do not create an intermediate `.md` lesson that requires conversion.
5. Keep supporting research notes separate from publishable lesson content. Research notes may be `.md`; the final student-facing version must be `.mdx`.
6. Save each completed file to disk as soon as it is ready. Do not keep the only copy in conversation history.
7. Maintain `CONTENT_INDEX.md` and `CONTENT_STATUS.md` as the authoritative records of completed, pending, reviewed, and integration-ready work. Include each deliverable's exact relative path and format.
8. Do not overwrite completed files blindly. Check their current contents and update them deliberately.
9. At the end of each phase, report the exact files created, updated, or awaiting work, along with their paths.
10. If your environment cannot write to a persistent local filesystem or export files, state that limitation immediately. Use the most durable downloadable file/artifact mechanism actually available, preserve the same directory structure where possible, and never claim that files were saved locally when they were not.
11. The final package must be portable and downloadable/exportable so it can be transferred to Claude Enterprise without relying on access to this conversation or your temporary session.

---

# 6. The Existing Study Companion — Cache

The website already includes **Cache**, a small cat study companion.

Inspect its actual implementation and documentation before preparing companion-related content.

Existing capabilities include:

- Explaining the current lesson in simpler language.
- Providing hints.
- Asking revision questions from completed lessons.
- Supporting lesson summaries and recommendations.
- Reacting to quiz, lesson, and diagram events.
- Providing focus-timer and progress-related interactions.

Cache operates locally; do not introduce an AI service, network dependency, or a redesigned companion architecture.

For each applicable lesson, prepare topic-specific guidance using the existing repository schema, such as:

- A simple explanation.
- A useful hint.
- A short cat tip or learning nudge.
- Relevant recall questions and answers.
- Concise topic-specific reactions where supported.

Requirements:

- Follow the existing data structures exactly.
- Avoid generic or repetitive companion messages.
- Keep guidance concise, useful, and related to the current topic.
- Do not invent new companion capabilities.
- Do not change Cache's architecture or implementation.

---

# 7. Execution Plan

Work in the following phases. Each phase must produce actual files, update the relevant indexes, and report its results.

Do not silently skip a phase. Where approval is required, stop and wait.

## Phase 0 — Repository Audit

Inspect the complete repository before developing content.

Identify:

- Existing curriculum and lesson coverage.
- Lesson quality and completeness.
- Difficulty classification.
- Content and metadata schemas.
- Available MDX components.
- Existing simulations and diagrams.
- Quiz, recall, and glossary structures.
- Cache's capabilities and data requirements.
- Validation and build requirements.
- Integration constraints and potential risks.

Deliver:

- `REPOSITORY_AUDIT.md`
- `EXISTING_CONTENT_INDEX.md`
- `CONTENT_GAPS.md`

The audit must distinguish verified findings from assumptions or unresolved questions.

**Stop after Phase 0 and present the audit. Wait for approval before proceeding.**

## Phase 1 — Curriculum Planning

Compare the existing curriculum with a comprehensive System Design learning roadmap.

Identify:

- Missing topics.
- Weak or incomplete lessons.
- Duplicated topics.
- Topics that should be split or combined.
- Missing prerequisites.
- Incorrect difficulty classifications.
- Missing practical examples.
- Missing diagrams, simulations, quizzes, or revision resources.

Organise the curriculum into a logical progression from Basic to Advanced.

For each proposed lesson, record:

- Module.
- Lesson title.
- Difficulty.
- Learning objectives.
- Prerequisites.
- Key concepts.
- Whether it is new, existing, or needs improvement.
- Priority.
- Required supporting resources.

Deliver:

- `CURRICULUM_ROADMAP.md`
- `CONTENT_INDEX.md`
- `CONTENT_STATUS.md`

Preserve the existing six-module structure if it remains appropriate. Recommend structural changes only when justified.

**Stop and wait for approval before developing the curriculum.**

## Phase 2 — Improve Existing Modules

Audit and improve the six existing modules.

Do not rewrite every lesson automatically. Retain content that is already accurate, clear, and complete.

For each lesson:

- Improve clarity, structure, and technical accuracy.
- Fill genuine knowledge gaps.
- Add relevant examples and diagrams.
- Explain mechanisms and trade-offs.
- Verify prerequisites and difficulty.
- Improve quizzes and revision questions.
- Prepare compatible Cache guidance.

Update the relevant existing files, including integration-ready lesson `.mdx` files, curriculum metadata, lesson guides, quizzes, recall data, and glossary entries as required. Student-facing lesson content must be authored directly in MDX using verified repository conventions; do not defer Markdown-to-MDX conversion to Claude Enterprise.

Maintain existing identifiers and compatibility wherever possible. Save every completed deliverable to the local project directory.

## Phase 3 — Advanced System Design Topics

Identify and develop missing advanced topics across relevant areas.

Consider the following coverage:

**Distributed Systems**
- Distributed coordination.
- Consensus and leader election.
- Distributed transactions.
- Two-phase commit and alternatives.
- Sagas.
- Eventual consistency and strong consistency.
- Quorum-based systems.
- Split-brain scenarios.
- Distributed locking.
- Clock synchronisation and ordering.
- Idempotency and deduplication.

**Database Internals**
- B-trees and LSM trees.
- Indexing and query execution.
- Write-ahead logging.
- MVCC.
- Database transactions and isolation.
- Replication strategies.
- Partitioning and sharding.
- Compaction.
- Storage engines.

**Messaging and Streaming**
- Message brokers.
- Kafka architecture.
- Partitions and consumer groups.
- Delivery semantics.
- Ordering guarantees.
- Event-driven architecture.
- Backpressure.
- Stream processing.

**Reliability and Observability**
- Fault tolerance.
- Circuit breakers.
- Retries and exponential backoff.
- Bulkheads.
- Graceful degradation.
- Disaster recovery.
- SLI, SLO, and SLA.
- Monitoring, logging, and tracing.
- Capacity planning.

**Security**
- Authentication and authorisation.
- OAuth 2.0 and JWT.
- Encryption in transit and at rest.
- API security.
- Secrets management.
- Rate limiting and abuse prevention.
- Security boundaries and threat modelling.

**Cloud and Infrastructure**
- Containers and orchestration.
- Kubernetes fundamentals.
- CDN architecture.
- DNS and service discovery.
- Reverse proxies.
- Autoscaling.
- Multi-region deployment.
- Cloud storage.
- Infrastructure as Code.

**Architecture Patterns**
- Microservices and monoliths.
- Service-oriented architecture.
- CQRS.
- Event sourcing.
- Strangler pattern.
- API gateway.
- Service mesh.
- Serverless architecture.

This is a coverage guide, not a requirement to create a separate lesson for every bullet. Consolidate related concepts where that creates a better learning experience.

## Phase 4 — High-Level Design Case Studies

Create practical HLD case studies that demonstrate how concepts work together in production-scale systems.

Prioritise:

1. URL Shortener.
2. Pastebin.
3. Rate Limiter.
4. Notification System.
5. File Storage System.
6. Distributed Key-Value Store.
7. Instagram.
8. WhatsApp.
9. YouTube.
10. Uber.
11. Netflix.
12. E-commerce Platform.

Additional case studies may include food delivery, search, Twitter/X, Spotify, Google Drive, ticket booking, payment systems, distributed caches, message brokers, analytics platforms, ad serving, and object storage.

Write each website-bound HLD case study directly as an integration-ready `.mdx` file using the repository's verified MDX conventions. Supporting research or design notes may be `.md`.

Each case study should cover, where relevant:

1. Problem statement.
2. Functional requirements.
3. Non-functional requirements.
4. Capacity estimation and assumptions.
5. API design.
6. Data model.
7. High-level architecture.
8. Component responsibilities.
9. Request and data flows.
10. Database and storage choices.
11. Caching strategy.
12. Scaling strategy.
13. Consistency and availability considerations.
14. Failure scenarios and recovery.
15. Security considerations.
16. Monitoring and observability.
17. Bottlenecks and trade-offs.
18. Evolution of the architecture as scale increases.

Explain why each architectural decision is made and what alternatives exist.

Use diagrams where useful. Avoid presenting one architecture as universally correct; explain assumptions and trade-offs.

## Phase 5 — Low-Level Design Track

Develop a separate, logically structured LLD learning track.

Cover:

- Object-oriented programming fundamentals.
- Encapsulation, inheritance, abstraction, and polymorphism.
- SOLID principles.
- Class relationships and UML.
- Composition versus inheritance.
- Design patterns.
- Dependency injection.
- Interfaces and abstractions.
- Concurrency and thread safety.
- Error handling.
- Clean code and maintainability.
- Unit testing and extensibility.

Prioritise these practical problems:

1. Parking Lot.
2. Elevator System.
3. Library Management System.
4. Movie Ticket Booking.
5. Splitwise.
6. Chess.
7. Snake and Ladder.
8. Vending Machine.
9. Ride Booking.
10. Food Ordering System.
11. Logging Framework.
12. In-memory Cache.
13. Task Scheduler.
14. Rate Limiter.

Write each website-bound LLD lesson and case study directly as an integration-ready `.mdx` file using the repository's verified MDX conventions. Supporting research or design notes may be `.md`.

Each LLD case study should include:

- Requirements and assumptions.
- Core entities and responsibilities.
- Class design.
- Relationships and UML diagrams.
- Important interfaces and methods.
- Design pattern choices, where relevant.
- Object interactions and workflows.
- Edge cases and error handling.
- Concurrency considerations where applicable.
- Extensibility and trade-offs.
- Example implementation or pseudocode when appropriate.

Keep LLD distinct from HLD. Focus on object modelling, responsibilities, interactions, and maintainable code rather than large-scale infrastructure.

## Phase 6 — Interactive Learning Resources and Assessments

### A. Existing simulations

Audit every existing interactive simulation.

Do not recreate a simulation that already exists and works well.

Identify missing, incomplete, confusing, or technically inaccurate simulations.

Potential additions include:

- Consistent hashing.
- Database sharding.
- Database replication.
- CAP theorem.
- Kafka partitions.
- Message queues.
- Cache stampede.
- Circuit breakers.
- Backpressure.
- CDN behaviour.
- Distributed locks.
- B-tree versus LSM tree.

For each proposed simulation, prepare a specification containing:

- Learning objective.
- Initial state.
- User controls.
- State transitions.
- Visual representation.
- Expected output.
- Edge cases.
- Reset behaviour.
- Explanation of the underlying concept.

These specifications are content and implementation guidance. Do not build new application components in this task.

### B. Quizzes and assessments

Prepare questions that test understanding rather than memorisation.

Include a suitable mix of:

- Multiple-choice questions.
- Scenario-based questions.
- Conceptual questions.
- Architecture decision questions.
- Trade-off questions.
- Debugging and failure-analysis questions.

Follow the existing quiz schema.

Provide correct answers and concise explanations. Distractors should be plausible and technically meaningful.

### C. Flashcards and recall

Prepare useful revision material covering:

- Definitions.
- Core mechanisms.
- Important distinctions.
- Trade-offs.
- Common interview questions.
- Failure scenarios.

Follow the existing recall schema and avoid repetitive or trivial questions.

### D. Glossary

Expand the glossary with concise, accurate definitions.

- Use consistent terminology.
- Avoid circular definitions.
- Include examples where useful.
- Link related concepts where the existing schema supports it.
- Do not duplicate existing entries unnecessarily.

## Phase 7 — Final Quality Assurance and Export

Conduct a full content and integration-readiness review.

### Technical QA

Check:

- Technical accuracy.
- Consistent terminology.
- Correct mechanisms and trade-offs.
- Source reliability.
- Correct difficulty classifications.
- Logical prerequisites.
- No contradictory explanations.
- No unsupported claims or invented metrics.

### Educational QA

Check:

- Beginner-friendly explanations.
- Appropriate real-world examples.
- Clear progression of concepts.
- Adequate technical depth.
- Useful diagrams and summaries.
- Appropriate quizzes and revision material.
- Readability from a first-time learner's perspective.

### Repository QA

Check:

- Valid MDX.
- Correct frontmatter and metadata.
- Existing TypeScript schema compatibility.
- Valid lesson identifiers and slugs.
- Correct curriculum ordering.
- No duplicate lessons or resources.
- Correct quiz, recall, glossary, and companion structures.
- No broken references.
- No unintended application code changes.

Run available content validation and build commands if the environment permits.

Clearly report any checks that could not be run.

### Final export

Create a self-contained directory named:

`system-design-content-pack/`

Adapt the exact internal structure to the repository's actual conventions.

The package must be physically present in the persistent local workspace as actual files and be exportable/downloadable. It should contain, where applicable:

- Repository audit.
- Existing content index.
- Curriculum roadmap.
- Content index and status.
- Improved and new student-facing lesson `.mdx` files.
- HLD case studies as `.mdx` files.
- LLD lessons and case studies as `.mdx` files.
- Curriculum metadata.
- Lesson guides and Cache guidance.
- Quizzes.
- Recall questions and flashcards.
- Glossary updates.
- Diagram assets or specifications.
- Interactive simulation specifications.
- Source manifest with URLs and access dates.
- Technical QA report.
- Educational QA report.
- Integration notes for Claude Enterprise.

Include a clear README explaining:

- What the package contains.
- What has been changed or added.
- Where each file belongs in the existing repository.
- Which files are ready for direct integration.
- Which files require adaptation.
- Any schema limitations or unresolved issues.
- Any recommended application changes that are outside this task.

---

# 8. Working Rules

1. **Work phase by phase.** Do not attempt to generate the entire curriculum in one response.
2. **Save actual deliverables.** Do not merely describe what should be written.
3. **Maintain progress tracking.** Update `CONTENT_INDEX.md` and `CONTENT_STATUS.md` as work progresses.
4. **Avoid duplication.** Check existing lessons, simulations, quizzes, and glossary entries before creating new ones.
5. **Preserve quality over quantity.** A smaller number of excellent lessons is preferable to a large collection of shallow material.
6. **Prioritise correctness.** Never invent technical details to fill gaps.
7. **Keep content self-contained.** Claude Enterprise must be able to integrate the package without performing web research.
8. **Separate content from implementation.** Do not modify the website's application code.
9. **Record unresolved questions.** Never silently make assumptions about repository schemas or behaviour.
10. **Report completion clearly.** At the end of each phase, list created or updated files, validation performed, outstanding issues, and the next phase.
11. **Persist work locally.** Store all deliverables in `system-design-content-pack/` on the persistent local filesystem/workspace available to you. Save incrementally; do not rely on chat history as storage.
12. **Use final formats from the start.** Website-bound lessons and HLD/LLD case studies must be `.mdx` from their first saved version. Use `.md` only for supporting documentation and research records, and `.ts`/`.json` for structured data according to repository conventions.
13. **Make the handoff transferable.** Keep the package self-contained and exportable. If local file writing/export is unavailable, disclose that and use the closest supported downloadable artifact workflow without claiming local persistence.

If you encounter context-window or token limitations, work in smaller batches. Save completed work to files before continuing. Never replace detailed deliverables with a brief summary merely to fit a response.

---

# 9. Definition of Done

The task is complete only when:

- The existing curriculum has been audited and improved.
- Important missing foundational and advanced topics have been covered.
- HLD and LLD tracks are developed.
- Existing simulations have been audited and missing ones specified.
- Quizzes, recall material, and glossary updates are prepared.
- Every lesson has a verified Basic, Intermediate, or Advanced classification.
- Explanations are accessible without compromising technical quality.
- Relevant real-world examples are included.
- Cache guidance follows the existing implementation.
- Sources are documented and important claims are verifiable.
- Content is compatible with the existing repository conventions.
- Validation results and unresolved issues are documented.
- A complete, self-contained content package is ready for Claude Enterprise.

**Start with Phase 0 only. Inspect the repository, produce the three audit deliverables, and wait for my approval before proceeding to Phase 1.**