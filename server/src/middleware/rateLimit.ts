import type { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again in a few minutes." },
});

export const chatMinuteLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "You're sending messages too quickly. Wait a moment and try again." },
});

// Coarse per-session daily cap on top of the per-minute limiter above, since
// this chatbot runs on a personal Anthropic key shared across a whole team
// for testing. Resets on redeploy — acceptable for a demo, not a production
// billing control.
const DAILY_LIMIT = 60;
const dailyCounts = new Map<string, { count: number; resetAt: number }>();

type SessionKeyRequest = Request & { sessionKey?: string };

export function chatDailyLimiter(req: SessionKeyRequest, res: Response, next: NextFunction) {
  const key = req.sessionKey ?? req.ip ?? "anonymous";
  const now = Date.now();
  const entry = dailyCounts.get(key);

  if (!entry || entry.resetAt < now) {
    dailyCounts.set(key, { count: 1, resetAt: now + 24 * 60 * 60 * 1000 });
    next();
    return;
  }

  if (entry.count >= DAILY_LIMIT) {
    res.status(429).json({ error: "Daily chat limit reached for this session. Try again tomorrow." });
    return;
  }

  entry.count += 1;
  next();
}
