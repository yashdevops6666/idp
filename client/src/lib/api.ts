import type {
  ChatMessage,
  Guardrail,
  GoldenPathStop,
  Metric,
  ScaffoldRequest,
  ScaffoldResponse,
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

  scaffoldConfig: () =>
    request<{ namePattern: string; runtimes: string[]; lifecycles: string[] }>("/scaffold/config"),
  scaffold: (input: ScaffoldRequest) =>
    request<ScaffoldResponse>("/scaffold", { method: "POST", body: JSON.stringify(input) }),

  async chatStream(
    message: string,
    history: ChatMessage[],
    onDelta: (text: string) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history }),
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
