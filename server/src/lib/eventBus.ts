import type { Response } from "express";

// Minimal in-memory SSE pub/sub for cross-client live updates (e.g. "a new
// service was just scaffolded"). No message queue/Redis — this is a single
// Node process for a demo, so an in-memory Map of open response streams is
// enough. Clients reconnect automatically (EventSource does this natively)
// so losing this state on redeploy is a non-issue.

interface Client {
  id: number;
  res: Response;
}

let nextId = 1;
const clients = new Map<number, Client>();

export function addClient(res: Response): number {
  const id = nextId++;
  clients.set(id, { id, res });
  return id;
}

export function removeClient(id: number): void {
  clients.delete(id);
}

export function broadcast(event: Record<string, unknown>): void {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const { res } of clients.values()) {
    res.write(payload);
  }
}

export function clientCount(): number {
  return clients.size;
}
