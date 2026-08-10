import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "../lib/api";
import type { ChatMessage } from "../types";
import styles from "./ChatPanel.module.css";

const MAX_HISTORY_SENT = 8;

export function ChatPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, pending]);

  async function send() {
    const text = input.trim();
    if (!text || pending) return;

    const userMessage: ChatMessage = { role: "user", content: text, ts: Date.now() };
    const historyToSend = messages.slice(-MAX_HISTORY_SENT);
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setError(null);
    setPending(true);

    let assistantText = "";
    setMessages((prev) => [...prev, { role: "assistant", content: "", ts: Date.now() }]);

    try {
      await api.chatStream(text, historyToSend, (delta) => {
        assistantText += delta;
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: assistantText, ts: Date.now() };
          return next;
        });
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "The chatbot is temporarily unavailable.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <div>
          <div className={styles.title}>Platform Copilot</div>
          <div className={styles.subtitle}>Grounded in this repo — Terraform, CI, and policy</div>
        </div>
        <button className={styles.close} onClick={onClose} aria-label="Close chat">
          ×
        </button>
      </header>

      <div className={styles.messages} ref={scrollRef}>
        {messages.length === 0 && (
          <p className={styles.empty}>
            Ask things like &ldquo;why does prod need 2 approvers?&rdquo; or &ldquo;explain
            reusable-terraform.yml&rdquo;.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? styles.userBubble : styles.assistantBubble}>
            {m.content || (pending && i === messages.length - 1 ? "…" : "")}
          </div>
        ))}
        {error && <p className={styles.error}>{error}</p>}
      </div>

      <form
        className={styles.inputRow}
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the platform copilot…"
          disabled={pending}
          autoFocus
        />
        <button className={styles.send} type="submit" disabled={pending || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
