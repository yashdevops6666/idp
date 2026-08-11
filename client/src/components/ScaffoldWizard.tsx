import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import type { Lifecycle, Runtime, ScaffoldResponse } from "../types";
import { SimulationLog } from "./SimulationLog";
import styles from "./ScaffoldWizard.module.css";

const initialForm = {
  name: "",
  owner: "",
  system: "",
  costCentre: "",
  runtime: "python" as Runtime,
  lifecycle: "experimental" as Lifecycle,
};

export function ScaffoldWizard() {
  const [form, setForm] = useState(initialForm);
  const [config, setConfig] = useState<{ runtimes: string[]; lifecycles: string[] } | null>(null);
  const [result, setResult] = useState<ScaffoldResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.scaffoldConfig().then(setConfig).catch(() => setConfig(null));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.scaffold(form);
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setForm(initialForm);
    setResult(null);
    setError(null);
  }

  if (result) {
    return (
      <div>
        <p className={styles.success}>
          <strong>{result.service.name}</strong> is on the golden path (simulated).
        </p>
        <SimulationLog steps={result.steps} />

        <div className={`${styles.yamlPane} glass`}>
          <header>catalog-info.yaml</header>
          <pre>{result.catalogInfoYaml}</pre>
        </div>

        <div className={styles.actions}>
          <Link className={styles.primary} to="/catalogue">
            View in catalogue
          </Link>
          <button className={styles.secondary} onClick={reset}>
            Scaffold another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.grid}>
        <label className={styles.field}>
          <span>Service name</span>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="pricing-feed"
          />
        </label>
        <label className={styles.field}>
          <span>Owning team</span>
          <input
            required
            value={form.owner}
            onChange={(e) => setForm({ ...form, owner: e.target.value })}
            placeholder="team-market-data"
          />
        </label>
        <label className={styles.field}>
          <span>System</span>
          <input
            required
            value={form.system}
            onChange={(e) => setForm({ ...form, system: e.target.value })}
            placeholder="Pricing & Market Data"
          />
        </label>
        <label className={styles.field}>
          <span>Cost centre</span>
          <input
            required
            value={form.costCentre}
            onChange={(e) => setForm({ ...form, costCentre: e.target.value })}
            placeholder="MD-1042"
          />
        </label>
        <label className={styles.field}>
          <span>Runtime</span>
          <select
            value={form.runtime}
            onChange={(e) => setForm({ ...form, runtime: e.target.value as Runtime })}
          >
            {(config?.runtimes ?? ["python", "dotnet", "node"]).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>Lifecycle</span>
          <select
            value={form.lifecycle}
            onChange={(e) => setForm({ ...form, lifecycle: e.target.value as Lifecycle })}
          >
            {(config?.lifecycles ?? ["experimental", "production", "deprecated"]).map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button className={styles.submit} type="submit" disabled={submitting}>
        {submitting ? "Provisioning…" : "Create service"}
      </button>
    </form>
  );
}
