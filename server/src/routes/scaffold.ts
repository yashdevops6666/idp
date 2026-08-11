import { Router } from "express";
import { addScaffoldedService, getCatalogue } from "../lib/dataStore.js";
import { buildScaffoldPlan } from "../scaffold/simulate.js";
import { buildRealScaffoldPlan } from "../scaffold/real.js";
import { SERVICE_NAME_PATTERN_SOURCE, validateServiceName } from "../scaffold/validation.js";
import { env } from "../config/env.js";
import { attachSessionKey } from "../middleware/auth.js";
import { scaffoldRealLimiter } from "../middleware/rateLimit.js";
import type { Lifecycle, Runtime, ScaffoldConfig, ScaffoldRequest } from "../types.js";

export const scaffoldRouter = Router();

const RUNTIMES: Runtime[] = ["python", "dotnet", "node"];
const LIFECYCLES: Lifecycle[] = ["experimental", "production", "deprecated"];

scaffoldRouter.get("/scaffold/config", (_req, res) => {
  const config: ScaffoldConfig = {
    namePattern: SERVICE_NAME_PATTERN_SOURCE,
    runtimes: RUNTIMES,
    lifecycles: LIFECYCLES,
    githubConfigured: env.github !== null,
    githubOwner: env.github?.owner ?? null,
  };
  res.json(config);
});

scaffoldRouter.post("/scaffold", attachSessionKey, scaffoldRealLimiter, async (req, res) => {
  const body = req.body as Partial<ScaffoldRequest> | undefined;
  const { name, owner, system, costCentre, runtime, lifecycle, real, visibility } = body ?? {};

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
  if (real && !env.github) {
    res.status(400).json({ error: "Real GitHub creation isn't configured on this server." });
    return;
  }

  const existing = getCatalogue().find((s) => s.id === name);
  if (existing) {
    res.status(409).json({ error: `${name} already exists in the catalogue. Pick another name.` });
    return;
  }

  const input: ScaffoldRequest = {
    name: name!,
    owner,
    system,
    costCentre,
    runtime,
    lifecycle,
    visibility: visibility === "public" ? "public" : "private",
  };

  try {
    const plan = real ? await buildRealScaffoldPlan(input) : buildScaffoldPlan(input);
    addScaffoldedService(plan.service);
    res.json(plan);
  } catch (err) {
    console.error("[scaffold] real creation failed unexpectedly", err);
    res.status(502).json({ error: "Real repo creation failed unexpectedly. Nothing was added to the catalogue." });
  }
});
