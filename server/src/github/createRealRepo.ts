import { getOctokit } from "./client.js";
import { mapOctokitError } from "./errors.js";
import { branchProtection } from "../scaffold/loadPolicyFiles.js";
import { buildCatalogInfoYaml } from "../scaffold/simulate.js";
import { env } from "../config/env.js";
import type { ScaffoldRequest, ScaffoldStep } from "../types.js";

type UnorderedStep = Omit<ScaffoldStep, "order">;
type OnStep = (step: UnorderedStep) => void;

export interface RealRepoResult {
  steps: UnorderedStep[];
  repoUrl: string | null;
  failed: boolean;
}

// Orchestrates the real GitHub API calls behind the "real" scaffold path.
// Order matters: create (with auto_init so `main` exists) -> commit the
// catalogue entry -> protect the branch. Protecting before the commit
// would need enforce_admins-bypass semantics to land the commit at all;
// this order avoids relying on that.
//
// `onStep`, if given, fires the instant each step actually completes (not
// buffered until the whole function returns) — this is what lets the
// scaffold route stream genuine progress for the real path: each callback
// here corresponds to a real network round-trip that just finished, not an
// artificially paced UI reveal like the simulated path uses.
export async function createRealRepo(input: ScaffoldRequest, onStep?: OnStep): Promise<RealRepoResult> {
  if (!env.github) {
    throw new Error("createRealRepo() called without GITHUB_PAT configured.");
  }
  const octokit = getOctokit();
  const owner = env.github.owner;
  const { name } = input;
  const visibility = input.visibility ?? "private";
  const steps: UnorderedStep[] = [];
  let repoUrl: string | null = null;

  function pushStep(step: UnorderedStep) {
    steps.push(step);
    onStep?.(step);
  }

  // 1. Availability check — fail before creating anything if it exists.
  try {
    await octokit.repos.get({ owner, repo: name });
    pushStep({
      label: "Create repository",
      command: `POST /user/repos { name: "${name}" }`,
      description: `${owner}/${name} already exists on GitHub. Pick another name.`,
      simulated: false,
      status: "error",
      error: `${owner}/${name} already exists on GitHub.`,
    });
    return { steps, repoUrl, failed: true };
  } catch (err) {
    const mapped = mapOctokitError(err);
    if (mapped.status !== 404) {
      pushStep({
        label: "Create repository",
        command: `GET /repos/${owner}/${name}`,
        description: "Could not check whether the repository name is available on GitHub.",
        simulated: false,
        status: "error",
        error: mapped.message,
      });
      return { steps, repoUrl, failed: true };
    }
    // 404 means the name is free — continue.
  }

  // 2. Create the repository (auto_init guarantees `main` exists before
  // branch protection is applied below).
  try {
    const res = await octokit.repos.createForAuthenticatedUser({
      name,
      private: visibility === "private",
      description: `${input.system} / ${name} — created by IDP`,
      auto_init: true,
    });
    repoUrl = res.data.html_url;
    pushStep({
      label: "Create repository",
      command: `POST /user/repos { name: "${name}", private: ${visibility === "private"} }`,
      description: `Repository created at ${repoUrl}. runtime=${input.runtime} lifecycle=${input.lifecycle}`,
      simulated: false,
      status: "ok",
      url: repoUrl,
    });
  } catch (err) {
    const mapped = mapOctokitError(err);
    pushStep({
      label: "Create repository",
      command: `POST /user/repos { name: "${name}" }`,
      description: "Repository creation failed.",
      simulated: false,
      status: "error",
      error: mapped.message,
    });
    return { steps, repoUrl, failed: true };
  }

  // Team access has no equivalent on a personal account (no Teams API) —
  // shown but explicitly marked not applicable rather than faked as real.
  pushStep({
    label: "Grant team access",
    command: "(not applicable)",
    description:
      "Personal GitHub accounts have no Teams API, so this step doesn't apply here — it's only real when the target is an organization.",
    simulated: true,
    status: "ok",
  });

  // 3. Commit the generated catalogue entry.
  const catalogYaml = buildCatalogInfoYaml(input, owner);
  try {
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo: name,
      path: "catalog-info.yaml",
      message: "Add catalogue entry",
      content: Buffer.from(catalogYaml, "utf-8").toString("base64"),
    });
    pushStep({
      label: "Register in the catalogue",
      command: `PUT /repos/${owner}/${name}/contents/catalog-info.yaml`,
      description: "catalog-info.yaml committed to main. The CI workflow refuses to build without it.",
      simulated: false,
      status: "ok",
      url: `${repoUrl}/blob/main/catalog-info.yaml`,
    });
  } catch (err) {
    const mapped = mapOctokitError(err);
    pushStep({
      label: "Register in the catalogue",
      command: `PUT /repos/${owner}/${name}/contents/catalog-info.yaml`,
      description:
        "The repository was created, but committing catalog-info.yaml failed. Add it manually on GitHub.",
      simulated: false,
      status: "error",
      error: mapped.message,
    });
    return { steps, repoUrl, failed: true };
  }

  // 4. Branch protection, adapted from the real policy file: the CI check
  // names it references don't exist yet on a freshly created repo, so
  // required_status_checks is disabled rather than permanently blocking
  // every merge.
  try {
    await octokit.repos.updateBranchProtection({
      owner,
      repo: name,
      branch: "main",
      required_status_checks: null,
      enforce_admins: branchProtection.enforce_admins ?? false,
      required_pull_request_reviews:
        (branchProtection.required_pull_request_reviews as Record<string, unknown> | undefined) ?? null,
      restrictions: null,
      required_linear_history: branchProtection.required_linear_history ?? true,
    } as Parameters<typeof octokit.repos.updateBranchProtection>[0]);
    pushStep({
      label: "Apply branch protection",
      command: `PUT /repos/${owner}/${name}/branches/main/protection`,
      description:
        "From policy/branch-protection.json (adapted): linear history required, code owner review required, no force-push or deletion. required_status_checks is disabled here — a fresh repo has no CI runs yet to reference.",
      simulated: false,
      status: "ok",
    });
  } catch (err) {
    const mapped = mapOctokitError(err);
    pushStep({
      label: "Apply branch protection",
      command: `PUT /repos/${owner}/${name}/branches/main/protection`,
      description:
        "The repository and catalogue entry were created, but branch protection failed to apply. Apply it manually in Settings → Branches.",
      simulated: false,
      status: "error",
      error: mapped.message,
    });
    return { steps, repoUrl, failed: true };
  }

  return { steps, repoUrl, failed: false };
}
