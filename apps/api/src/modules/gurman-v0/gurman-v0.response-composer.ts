import { Inject, Injectable } from "@nestjs/common";
import { GURMAN_LLM, type GurmanLlm } from "../gurman/gurman.llm";
import { GurmanUnavailableError } from "../gurman/gurman.provider";
import type { GurmanV0Decision, GurmanV0Response } from "./gurman-v0.types";

export const GURMAN_V0_PROMPT_VERSION = "gurman-v0-natural-language-v1";

@Injectable()
export class GurmanV0ResponseComposer {
  constructor(@Inject(GURMAN_LLM) private readonly provider: GurmanLlm) {}

  async compose(decision: GurmanV0Decision, locale: "uz" | "ru" | "en"): Promise<GurmanV0Response> {
    if (decision.status === "insufficientData") {
      return { decision, response: "", available: false };
    }

    const structured = JSON.stringify({
      selected: decision.selectedPlan?.name ?? null,
      alternatives: decision.alternatives.map((item) => item.name),
      reasonCodes: decision.reasonCodes,
      limitedResults: decision.limitedResults
    });
    const system = `Prompt version: ${GURMAN_V0_PROMPT_VERSION}. Translate the supplied structured recommendation into natural ${locale}. Do not rank, select, score, add facts, prices, or businesses.`;
    try {
      const response = await this.provider.complete(system, structured);
      return { decision, response, available: true };
    } catch (error) {
      if (error instanceof GurmanUnavailableError) {
        return { decision, response: "", available: false };
      }
      throw error;
    }
  }
}
