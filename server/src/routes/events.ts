import { Router } from "express";
import { addClient, removeClient } from "../lib/eventBus.js";

export const eventsRouter = Router();

// Server-Sent Events stream for cross-client live updates — currently just
// "service.created" (fired from routes/scaffold.ts on successful
// simulated or real scaffolding). Plain GET + EventSource on the client,
// unlike /api/chat which needed a hand-rolled fetch-stream reader because
// EventSource can't POST.
eventsRouter.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  res.write(": connected\n\n");

  const id = addClient(res);

  // Keeps the connection alive through proxies that close idle streams.
  // ": " lines are SSE comments, ignored by EventSource's message handler.
  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 25_000);

  req.on("close", () => {
    clearInterval(heartbeat);
    removeClient(id);
  });
});
