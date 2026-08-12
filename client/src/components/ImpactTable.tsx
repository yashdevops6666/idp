import styles from "./ImpactTable.module.css";

const PROCEDURES = [
  { name: "Add/update app configurations (e.g. env variables)", freq: "5%", dev: "1h", ops: "1h" },
  { name: "Add services and dependencies", freq: "1%", dev: "16h", ops: "8h" },
  { name: "Add/update resources", freq: "0.38%", dev: "8h", ops: "24h" },
  { name: "Refactor & document architecture", freq: "0.28%", dev: "40h", ops: "8h" },
  { name: "Waiting due to blocked environment", freq: "0.5%", dev: "15h", ops: "0h" },
  { name: "Spinning up environment", freq: "0.33%", dev: "24h", ops: "24h" },
  { name: "Onboarding devs, retrain & swap teams", freq: "1%", dev: "80h", ops: "16h" },
  { name: "Roll back failed deployment", freq: "1.75%", dev: "10h", ops: "20h" },
  { name: "Debugging, error tracing", freq: "4.40%", dev: "10h", ops: "10h" },
  { name: "Waiting for other teams", freq: "6.30%", dev: "16h", ops: "16h" },
];

export function ImpactTable() {
  return (
    <div className={`${styles.tableCard} glass`}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Procedure</th>
            <th>Frequency</th>
            <th>Dev time</th>
            <th>Ops time</th>
          </tr>
        </thead>
        <tbody>
          {PROCEDURES.map((p) => (
            <tr key={p.name} className={styles.row}>
              <td className={styles.name}>{p.name}</td>
              <td className={styles.num}>{p.freq}</td>
              <td className={styles.num}>{p.dev}</td>
              <td className={styles.num}>{p.ops}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
