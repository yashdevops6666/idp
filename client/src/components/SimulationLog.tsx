import type { ScaffoldStep } from "../types";
import styles from "./SimulationLog.module.css";

export function SimulationLog({ steps }: { steps: ScaffoldStep[] }) {
  const hasReal = steps.some((s) => !s.simulated);

  return (
    <ol className={`${styles.log} glass`}>
      {steps.map((step) => (
        <li key={step.order} className={styles.step}>
          <div className={styles.stepHead}>
            <span className={step.status === "error" ? styles.errorBadge : styles.ok}>
              {step.status === "error" ? "error" : "ok"}
            </span>
            <span className={step.simulated ? styles.simBadge : styles.realBadge}>
              {step.simulated ? "simulated" : "real"}
            </span>
            <span className={styles.label}>{step.label}</span>
          </div>
          <code className={styles.command}>{step.command}</code>
          <p className={step.status === "error" ? styles.errorText : styles.description}>
            {step.status === "error" ? step.error : step.description}
          </p>
          {step.url && (
            <a className={styles.stepLink} href={step.url} target="_blank" rel="noreferrer">
              {step.url}
            </a>
          )}
        </li>
      ))}
      <li className={styles.disclaimer}>
        {hasReal
          ? "Steps marked REAL made actual GitHub API calls against a real account. Steps marked SIMULATED did not — no Azure subscription is available to make those real."
          : "Every step above is simulated — no GitHub org or Azure subscription was touched."}
      </li>
    </ol>
  );
}
