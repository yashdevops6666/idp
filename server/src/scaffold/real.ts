import { createRealRepo } from "../github/createRealRepo.js";
import { buildCatalogInfoYaml, buildSimulatedTailSteps } from "./simulate.js";
import { env } from "../config/env.js";
import type { ScaffoldRequest, ScaffoldResponse, ScaffoldStep, Service } from "../types.js";

type UnorderedStep = Omit<ScaffoldStep, "order">;
type OnStep = (step: UnorderedStep) => void | Promise<void>;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// `onStep`, if given, fires as each step actually completes — real ones
// (from createRealRepo, genuine network round-trips) fire the instant
// they resolve; the still-simulated tail (environments + OIDC) is paced
// with a short delay each so it doesn't dump all four lines at once,
// consistent with how the pure-simulated path in routes/scaffold.ts paces
// its own (also synthetic) steps.
export async function buildRealScaffoldPlan(input: ScaffoldRequest, onStep?: OnStep): Promise<ScaffoldResponse> {
  if (!env.github) {
    throw new Error("buildRealScaffoldPlan() called without GITHUB_PAT configured.");
  }

  const { steps: realSteps, repoUrl, failed } = await createRealRepo(input, (step) => {
    void onStep?.(step);
  });

  const tailSteps: UnorderedStep[] = [];
  if (!failed) {
    for (const step of buildSimulatedTailSteps(input)) {
      tailSteps.push(step);
      await onStep?.(step);
      await sleep(200);
    }
  }

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
