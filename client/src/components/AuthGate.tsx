import { useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import styles from "./AuthGate.module.css";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    api
      .authStatus()
      .then((r) => setAuthed(r.authed))
      .catch(() => setAuthed(false));
  }, []);

  if (authed === null) {
    return <div className={styles.loading}>Loading…</div>;
  }

  if (!authed) {
    return <PasswordGate onSuccess={() => setAuthed(true)} />;
  }

  return <>{children}</>;
}

function PasswordGate({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.login(password);
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.gate}>
      <form className={`${styles.card} glass`} onSubmit={handleSubmit}>
        <span className="eyebrow">Platform Engineering</span>
        <h1 className={styles.title}>
          This is a shared demo. <em>Enter the access password to continue.</em>
        </h1>
        <input
          className={styles.input}
          type="password"
          autoFocus
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className={styles.error}>{error}</p>}
        <button className={styles.button} type="submit" disabled={submitting || !password}>
          {submitting ? "Checking…" : "Enter"}
        </button>
        <p className={styles.note}>
          A single shared password gates this demo for the team testing it — not a real account
          system.
        </p>
      </form>
    </div>
  );
}
