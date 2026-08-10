import crypto from "node:crypto";
import { Router } from "express";
import { checkPassword, type SessionRequest } from "../middleware/auth.js";
import { loginLimiter } from "../middleware/rateLimit.js";

export const authRouter = Router();

authRouter.post("/auth/login", loginLimiter, (req: SessionRequest, res) => {
  const { password } = req.body ?? {};

  if (typeof password !== "string" || !checkPassword(password)) {
    res.status(401).json({ error: "Incorrect password." });
    return;
  }

  req.session = { authed: true, sid: crypto.randomUUID() };
  res.json({ ok: true });
});

authRouter.post("/auth/logout", (req: SessionRequest, res) => {
  req.session = null;
  res.json({ ok: true });
});

authRouter.get("/auth/status", (req: SessionRequest, res) => {
  res.json({ authed: req.session?.authed === true });
});
