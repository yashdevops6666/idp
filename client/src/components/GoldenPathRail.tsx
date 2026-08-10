import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { GoldenPathStop } from "../types";
import styles from "./GoldenPathRail.module.css";

export function GoldenPathRail() {
  const [stops, setStops] = useState<GoldenPathStop[]>([]);

  useEffect(() => {
    api.goldenPath().then(setStops).catch(() => setStops([]));
  }, []);

  if (stops.length === 0) return null;

  return (
    <section className={styles.block}>
      <div className="wrap">
        <div className={styles.head}>
          <span className="eyebrow">The golden path</span>
          <span className={styles.total}>
            measured median, 40 services · <b>{stops[stops.length - 1]?.t}</b> to first green deploy
          </span>
        </div>

        <div className={styles.rail}>
          {stops.map((stop) => (
            <div className={styles.stop} key={stop.id} style={{ ["--i" as string]: stop.order }}>
              <div className={styles.dot} />
              <div className={styles.name}>{stop.name}</div>
              <p className={styles.what}>{stop.what}</p>
              <span className={styles.t}>{stop.t}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
