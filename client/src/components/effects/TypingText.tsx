import { useEffect, useState } from "react";
import styles from "./TypingText.module.css";

const TYPE_MS = 55;
const DELETE_MS = 28;
const HOLD_MS = 1800;

// Cycles through `phrases`, typing then deleting each one. Respects
// prefers-reduced-motion by just showing the first phrase statically.
export function TypingText({ phrases, className }: { phrases: string[]; className?: string }) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const reduceMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (reduceMotion) {
      setText(phrases[0] ?? "");
      return;
    }

    const current = phrases[phraseIndex % phrases.length];
    let timeout: ReturnType<typeof setTimeout>;

    if (!deleting && text.length < current.length) {
      timeout = setTimeout(() => setText(current.slice(0, text.length + 1)), TYPE_MS);
    } else if (!deleting && text.length === current.length) {
      timeout = setTimeout(() => setDeleting(true), HOLD_MS);
    } else if (deleting && text.length > 0) {
      timeout = setTimeout(() => setText(current.slice(0, text.length - 1)), DELETE_MS);
    } else {
      setDeleting(false);
      setPhraseIndex((i) => (i + 1) % phrases.length);
    }

    return () => clearTimeout(timeout);
  }, [text, deleting, phraseIndex, phrases, reduceMotion]);

  return (
    <span className={className}>
      <span className={styles.typed}>{text}</span>
      {!reduceMotion && <span className={styles.cursor} aria-hidden="true" />}
    </span>
  );
}
