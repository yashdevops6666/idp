import { describeEnvironmentPolicy } from "./loadPolicyFiles.js";
import type { ScaffoldRequest, ScaffoldResponse, ScaffoldStep, Service } from "../types.js";

// Mirrors scripts/new-service.sh's exact step order. Every step is a
// simulation only — no gh/az CLI calls are ever made from this web app.
const ORG = "example-platform";
const TEMPLATE_REPO = "idp-service-template";

function buildSteps(input: ScaffoldRequest): ScaffoldStep[] {
  const { name, owner, system, runtime, lifecycle } = input;
  let order = 0;
  const step = (label: string, command: string, description: string): ScaffoldStep => ({
    order: order++,
    label,
    command,
    description,
    simulated: true,
  });

  const steps: ScaffoldStep[] = [
    step(
      "Create repository",
      `gh repo create ${ORG}/${name} --template ${ORG}/${TEMPLATE_REPO} --private --clone`,
      `Repository created from the golden-path template. runtime=${runtime} lifecycle=${lifecycle}`,
    ),
    step(
      "Grant team access",
      `gh api -X PUT orgs/${ORG}/teams/${owner}/repos/${ORG}/${name} -f permission=push`,
      `${owner} granted push access; platform-engineering granted admin.`,
    ),
    step(
      "Apply branch protection",
      `gh api -X PUT repos/${ORG}/${name}/branches/main/protection --input policy/branch-protection.json`,
      `From policy/branch-protection.json: linear history required, code owner review required, no force-push or deletion.`,
    ),
    step(
      "Configure environment: dev",
      `gh api -X PUT repos/${ORG}/${name}/environments/dev --input policy/environment-dev.json`,
      `From policy/environment-dev.json: ${describeEnvironmentPolicy("dev")}.`,
    ),
    step(
      "Configure environment: uat",
      `gh api -X PUT repos/${ORG}/${name}/environments/uat --input policy/environment-uat.json`,
      `From policy/environment-uat.json: ${describeEnvironmentPolicy("uat")}.`,
    ),
    step(
      "Configure environment: prod",
      `gh api -X PUT repos/${ORG}/${name}/environments/prod --input policy/environment-prod.json`,
      `From policy/environment-prod.json: ${describeEnvironmentPolicy("prod")}.`,
    ),
    step(
      "Federate workload identity",
      `az identity federated-credential create --name fic-${name}-{env} --subject repo:${ORG}/${name}:environment:{env}`,
      "One federated credential per environment (dev/uat/prod) — no stored cloud credentials, ever.",
    ),
    step(
      "Register in the catalogue",
      "git add catalog-info.yaml && git commit -m 'Add catalogue entry' && git push",
      "catalog-info.yaml committed to the new repo. The CI workflow refuses to build without it.",
    ),
  ];

  return steps;
}

function buildCatalogInfoYaml(input: ScaffoldRequest): string {
  return `apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: ${input.name}
  description: TODO — one line on what this service does and who consumes it
  annotations:
    github.com/project-slug: ${ORG}/${input.name}
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
  };
}
