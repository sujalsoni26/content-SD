# Static diagram specifications

Phase 1 planned 24 new static SVG diagrams (one `components/diagrams/static/<name>.tsx` each) for structural concepts. During Phases 3–5 every drafted lesson expressed those concepts as **Mermaid charts authored directly in the MDX** (`flowchart`, `sequenceDiagram`, `stateDiagram-v2`, `classDiagram`), which the validator allows and the app renders client-side in the current theme, or reused a diagram that is already registered. A static component would duplicate a chart that exists, so **no new static diagram components are required** and no `.tsx` drafts are proposed. The table records the decision per planned diagram. Rows marked *planned* belong to Wave C lessons not yet drafted; the expectation is the same.

Every chart in the pack parses with the app's own Mermaid 12.3.0 (`node tools/mermaid-check.mjs <app-repo> content/lessons`), and `recommendations/APP_CHANGES.md` lists the one validator change (`classDiagram`) they depend on.

| Planned diagram | For lesson | Resolution | How the lesson draws it |
| --- | --- | --- | --- |
| `vector-clock-example` | `time-and-ordering` | superseded | Mermaid sequenceDiagram in time-and-ordering.mdx |
| `consistency-model-map` | `linearizability` | superseded | Mermaid sequenceDiagram in linearizability.mdx |
| `page-and-buffer-pool` | `storage-engines` | superseded | Mermaid flowchart in storage-engines.mdx |
| `lsm-levels` | `btree-vs-lsm` | superseded | Mermaid flowchart in btree-vs-lsm.mdx |
| `distributed-sql-architecture` | `distributed-sql` | superseded | Mermaid flowchart TB (SQL layer, coordinator, two Raft ranges across zones, clock service) in distributed-sql.mdx |
| `kafka-cluster` | `kafka-architecture` | superseded | Mermaid flowchart, sequenceDiagram in kafka-architecture.mdx |
| `windows-and-watermarks` | `stream-processing` | superseded | Mermaid sequenceDiagram in stream-processing.mdx |
| `failure-domains` | `failure-modes` | superseded | Mermaid flowchart in failure-modes.mdx |
| `bulkheads-and-cells` | `bulkheads-degradation` | superseded | Mermaid flowchart in bulkheads-degradation.mdx |
| `metrics-pipeline` | `metrics-monitoring` | superseded | Mermaid flowchart in metrics-monitoring.mdx |
| `dr-tiers` | `disaster-recovery` | superseded | reuses registered static diagram rpo-rto-timeline in disaster-recovery.mdx |
| `trust-boundaries` | `security-fundamentals` | superseded | Mermaid flowchart in security-fundamentals.mdx |
| `authz-enforcement-points` | `authorization` | superseded | Mermaid flowchart in authorization.mdx |
| `envelope-encryption` | `encryption` | superseded | Mermaid flowchart in encryption.mdx |
| `dfd-with-boundaries` | `threat-modelling` | superseded | Mermaid flowchart in threat-modelling.mdx |
| `container-vs-vm` | `containers` | superseded | Mermaid flowchart in containers.mdx |
| `kubernetes-objects` | `kubernetes` | superseded | Mermaid flowchart in kubernetes.mdx |
| `multi-region-active-active` | `multi-region` | superseded | Mermaid flowchart in multi-region.mdx |
| `vpc-layout` | `cloud-networking` | superseded | Mermaid flowchart TB (VPC with two zones, public and private subnets, NAT per zone, S3 gateway endpoint) in cloud-networking.mdx |
| `api-gateway-bff` | `api-gateway` | superseded | Mermaid flowchart in api-gateway.mdx |
| `service-mesh-sidecars` | `service-mesh` | superseded | Mermaid flowchart in service-mesh.mdx |
| `serverless-event-flow` | `serverless` | superseded | Mermaid flowchart in serverless.mdx |
| `tenancy-models` | `multi-tenancy` | superseded | Mermaid flowchart LR (token, tenant router, pooled cluster, dedicated database, regional cell, metering) in multi-tenancy.mdx |
| `normalized-vs-denormalized` | `normalization` | superseded | Mermaid flowchart and a comparison table in normalization.mdx (Phase 2 improvement) |
