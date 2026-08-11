// Canonical API contract. Hand-copied into client/src/types.ts and
// server/src/types.ts (no shared workspace package — the type surface is
// small enough that a third workspace would be more ceremony than value).
// Keep the three copies in sync when this changes.

export type Runtime = "python" | "dotnet" | "node";
export type Lifecycle = "experimental" | "production" | "deprecated";
export type ServiceStatus = "golden-path" | "migrating" | "off-path";

export interface Service {
  id: string;
  name: string;
  owner: string;
  system: string;
  status: ServiceStatus;
  lastDeploy: string;
  runtime: Runtime;
  lifecycle: Lifecycle;
  costCentre?: string;
  createdVia: "seed" | "scaffold-simulation" | "scaffold-real";
  repoUrl?: string;
}

export interface GoldenPathStop {
  id: string;
  order: number;
  name: string;
  what: string;
  t: string;
}

export interface Guardrail {
  title: string;
  body: string;
}

export interface Metric {
  value: string;
  label: string;
  note: string;
}

export interface ScaffoldRequest {
  name: string;
  owner: string;
  system: string;
  costCentre: string;
  runtime: Runtime;
  lifecycle: Lifecycle;
  // When true and the server has GITHUB_PAT configured, this creates a
  // REAL repository under the configured GitHub account instead of only
  // simulating the provisioning steps.
  real?: boolean;
  visibility?: "private" | "public";
}

export interface ScaffoldStep {
  order: number;
  label: string;
  command: string;
  description: string;
  simulated: boolean;
  status: "ok" | "error";
  error?: string;
  url?: string;
}

export interface ScaffoldResponse {
  steps: ScaffoldStep[];
  catalogInfoYaml: string;
  service: Service;
  mode: "simulated" | "real";
}

export interface ScaffoldConfig {
  namePattern: string;
  runtimes: Runtime[];
  lifecycles: Lifecycle[];
  githubConfigured: boolean;
  githubOwner: string | null;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  ts: number;
}

// "platform" grounds every answer in this repo's own files and declines
// what isn't covered. "general" is plain Claude — no repo grounding, same
// underlying model and the same cost/rate limits since it's still the same
// API key.
export type ChatMode = "platform" | "general";

export interface ChatRequest {
  message: string;
  history: ChatMessage[];
  mode: ChatMode;
}
