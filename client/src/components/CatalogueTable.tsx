import { useMemo, useState } from "react";
import type { Service } from "../types";
import { StatusPill } from "./StatusPill";
import styles from "./CatalogueTable.module.css";

type SortKey = "name" | "owner" | "system" | "status";

export function CatalogueTable({ services }: { services: Service[] }) {
  const [filter, setFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const rows = q
      ? services.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.owner.toLowerCase().includes(q) ||
            s.system.toLowerCase().includes(q),
        )
      : services;
    return [...rows].sort((a, b) => String(a[sortKey]).localeCompare(String(b[sortKey])));
  }, [services, filter, sortKey]);

  return (
    <div>
      <div className={styles.controls}>
        <input
          className={styles.filter}
          placeholder="Filter by service, owner, or system…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <select
          className={styles.sort}
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
        >
          <option value="name">Sort: Service</option>
          <option value="owner">Sort: Owner</option>
          <option value="system">Sort: System</option>
          <option value="status">Sort: Status</option>
        </select>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Service</th>
            <th>Owner</th>
            <th>System</th>
            <th>Path</th>
            <th>Last deploy</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((s) => (
            <tr key={s.id}>
              <td className={styles.svc}>
                {s.repoUrl ? (
                  <a href={s.repoUrl} target="_blank" rel="noreferrer">
                    {s.name}
                  </a>
                ) : (
                  s.name
                )}
              </td>
              <td className={styles.team}>{s.owner}</td>
              <td className={styles.team}>{s.system}</td>
              <td>
                <StatusPill status={s.status} />
              </td>
              <td className={styles.team}>{s.lastDeploy}</td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={5} className={styles.emptyRow}>
                No services match &ldquo;{filter}&rdquo;.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
