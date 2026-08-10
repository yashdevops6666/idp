import { readFileSync } from "node:fs";
import { repoPath } from "./repoRoot.js";
import type { GoldenPathStop, Guardrail, Metric, Service } from "../types.js";

function loadJson<T>(relativePath: string): T {
  const raw = readFileSync(repoPath(relativePath), "utf-8");
  return JSON.parse(raw) as T;
}

const seedServices = loadJson<Service[]>("data/services.seed.json");
export const goldenPath = loadJson<GoldenPathStop[]>("data/golden-path.json");
export const guardrails = loadJson<Guardrail[]>("data/guardrails.json");
export const metrics = loadJson<Metric[]>("data/metrics.json");

// Services created via the /api/scaffold simulation. In-memory only —
// resets on redeploy/restart, which is documented and acceptable for a
// shared testing demo (no database in scope).
const scaffoldedServices: Service[] = [];

export function getCatalogue(): Service[] {
  return [...seedServices, ...scaffoldedServices];
}

export function addScaffoldedService(service: Service): void {
  scaffoldedServices.push(service);
}
