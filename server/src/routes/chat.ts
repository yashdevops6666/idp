import { Router } from "express";
import { anthropic } from "../lib/anthropicClient.js";
import { env } from "../config/env.js";
import { digest } from "../grounding/buildDigest.js";
import { attachSessionKey } from "../middleware/auth.js";
import { chatDailyLimiter, chatMinuteLimiter } from "../middleware/rateLimit.js";
import type { ChatMessage, ChatMode, ChatRequest } from "../types.js";

export const chatRouter = Router();

const PLATFORM_SYSTEM_PROMPT = `You are the Platform Copilot for this Internal Developer Platform (IDP) demo. You help developers with questions about the golden path: the self-service scaffolder, the reusable CI/CD workflows, the Terraform baseline module, and the branch/environment protection policies.

Ground every answer in the actual repository content provided below (delimited by "### FILE: <path>" markers) rather than general knowledge about DevOps or Terraform. When a question is about "why" something is configured a certain way, cite the specific file and value (e.g. "policy/environment-prod.json requires 2 reviewer teams and a 5 minute wait_timer"). If something isn't covered by the provided files, say so plainly rather than guessing.

Keep answers concise and practical — this is a sidebar assistant, not a long-form document. Use short paragraphs or a few bullet points, not headers.

Repository content follows:`;

const CHAT_MODES: ChatMode[] = ["platform", "general"];

// "platform" gets the repo digest as a cached system block; "general" gets
// no system prompt at all — plain Claude, same as talking to the model
// directly, not narrowed to this repo. Same model and same rate limits
// either way, since both run on the same API key.
function buildSystemParam(mode: ChatMode) {
  if (mode === "general") return undefined;
  return [
    {
      type: "text" as const,
      text: `${PLATFORM_SYSTEM_PROMPT}\n\n${digest.text}`,
      cache_control: { type: "ephemeral" as const },
    },
  ];
}

const MAX_MESSAGE_LENGTH = 4000;
const MAX_HISTORY_LENGTH = 8;
// A prior assistant reply can legitimately be as long as env.chatMaxTokens
// allows (up to ~4-5 chars/token for English/markdown/code). This must stay
// generous relative to that budget — a cap smaller than what the model is
// actually allowed to generate causes ordinary long answers to make the
// *next* request fail history validation outright.
const MAX_HISTORY_MESSAGE_LENGTH = env.chatMaxTokens * 8;

function isValidHistory(history: unknown): history is ChatMessage[] {
  if (!Array.isArray(history) || history.length > MAX_HISTORY_LENGTH) return false;
  return history.every(
    (m) =>
      m &&
      (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string" &&
      m.content.length <= MAX_HISTORY_MESSAGE_LENGTH,
  );
}

chatRouter.post(
  "/chat",
  attachSessionKey,
  chatMinuteLimiter,
  chatDailyLimiter,
  async (req, res) => {
    const body = req.body as Partial<ChatRequest> | undefined;
    const message = body?.message;
    const history = body?.history ?? [];
    const mode = body?.mode;

    if (typeof message !== "string" || message.trim().length === 0 || message.length > MAX_MESSAGE_LENGTH) {
      res.status(400).json({ error: "Invalid message." });
      return;
    }
    if (!isValidHistory(history)) {
      res.status(400).json({ error: "Invalid conversation history." });
      return;
    }
    if (!mode || !CHAT_MODES.includes(mode)) {
      res.status(400).json({ error: "Invalid mode." });
      return;
    }

    // Guards against writing/ending the response twice (once from the
    // stream's own "error" event, once from the outer catch below) — doing
    // so throws ERR_STREAM_WRITE_AFTER_END, which as an unhandled rejection
    // takes the whole process down under Node's default "throw" policy.
    let responseEnded = false;
    const safeWrite = (text: string) => {
      if (responseEnded) return;
      res.write(text);
    };
    const safeEnd = (text?: string) => {
      if (responseEnded) return;
      responseEnded = true;
      res.end(text);
    };

    try {
      const stream = anthropic.messages.stream({
        model: env.chatModel,
        max_tokens: env.chatMaxTokens,
        system: buildSystemParam(mode),
        messages: [
          ...history.map((m) => ({ role: m.role, content: m.content })),
          { role: "user" as const, content: message },
        ],
      });

      stream.on("text", (delta) => {
        safeWrite(delta);
      });

      stream.on("error", (err) => {
        console.error("[chat] stream error", err);
        safeEnd("\n\n[The assistant hit an error mid-response. Please try again.]");
      });

      try {
        await stream.finalMessage();
      } catch {
        // Already reported via the "error" listener above; nothing further
        // to do here beyond letting safeEnd's guard prevent a double-end.
      }
      safeEnd();
    } catch (err) {
      console.error("[chat] request failed", err);
      if (!res.headersSent) {
        res.status(502).json({ error: "The chatbot is temporarily unavailable." });
      } else {
        safeEnd("\n\n[The assistant is temporarily unavailable. Please try again shortly.]");
      }
    }
  },
);
