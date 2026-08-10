import { Router } from "express";
import { addScaffoldedService, getCatalogue } from "../lib/dataStore.js";
import { buildScaffoldPlan } from "../scaffold/simulate.js";
import { SERVICE_NAME_PATTERN_SOURCE, validateServiceName } from "../scaffold/validation.js";
import type { Lifecycle, Runtime, ScaffoldRequest } from "../types.js";

export const scaffoldRouter = Router();

const RUNTIMES: Runtime[] = ["python", "dotnet", "node"];
const LIFECYCLES: Lifecycle[] = ["experimental", "production", "deprecated"];

scaffoldRouter.get("/scaffold/config", (_req, res) => {
  res.json({ namePattern: SERVICE_NAME_PATTERN_SOURCE, runtimes: RUNTIMES, lifecycles: LIFECYCLES });
});

scaffoldRouter.post("/scaffold", (req, res) => {
  const body = req.body as Partial<ScaffoldRequest> | undefined;
  const { name, owner, system, costCentre, runtime, lifecycle } = body ?? {};

  const nameError = validateServiceName(name ?? "");
  if (nameError) {
    res.status(400).json({ error: nameError });
    return;
  }
  if (!owner) {
    res.status(400).json({ error: "Owner is required. Every service needs a team that gets paged." });
    return;
  }
  if (!system) {
    res.status(400).json({ error: "System is required. Which system does this belong to?" });
    return;
  }
  if (!costCentre) {
    res.status(400).json({ error: "Cost centre is required for showback reporting." });
    return;
  }
  if (!runtime || !RUNTIMES.includes(runtime)) {
    res.status(400).json({ error: "Invalid runtime." });
    return;
  }
  if (!lifecycle || !LIFECYCLES.includes(lifecycle)) {
    res.status(400).json({ error: "Invalid lifecycle." });
    return;
  }

  const existing = getCatalogue().find((s) => s.id === name);
  if (existing) {
    res.status(409).json({ error: `${name} already exists in the catalogue. Pick another name.` });
    return;
  }

  const plan = buildScaffoldPlan({ name: name!, owner, system, costCentre, runtime, lifecycle });
  addScaffoldedService(plan.service);
  res.json(plan);
});
