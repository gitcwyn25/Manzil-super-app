import type { Confidence, EntityId } from "../intelligence/core";
import type { Explanation, ExplanationFactor } from "../intelligence/explanation-engine";

export type GurmanV0Intent = {
  category?: string;
  budget?: number;
  radius?: number;
  groupSize?: number;
  occasion?: string;
  latitude?: number;
  longitude?: number;
  limit?: number;
};

export type V0ReasonCode =
  | "budget_match"
  | "close_to_user"
  | "highly_rated_for_segment"
  | "capability_match"
  | "over_budget"
  | "category_mismatch"
  | "outside_radius"
  | "insufficientData";

export type V0Reason = {
  readonly code: V0ReasonCode;
  readonly scoreContribution: number;
};

export type V0Candidate = {
  readonly businessId: EntityId;
  readonly slug: string;
  readonly name: string;
  readonly score: number;
  readonly reasonCodes: readonly V0Reason[];
  readonly explanation: Explanation;
};

export type GurmanV0Decision = {
  readonly decisionId: EntityId;
  readonly intent: GurmanV0Intent;
  readonly candidatePlans: readonly V0Candidate[];
  readonly selectedPlan: V0Candidate | null;
  readonly alternatives: readonly V0Candidate[];
  readonly reasonCodes: readonly V0Reason[];
  readonly confidence: Confidence;
  readonly explanation: {
    readonly whySelected: ExplanationFactor[];
    readonly whyRejected: Array<{ businessId: EntityId; reasonCodes: V0Reason[] }>;
    readonly missingInformation: string[];
  };
  readonly status: "ok" | "insufficientData";
  readonly limitedResults: boolean;
};

export type GurmanV0Response = {
  readonly decision: GurmanV0Decision;
  readonly response: string;
  readonly available: boolean;
};
