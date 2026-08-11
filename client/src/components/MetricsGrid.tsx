import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Metric } from "../types";
import { useReveal } from "../lib/useReveal";
import { AnimatedValue } from "./effects/AnimatedValue";
import styles from "./MetricsGrid.module.css";

export function MetricsGrid() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const { ref, revealed } = useReveal<HTMLDivElement>();

  useEffect(() => {
    api.metrics().then(setMetrics).catch(() => setMetrics([]));
  }, []);

  return (
    <div className={styles.grid} ref={ref}>
      {metrics.map((m) => (
        <div className={`${styles.metric} glass`} key={m.label}>
          <div className={styles.value}>
            <AnimatedValue value={m.value} start={revealed} />
          </div>
          <div className={styles.label}>{m.label}</div>
          <p className={styles.note}>{m.note}</p>
        </div>
      ))}
    </div>
  );
}
