import { useEffect, useRef } from "react";
import type { Service } from "../types";

export interface ServiceCreatedEvent {
  type: "service.created";
  service: Service;
  mode: "simulated" | "real";
}

type LiveEvent = ServiceCreatedEvent;

// Subscribes to /api/events (SSE) for the lifetime of the component.
// EventSource handles reconnect on its own on transient network drops —
// no manual retry logic needed here.
export function useLiveEvents(onEvent: (event: LiveEvent) => void) {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    const source = new EventSource("/api/events");
    source.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data) as LiveEvent;
        handlerRef.current(parsed);
      } catch {
        // ignore malformed/comment frames
      }
    };
    return () => source.close();
  }, []);
}
