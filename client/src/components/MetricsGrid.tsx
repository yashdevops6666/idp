import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Metric } from "../types";
import styles from "./MetricsGrid.module.css";

export function MetricsGrid() {
  const [metrics, setMetrics] = useState<Metric[]>([]);

  useEffect(() => {
    api.metrics().then(setMetrics).catch(() => setMetrics([]));
  }, []);

  return (
    <div className={styles.grid}>
      {metrics.map((m) => (
        <div className={styles.metric} key={m.label}>
          <div className={styles.value}>{m.value}</div>
          <div className={styles.label}>{m.label}</div>
          <p className={styles.note}>{m.note}</p>
        </div>
      ))}
    </div>
  );
}
