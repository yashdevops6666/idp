import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { api } from "../lib/api";
import { ChatPanel } from "./ChatPanel";
import { LiveToasts } from "./LiveToasts";
import type { ChatMode } from "../types";
import styles from "./Layout.module.css";

export function Layout() {
  const [openMode, setOpenMode] = useState<ChatMode | null>(null);

  function toggle(mode: ChatMode) {
    setOpenMode((current) => (current === mode ? null : mode));
  }

  return (
    <div className={styles.shell}>
      <nav className={`${styles.nav} wrap`}>
        <span className={styles.brand}>Platform</span>
        <div className={styles.links}>
          <NavLink to="/" end className={({ isActive }) => (isActive ? styles.active : undefined)}>
            Home
          </NavLink>
          <NavLink to="/catalogue" className={({ isActive }) => (isActive ? styles.active : undefined)}>
            Catalogue
          </NavLink>
          <NavLink to="/new-service" className={({ isActive }) => (isActive ? styles.active : undefined)}>
            New service
          </NavLink>
        </div>
        <button
          className={styles.logout}
          onClick={() => api.logout().then(() => window.location.reload())}
        >
          Sign out
        </button>
      </nav>

      <LiveToasts />

      <main>
        <Outlet />
      </main>

      <button
        className={styles.fab}
        onClick={() => toggle("platform")}
        aria-pressed={openMode === "platform"}
        aria-label="Toggle Platform Copilot (grounded in this repo)"
        title="Platform Copilot — grounded in this repo"
      >
        {openMode === "platform" ? "×" : "Ask"}
      </button>

      <button
        className={`${styles.fab} ${styles.fabGeneral}`}
        onClick={() => toggle("general")}
        aria-pressed={openMode === "general"}
        aria-label="Toggle general Claude assistant"
        title="Claude — general assistant, not limited to this repo"
      >
        {openMode === "general" ? "×" : "AI"}
      </button>

      {openMode && <ChatPanel mode={openMode} onClose={() => setOpenMode(null)} />}
    </div>
  );
}
