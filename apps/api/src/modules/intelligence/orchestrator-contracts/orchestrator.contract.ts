/**
 * Boundary contract — how the Intelligence Platform will talk to the Tool
 * Orchestrator (ADR-001).
 *
 * Reasoning plans; the orchestrator *acts* (booking, payment, notification).
 * This contract keeps that separation injectable before the orchestrator
 * exists, and bakes in governance v1.1's audit shape: every AI action logs
 * `{principal, action, resource, result, userApproval}` — the fields are the
 * request/result types, so an unaudited invocation cannot be expressed.
 */
import type { EntityId, IsoDateTime } from "../core";
import type { ToolId, ToolManifest } from "./tool.manifest";

/** Who is acting. The AI is a first-class, least-privilege RBAC principal (ADR-001). */
export type ToolPrincipal = "gurman-ai" | "user" | "system";

/** One requested action against a platform tool. */
export interface ToolInvocationRequest {
  readonly principal: ToolPrincipal;
  /** The tool being invoked; its manifest declares permissions, timeout, retry, cost. */
  readonly toolId: ToolId;
  /** Namespaced operation within the tool, e.g. `booking.create`, `notification.schedule`. */
  readonly action: string;
  /** The entity acted upon, when one exists. */
  readonly resource: EntityId | null;
  /** Tool-specific parameters; concrete tools narrow this in their own contracts. */
  readonly parameters: Readonly<Record<string, unknown>>;
  /** Whether the user explicitly approved this action (AI Bible: confirm before booking). */
  readonly userApproval: boolean;
  readonly requestedAt: IsoDateTime;
}

/** The audited outcome of an invocation. */
export interface ToolInvocationResult {
  readonly status: "succeeded" | "denied" | "failed";
  readonly resource: EntityId | null;
  /** Id of the audit-log entry — every invocation produces one, by contract. */
  readonly auditId: EntityId;
  readonly completedAt: IsoDateTime;
}

/**
 * The orchestrator as the reasoning layer will inject it. Manifest-based
 * (patch C): tools are discovered and feasibility-checked through their
 * manifests before anything is invoked — a capability whose required tools
 * are `unavailable` degrades at plan time, not mid-booking.
 */
export interface ToolOrchestratorContract {
  invoke(request: ToolInvocationRequest): Promise<ToolInvocationResult>;
  manifest(toolId: ToolId): Promise<ToolManifest | null>;
  manifests(): Promise<readonly ToolManifest[]>;
}
