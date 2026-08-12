import { Router } from "express";
import { addScaffoldedService, getCatalogue } from "../lib/dataStore.js";
import { broadcast } from "../lib/eventBus.js";
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
const SIMULATED_STEP_PACING_MS = 220;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

// Streams newline-delimited JSON ({"type":"step",...} lines, then one
// {"type":"done",...} or {"type":"error",...}) instead of one big JSON
// response — same fetch-stream-reader pattern the client already uses for
// /api/chat. The real path's steps are genuinely paced by real GitHub API
// round-trips (via createRealRepo's onStep callback); the simulated path
// has no real async work to wait on, so it's paced artificially at a
// fixed interval purely for UI readability — steps arriving all at once
// are harder to read than steps arriving one at a time.
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

  res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  let ended = false;
  const write = (obj: unknown) => {
    if (ended) return;
    res.write(`${JSON.stringify(obj)}\n`);
  };
  const finish = () => {
    if (ended) return;
    ended = true;
    res.end();
  };

  try {
    let order = 0;

    if (real) {
      const plan = await buildRealScaffoldPlan(input, (step) => {
        write({ type: "step", step: { ...step, order: order++ } });
      });
      addScaffoldedService(plan.service);
      broadcast({ type: "service.created", service: plan.service, mode: plan.mode });
      write({ type: "done", service: plan.service, catalogInfoYaml: plan.catalogInfoYaml, mode: plan.mode });
    } else {
      const plan = buildScaffoldPlan(input);
      for (const step of plan.steps) {
        write({ type: "step", step });
        await sleep(SIMULATED_STEP_PACING_MS);
      }
      addScaffoldedService(plan.service);
      broadcast({ type: "service.created", service: plan.service, mode: plan.mode });
      write({ type: "done", service: plan.service, catalogInfoYaml: plan.catalogInfoYaml, mode: plan.mode });
    }

    finish();
  } catch (err) {
    console.error("[scaffold] failed", err);
    write({ type: "error", error: "Something went wrong creating the service. Nothing was added to the catalogue." });
    finish();
  }
});
