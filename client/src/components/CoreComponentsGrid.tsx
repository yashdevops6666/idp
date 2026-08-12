import styles from "./CoreComponentsGrid.module.css";

const CORE_COMPONENTS = [
  {
    title: "Application Configuration Management",
    body: "Manage application configuration — environment variables, secrets, feature flags — in a dynamic, scalable and reliable way.",
  },
  {
    title: "Infrastructure Orchestration",
    body: "Orchestrate infrastructure in a dynamic and intelligent way depending on context, instead of a static Terraform module per team.",
  },
  {
    title: "Environment Management",
    body: "Let developers create new, fully provisioned environments whenever they need one — not whenever ops has time.",
  },
  {
    title: "Deployment Management",
    body: "A real delivery pipeline for Continuous Delivery or Continuous Deployment, not a shared script someone maintains from memory.",
  },
  {
    title: "Role-Based Access Control",
    body: "Manage who can do what — across services, environments and infrastructure — in a way that scales past a spreadsheet.",
  },
];

export function CoreComponentsGrid() {
  return (
    <div className={styles.grid}>
      {CORE_COMPONENTS.map((c, i) => (
        <div className={`${styles.card} glass`} key={c.title}>
          <span className={styles.index}>{String(i + 1).padStart(2, "0")}</span>
          <h3 className={styles.title}>{c.title}</h3>
          <p className={styles.body}>{c.body}</p>
        </div>
      ))}
    </div>
  );
}
