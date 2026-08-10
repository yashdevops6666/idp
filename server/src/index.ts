import path from "node:path";
import express from "express";
import cookieSession from "cookie-session";
import { env, isProduction } from "./config/env.js";
import { repoRoot } from "./lib/repoRoot.js";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { catalogueRouter } from "./routes/catalogue.js";
import { scaffoldRouter } from "./routes/scaffold.js";
import { chatRouter } from "./routes/chat.js";
import { requireAuth } from "./middleware/auth.js";
import { digest } from "./grounding/buildDigest.js";

// Defense in depth: a single unexpected rejection in a request handler
// (e.g. a third-party client library edge case) should log, not take down
// every other in-flight session on a server shared by a whole team.
process.on("unhandledRejection", (err) => {
  console.error("[unhandledRejection]", err);
});

const app = express();

// Railway sits behind a reverse proxy; trust it for accurate req.ip
// (used by the rate limiters and the chat daily-cap fallback key).
app.set("trust proxy", 1);

// 128kb comfortably covers a full 8-message chat history at the chat
// route's per-message cap (which itself scales with CHAT_MAX_TOKENS) plus
// JSON escaping overhead; every other route's payloads are tiny by comparison.
app.use(express.json({ limit: "128kb" }));
app.use(
  cookieSession({
    name: "idp_session",
    secret: env.cookieSecret,
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  }),
);

const api = express.Router();
api.use(healthRouter);
api.use(authRouter);
api.use(requireAuth, catalogueRouter);
api.use(requireAuth, scaffoldRouter);
api.use(requireAuth, chatRouter);
app.use("/api", api);

if (isProduction) {
  const clientDist = path.join(repoRoot, "client", "dist");
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.listen(env.port, () => {
  console.log(`[server] listening on :${env.port} (${env.nodeEnv})`);
  console.log(
    `[grounding] ${digest.fileCount} files, ~${digest.tokenEstimate} tokens${digest.truncated ? " (truncated to budget)" : ""}`,
  );
});
