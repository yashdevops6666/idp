import { readFileSync } from "node:fs";
import { repoPath } from "../lib/repoRoot.js";

// Files the platform copilot is grounded in, ordered by priority. Highest
// priority first: these are what answer the concrete questions this tool
// exists for ("why does prod need 2 approvers", "explain the terraform
// module"). Lower-priority files are trimmed first if the digest ever
// exceeds TOKEN_BUDGET as the repo grows.
const GROUNDING_FILES = [
  // tier 1 — policy + workflow shape, the highest-value grounding content
  "policy/branch-protection.json",
  "policy/environment-dev.json",
  "policy/environment-uat.json",
  "policy/environment-prod.json",
  "modules/terraform/service-baseline/variables.tf",
  "modules/terraform/service-baseline/outputs.tf",
  ".github/workflows/reusable-service-ci.yml",
  ".github/workflows/reusable-terraform.yml",
  // tier 2 — the terraform implementation and the scaffolder form
  "modules/terraform/service-baseline/main.tf",
  "templates/service-template/template.yaml",
  "scripts/new-service.sh",
  // tier 3 — narrative context and the skeleton a team actually receives
  "README.md",
  "catalog/catalog-info.yaml",
  "templates/service-template/skeleton/.github/workflows/ci.yml",
  "templates/service-template/skeleton/infra/main.tf",
  "templates/service-template/skeleton/Dockerfile",
  "templates/service-template/skeleton/catalog-info.yaml",
  "templates/service-template/skeleton/app/main.py",
] as const;

const TOKEN_BUDGET = 12_000;
const CHARS_PER_TOKEN = 4; // rough estimate, good enough for a budget check

function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

interface DigestFile {
  path: string;
  content: string;
}

function loadGroundingFiles(): DigestFile[] {
  const files: DigestFile[] = [];
  for (const relativePath of GROUNDING_FILES) {
    try {
      const content = readFileSync(repoPath(relativePath), "utf-8");
      files.push({ path: relativePath, content });
    } catch {
      // File missing (e.g. removed later) — skip rather than fail startup.
    }
  }
  return files;
}

function renderFile(file: DigestFile): string {
  return `### FILE: ${file.path}\n${file.content.trim()}\n`;
}

export interface Digest {
  text: string;
  tokenEstimate: number;
  fileCount: number;
  includedFiles: string[];
  truncated: boolean;
}

export function buildDigest(): Digest {
  const files = loadGroundingFiles();
  const included: DigestFile[] = [];
  let runningTokens = 0;
  let truncated = false;

  for (const file of files) {
    const rendered = renderFile(file);
    const tokens = estimateTokens(rendered);
    if (runningTokens + tokens > TOKEN_BUDGET) {
      truncated = true;
      break;
    }
    included.push(file);
    runningTokens += tokens;
  }

  const text = included.map(renderFile).join("\n");

  return {
    text,
    tokenEstimate: runningTokens,
    fileCount: included.length,
    includedFiles: included.map((f) => f.path),
    truncated,
  };
}

// Built once at module load and reused for every chat request — the repo
// content is static in the deployed demo, so there's no benefit to
// re-reading files per request.
export const digest = buildDigest();
