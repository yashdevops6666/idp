import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env.js";

// Single SDK instance, imported only by server-side modules. The API key
// never reaches the client — requests are always proxied through /api/chat.
export const anthropic = new Anthropic({ apiKey: env.anthropicApiKey });
