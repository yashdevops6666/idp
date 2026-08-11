import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Guardrail } from "../types";
import styles from "./GuardrailsGrid.module.css";

export function GuardrailsGrid() {
  const [guardrails, setGuardrails] = useState<Guardrail[]>([]);

  useEffect(() => {
    api.guardrails().then(setGuardrails).catch(() => setGuardrails([]));
  }, []);

  return (
    <div className={styles.grid}>
      {guardrails.map((g) => (
        <div className={`${styles.guard} glass`} key={g.title}>
          <h3 className={styles.title}>{g.title}</h3>
          <p className={styles.body}>{g.body}</p>
        </div>
      ))}
    </div>
  );
}
