import { describeEnvironmentPolicy } from "./loadPolicyFiles.js";
import type { ScaffoldRequest, ScaffoldResponse, ScaffoldStep, Service } from "../types.js";

// Mirrors scripts/new-service.sh's step order for the pure-simulation path.
// No gh/az CLI calls are ever made from this function — see scaffold/real.ts
// for the path that does make real GitHub API calls.
export const ORG = "example-platform";
const TEMPLATE_REPO = "idp-service-template";

type UnorderedStep = Omit<ScaffoldStep, "order">;

function withOrder(steps: UnorderedStep[], startOrder = 0): ScaffoldStep[] {
  return steps.map((s, i) => ({ ...s, order: startOrder + i }));
}

// Shared by both the pure-simulation path (below) and the real path
// (scaffold/real.ts) — GitHub Environments and Azure OIDC federation stay
// simulated in both, since there's no Azure account to make them real.
export function buildSimulatedTailSteps(input: ScaffoldRequest): UnorderedStep[] {
  const { name } = input;
  return [
    {
      label: "Configure environment: dev",
      command: `gh api -X PUT repos/{org}/${name}/environments/dev --input policy/environment-dev.json`,
      description: `From policy/environment-dev.json: ${describeEnvironmentPolicy("dev")}.`,
      simulated: true,
      status: "ok",
    },
    {
      label: "Configure environment: uat",
      command: `gh api -X PUT repos/{org}/${name}/environments/uat --input policy/environment-uat.json`,
      description: `From policy/environment-uat.json: ${describeEnvironmentPolicy("uat")}.`,
      simulated: true,
      status: "ok",
    },
    {
      label: "Configure environment: prod",
      command: `gh api -X PUT repos/{org}/${name}/environments/prod --input policy/environment-prod.json`,
      description: `From policy/environment-prod.json: ${describeEnvironmentPolicy("prod")}.`,
      simulated: true,
      status: "ok",
    },
    {
      label: "Federate workload identity",
      command: `az identity federated-credential create --name fic-${name}-{env} --subject repo:{org}/${name}:environment:{env}`,
      description:
        "One federated credential per environment (dev/uat/prod) — no stored cloud credentials, ever. Simulated: no Azure subscription is available to make this real.",
      simulated: true,
      status: "ok",
    },
  ];
}

function buildSteps(input: ScaffoldRequest): ScaffoldStep[] {
  const { name, owner, runtime, lifecycle } = input;

  const steps: UnorderedStep[] = [
    {
      label: "Create repository",
      command: `gh repo create ${ORG}/${name} --template ${ORG}/${TEMPLATE_REPO} --private --clone`,
      description: `Repository created from the golden-path template. runtime=${runtime} lifecycle=${lifecycle}`,
      simulated: true,
      status: "ok",
    },
    {
      label: "Grant team access",
      command: `gh api -X PUT orgs/${ORG}/teams/${owner}/repos/${ORG}/${name} -f permission=push`,
      description: `${owner} granted push access; platform-engineering granted admin.`,
      simulated: true,
      status: "ok",
    },
    {
      label: "Apply branch protection",
      command: `gh api -X PUT repos/${ORG}/${name}/branches/main/protection --input policy/branch-protection.json`,
      description:
        "From policy/branch-protection.json: linear history required, code owner review required, no force-push or deletion.",
      simulated: true,
      status: "ok",
    },
    ...buildSimulatedTailSteps(input),
    {
      label: "Register in the catalogue",
      command: "git add catalog-info.yaml && git commit -m 'Add catalogue entry' && git push",
      description: "catalog-info.yaml committed to the new repo. The CI workflow refuses to build without it.",
      simulated: true,
      status: "ok",
    },
  ];

  return withOrder(steps);
}

export function buildCatalogInfoYaml(input: ScaffoldRequest, org: string = ORG): string {
  return `apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: ${input.name}
  description: TODO — one line on what this service does and who consumes it
  annotations:
    github.com/project-slug: ${org}/${input.name}
    backstage.io/techdocs-ref: dir:.
spec:
  type: service
  owner: ${input.owner}
  system: ${input.system}
  lifecycle: ${input.lifecycle}
`;
}

export function buildScaffoldPlan(input: ScaffoldRequest): ScaffoldResponse {
  const service: Service = {
    id: input.name,
    name: input.name,
    owner: input.owner,
    system: input.system,
    status: "golden-path",
    lastDeploy: "just now",
    runtime: input.runtime,
    lifecycle: input.lifecycle,
    costCentre: input.costCentre,
    createdVia: "scaffold-simulation",
    repoUrl: `https://github.com/${ORG}/${input.name}`,
  };

  return {
    steps: buildSteps(input),
    catalogInfoYaml: buildCatalogInfoYaml(input),
    service,
    mode: "simulated",
  };
}
