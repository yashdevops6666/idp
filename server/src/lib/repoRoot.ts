import path from "node:path";
import { fileURLToPath } from "node:url";

// This file lives at server/src/lib/repoRoot.ts (dev, via tsx) or
// server/dist/lib/repoRoot.js (prod, after tsc build) — both are three
// directories below the repo root (server/{src,dist}/lib), so the same
// relative walk-up resolves correctly in both cases.
const here = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(here, "../../..");

export function repoPath(...segments: string[]): string {
  return path.join(repoRoot, ...segments);
}
