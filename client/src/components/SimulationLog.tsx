import type { ScaffoldStep } from "../types";
import styles from "./SimulationLog.module.css";

export function SimulationLog({ steps }: { steps: ScaffoldStep[] }) {
  return (
    <ol className={styles.log}>
      {steps.map((step) => (
        <li key={step.order} className={styles.step}>
          <div className={styles.stepHead}>
            <span className={styles.ok}>ok</span>
            <span className={styles.label}>{step.label}</span>
          </div>
          <code className={styles.command}>{step.command}</code>
          <p className={styles.description}>{step.description}</p>
        </li>
      ))}
      <li className={styles.disclaimer}>
        Every step above is simulated — no GitHub org or Azure subscription was touched.
      </li>
    </ol>
  );
}
