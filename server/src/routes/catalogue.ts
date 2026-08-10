import { Router } from "express";
import { getCatalogue, goldenPath, guardrails, metrics } from "../lib/dataStore.js";

export const catalogueRouter = Router();

catalogueRouter.get("/catalogue", (_req, res) => {
  res.json(getCatalogue());
});

catalogueRouter.get("/metrics", (_req, res) => {
  res.json(metrics);
});

catalogueRouter.get("/guardrails", (_req, res) => {
  res.json(guardrails);
});

catalogueRouter.get("/golden-path", (_req, res) => {
  res.json(goldenPath);
});
