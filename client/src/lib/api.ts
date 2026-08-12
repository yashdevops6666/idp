import type {
  ChatMessage,
  ChatMode,
  Guardrail,
  GoldenPathStop,
  Metric,
  ScaffoldConfig,
  ScaffoldRequest,
  ScaffoldResponse,
  ScaffoldStep,
  Service,
} from "../types";

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore non-JSON error bodies
    }
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}

export const api = {
  authStatus: () => request<{ authed: boolean }>("/auth/status"),
  login: (password: string) =>
    request<{ ok: true }>("/auth/login", { method: "POST", body: JSON.stringify({ password }) }),
  logout: () => request<{ ok: true }>("/auth/logout", { method: "POST" }),

  catalogue: () => request<Service[]>("/catalogue"),
  metrics: () => request<Metric[]>("/metrics"),
  guardrails: () => request<Guardrail[]>("/guardrails"),
  goldenPath: () => request<GoldenPathStop[]>("/golden-path"),

  scaffoldConfig: () => request<ScaffoldConfig>("/scaffold/config"),

  // Streams newline-delimited JSON step events as the server produces
  // them (paced for the simulated path, genuinely as-they-happen for the
  // real GitHub path), resolving with the final result once a "done" line
  // arrives. Same fetch-stream-reader shape as chatStream below.
  async scaffoldStream(input: ScaffoldRequest, onStep: (step: ScaffoldStep) => void): Promise<ScaffoldResponse> {
    const res = await fetch("/api/scaffold", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!res.ok || !res.body) {
      let msg = res.statusText;
      try {
        const body = await res.json();
        if (body?.error) msg = body.error;
      } catch {
        // ignore
      }
      throw new ApiError(res.status, msg);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let done = false;
    let result: ScaffoldResponse | null = null;

    while (!done) {
      const chunk = await reader.read();
      done = chunk.done;
      if (chunk.value) buffer += decoder.decode(chunk.value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        if (!line) continue;

        const msg = JSON.parse(line) as
          | { type: "step"; step: ScaffoldStep }
          | { type: "done"; service: Service; catalogInfoYaml: string; mode: "simulated" | "real" }
          | { type: "error"; error: string };

        if (msg.type === "step") {
          onStep(msg.step);
        } else if (msg.type === "done") {
          result = { steps: [], catalogInfoYaml: msg.catalogInfoYaml, service: msg.service, mode: msg.mode };
        } else if (msg.type === "error") {
          throw new ApiError(502, msg.error);
        }
      }
    }

    if (!result) throw new ApiError(502, "The scaffold stream ended unexpectedly.");
    return result;
  },

  async chatStream(
    message: string,
    history: ChatMessage[],
    mode: ChatMode,
    onDelta: (text: string) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history, mode }),
      signal,
    });

    if (!res.ok || !res.body) {
      let msg = "The chatbot is temporarily unavailable.";
      try {
        const body = await res.json();
        if (body?.error) msg = body.error;
      } catch {
        // ignore
      }
      throw new ApiError(res.status, msg);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    while (!done) {
      const chunk = await reader.read();
      done = chunk.done;
      if (chunk.value) onDelta(decoder.decode(chunk.value, { stream: true }));
    }
  },
};

export { ApiError };
