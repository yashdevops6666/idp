import type { ServiceStatus } from "../types";

const LABELS: Record<ServiceStatus, { text: string; cls: "ok" | "warn" | "off" }> = {
  "golden-path": { text: "Golden path", cls: "ok" },
  migrating: { text: "Migrating", cls: "warn" },
  "off-path": { text: "Off path", cls: "off" },
};

export function StatusPill({ status }: { status: ServiceStatus }) {
  const { text, cls } = LABELS[status];
  return <span className={`pill ${cls}`}>{text}</span>;
}
