import { useCallback, useState } from "react";
import { useLiveEvents, type ServiceCreatedEvent } from "../lib/useLiveEvents";
import styles from "./LiveToasts.module.css";

interface Toast {
  id: number;
  text: string;
  mode: "simulated" | "real";
}

let nextId = 1;
const TOAST_LIFETIME_MS = 6000;

// Mounted once in Layout, so a live "service just created" notification
// shows up no matter which page you're on — including when it was someone
// else, in another tab/browser, who triggered it.
export function LiveToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useLiveEvents((event) => {
    if (event.type !== "service.created") return;
    const e = event as ServiceCreatedEvent;
    const id = nextId++;
    const text = `${e.service.name} was just ${e.mode === "real" ? "created on GitHub" : "added (simulated)"}`;
    setToasts((prev) => [...prev, { id, text, mode: e.mode }]);
    setTimeout(() => dismiss(id), TOAST_LIFETIME_MS);
  });

  if (toasts.length === 0) return null;

  return (
    <div className={styles.stack} aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${styles.toast} glass ${t.mode === "real" ? styles.real : ""}`}
          onClick={() => dismiss(t.id)}
        >
          <span className={styles.dot} />
          {t.text}
        </div>
      ))}
    </div>
  );
}
