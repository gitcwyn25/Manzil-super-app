// Query API — the uniform node contract and the fifteen entity kinds
export * from "./knowledge-graph.entity";
export * from "./knowledge-graph.entities";
// Query API — graph reads (mutations arrive as core/jobs, announced as Events)
export * from "./knowledge-graph.provider";
// Query API — graph identity, traversal contracts, validation (Epic 04)
export * from "./knowledge-graph.ids";
export * from "./knowledge-graph.traversal";
export * from "./knowledge-graph.validation";
// Query API — the edge vocabulary this layer adds to the open registry
export * from "./knowledge-graph.relationships";
// Query API — the relational projection, as pure functions
export * from "./knowledge-graph.projection";
// Implementations (Epic 04) — bound by token via KNOWLEDGE_GRAPH_PROVIDERS
export * from "./knowledge-graph.tokens";
export * from "./graph-projection.repository";
export * from "./graph-relationship.store";
export * from "./graph-cache.service";
export * from "./graph-entity.service";
export * from "./graph-relationship.service";
export * from "./graph-traversal.service";
export * from "./knowledge-graph.service";
// Command API — the only two ways graph knowledge changes (doc 23 §5)
export * from "./knowledge-graph.jobs";
export * from "./knowledge-graph.providers";
