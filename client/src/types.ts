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
  createdVia: "seed" | "scaffold-simulation";
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
}

export interface ScaffoldStep {
  order: number;
  label: string;
  command: string;
  description: string;
  simulated: true;
}

export interface ScaffoldResponse {
  steps: ScaffoldStep[];
  catalogInfoYaml: string;
  service: Service;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  ts: number;
}

export interface ChatRequest {
  message: string;
  history: ChatMessage[];
}
