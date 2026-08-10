import { readFileSync } from "node:fs";
import yaml from "js-yaml";
import { repoPath } from "../lib/repoRoot.js";

// Loaded once at startup and reused by both /api/scaffold (to echo real
// policy content in the simulated step log) and the chat grounding digest
// — one source of truth for "what does prod's policy actually say" rather
// than restating it as prose in multiple places.

interface EnvironmentPolicy {
  wait_timer: number;
  reviewers: { type: string; id: string }[];
  deployment_branch_policy: { protected_branches: boolean; custom_branch_policies: boolean } | null;
}

interface BranchProtectionPolicy {
  required_status_checks?: { strict: boolean; contexts: string[] };
  enforce_admins?: boolean;
  required_pull_request_reviews?: Record<string, unknown>;
  required_linear_history?: boolean;
}

function loadJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(repoPath(relativePath), "utf-8")) as T;
}

export const branchProtection = loadJson<BranchProtectionPolicy>("policy/branch-protection.json");

export const environmentPolicies: Record<"dev" | "uat" | "prod", EnvironmentPolicy> = {
  dev: loadJson<EnvironmentPolicy>("policy/environment-dev.json"),
  uat: loadJson<EnvironmentPolicy>("policy/environment-uat.json"),
  prod: loadJson<EnvironmentPolicy>("policy/environment-prod.json"),
};

export const scaffolderTemplate = yaml.load(
  readFileSync(repoPath("templates/service-template/template.yaml"), "utf-8"),
) as Record<string, unknown>;

export function describeEnvironmentPolicy(env: "dev" | "uat" | "prod"): string {
  const policy = environmentPolicies[env];
  const reviewerCount = policy.reviewers.length;
  const wait = policy.wait_timer;

  if (reviewerCount === 0) {
    return wait > 0 ? `no required reviewers, ${wait} min wait timer` : "no required reviewers, deploys immediately";
  }
  const teamWord = reviewerCount === 1 ? "reviewer team" : "reviewer teams";
  const waitPart = wait > 0 ? `, ${wait} min wait timer` : "";
  return `${reviewerCount} ${teamWord} required${waitPart}`;
}
