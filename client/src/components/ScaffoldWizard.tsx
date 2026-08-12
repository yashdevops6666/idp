import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import type { Lifecycle, Runtime, ScaffoldConfig, ScaffoldStep, Service } from "../types";
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

interface FinalResult {
  service: Service;
  catalogInfoYaml: string;
  mode: "simulated" | "real";
}

export function ScaffoldWizard() {
  const [form, setForm] = useState(initialForm);
  const [config, setConfig] = useState<ScaffoldConfig | null>(null);
  const [liveSteps, setLiveSteps] = useState<ScaffoldStep[]>([]);
  const [result, setResult] = useState<FinalResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Real-creation is a genuinely destructive path (creates a repo on a
  // real GitHub account) — off by default on every load, no persistence.
  const [real, setReal] = useState(false);
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [confirmName, setConfirmName] = useState("");

  useEffect(() => {
    api.scaffoldConfig().then(setConfig).catch(() => setConfig(null));
  }, []);

  const realReady = !real || (confirmName.trim() === form.name.trim() && form.name.trim().length > 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);
    setLiveSteps([]);
    try {
      const res = await api.scaffoldStream({ ...form, real, visibility }, (step) => {
        setLiveSteps((prev) => [...prev, step]);
      });
      setResult({ service: res.service, catalogInfoYaml: res.catalogInfoYaml, mode: res.mode });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setForm(initialForm);
    setResult(null);
    setLiveSteps([]);
    setError(null);
    setReal(false);
    setConfirmName("");
  }

  // Live-streaming view: the request is in flight, steps are arriving one
  // at a time. Shown instead of the form until it either finishes (result)
  // or fails (error, back to the form).
  if (submitting || (liveSteps.length > 0 && !result && !error)) {
    return (
      <div>
        <p className={styles.success}>
          <span className={styles.liveDot} />
          {real ? "Creating on GitHub…" : "Provisioning (simulated)…"}
        </p>
        <SimulationLog steps={liveSteps} />
      </div>
    );
  }

  if (result) {
    const isReal = result.mode === "real";
    return (
      <div>
        <p className={styles.success}>
          {isReal ? (
            <>
              <strong>{result.service.name}</strong> was created for real on GitHub.
            </>
          ) : (
            <>
              <strong>{result.service.name}</strong> is on the golden path (simulated).
            </>
          )}
        </p>
        <SimulationLog steps={liveSteps} />

        <div className={`${styles.yamlPane} glass`}>
          <header>catalog-info.yaml</header>
          <pre>{result.catalogInfoYaml}</pre>
        </div>

        <div className={styles.actions}>
          {isReal && result.service.repoUrl && (
            <a className={styles.primary} href={result.service.repoUrl} target="_blank" rel="noreferrer">
              View the real repo →
            </a>
          )}
          <Link className={isReal ? styles.secondary : styles.primary} to="/catalogue">
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
            placeholder="notification-worker"
          />
        </label>
        <label className={styles.field}>
          <span>Owning team</span>
          <input
            required
            value={form.owner}
            onChange={(e) => setForm({ ...form, owner: e.target.value })}
            placeholder="team-platform"
          />
        </label>
        <label className={styles.field}>
          <span>System</span>
          <input
            required
            value={form.system}
            onChange={(e) => setForm({ ...form, system: e.target.value })}
            placeholder="Core Platform"
          />
        </label>
        <label className={styles.field}>
          <span>Cost centre</span>
          <input
            required
            value={form.costCentre}
            onChange={(e) => setForm({ ...form, costCentre: e.target.value })}
            placeholder="PLAT-1001"
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

      {config?.githubConfigured && (
        <div className={`${styles.realBox} glass`}>
          <label className={styles.realToggle}>
            <input
              type="checkbox"
              checked={real}
              onChange={(e) => {
                setReal(e.target.checked);
                setConfirmName("");
              }}
            />
            <span>
              Create a <strong>REAL</strong> repository on GitHub (under{" "}
              <code>{config.githubOwner}</code>)
            </span>
          </label>

          {real && (
            <div className={styles.realDetails}>
              <p className={styles.realWarning}>
                This creates a real repository at{" "}
                <code>
                  github.com/{config.githubOwner}/{form.name || "…"}
                </code>
                . Branch protection will really be applied. This can&apos;t be undone from this UI —
                delete it manually on GitHub if needed.
              </p>

              <div className={styles.visibilityRow}>
                <label>
                  <input
                    type="radio"
                    name="visibility"
                    checked={visibility === "private"}
                    onChange={() => setVisibility("private")}
                  />
                  Private
                </label>
                <label>
                  <input
                    type="radio"
                    name="visibility"
                    checked={visibility === "public"}
                    onChange={() => setVisibility("public")}
                  />
                  Public
                </label>
              </div>

              <label className={styles.field}>
                <span>Type the service name to confirm</span>
                <input
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  placeholder={form.name || "service name"}
                />
              </label>
            </div>
          )}
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}

      <button className={styles.submit} type="submit" disabled={submitting || !realReady}>
        {submitting ? "Provisioning…" : real ? "Create real service" : "Create service"}
      </button>
    </form>
  );
}
