import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";

export interface SessionData {
  authed?: boolean;
  sid?: string;
}

export type SessionRequest = Request & {
  session?: SessionData | null;
};

export function checkPassword(candidate: string): boolean {
  const expected = Buffer.from(env.sitePassword);
  const given = Buffer.from(candidate ?? "");
  if (expected.length !== given.length) {
    // still run a comparison of equal length to keep timing roughly constant
    crypto.timingSafeEqual(expected, expected);
    return false;
  }
  return crypto.timingSafeEqual(expected, given);
}

export function requireAuth(req: SessionRequest, res: Response, next: NextFunction) {
  if (req.session?.authed === true) {
    next();
    return;
  }
  res.status(401).json({ error: "unauthorized" });
}

// Stamps req.sessionKey from the session's random id, falling back to IP.
// Used to key the per-session daily chat cap in rateLimit.ts.
export function attachSessionKey(
  req: SessionRequest & { sessionKey?: string },
  _res: Response,
  next: NextFunction,
) {
  req.sessionKey = req.session?.sid ?? req.ip;
  next();
}
