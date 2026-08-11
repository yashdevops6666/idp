import { createRealRepo } from "../github/createRealRepo.js";
import { buildCatalogInfoYaml, buildSimulatedTailSteps } from "./simulate.js";
import { env } from "../config/env.js";
import type { ScaffoldRequest, ScaffoldResponse, ScaffoldStep, Service } from "../types.js";

export async function buildRealScaffoldPlan(input: ScaffoldRequest): Promise<ScaffoldResponse> {
  if (!env.github) {
    throw new Error("buildRealScaffoldPlan() called without GITHUB_PAT configured.");
  }

  const { steps: realSteps, repoUrl, failed } = await createRealRepo(input);

  // Only append the still-simulated tail (environments + OIDC) if the real
  // steps actually succeeded — if repo creation itself failed, there's
  // nothing meaningful to configure environments on top of.
  const tailSteps = failed ? [] : buildSimulatedTailSteps(input);
  const allSteps: ScaffoldStep[] = [...realSteps, ...tailSteps].map((s, i) => ({ ...s, order: i }));

  const service: Service = {
    id: input.name,
    name: input.name,
    owner: input.owner,
    system: input.system,
    status: failed ? "off-path" : "golden-path",
    lastDeploy: failed ? "never" : "just now",
    runtime: input.runtime,
    lifecycle: input.lifecycle,
    costCentre: input.costCentre,
    createdVia: "scaffold-real",
    repoUrl: repoUrl ?? undefined,
  };

  return {
    steps: allSteps,
    catalogInfoYaml: buildCatalogInfoYaml(input, env.github.owner),
    service,
    mode: "real",
  };
}
