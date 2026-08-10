import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { api } from "../lib/api";
import { ChatPanel } from "./ChatPanel";
import styles from "./Layout.module.css";

export function Layout() {
  const [chatOpen, setChatOpen] = useState(false);

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

      <main>
        <Outlet />
      </main>

      <button
        className={styles.fab}
        onClick={() => setChatOpen((v) => !v)}
        aria-label="Toggle platform copilot"
      >
        {chatOpen ? "×" : "Ask"}
      </button>

      {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}
    </div>
  );
}
