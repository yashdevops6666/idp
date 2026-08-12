import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Service } from "../types";
import { CatalogueTable } from "../components/CatalogueTable";
import { useLiveEvents } from "../lib/useLiveEvents";

export function Catalogue() {
  const [services, setServices] = useState<Service[] | null>(null);
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    api.catalogue().then(setServices).catch(() => setServices([]));
  }, []);

  useLiveEvents((event) => {
    if (event.type !== "service.created") return;
    setServices((prev) => {
      if (!prev) return prev;
      if (prev.some((s) => s.id === event.service.id)) return prev; // already have it (e.g. we created it ourselves)
      return [event.service, ...prev];
    });
    setLiveCount((n) => n + 1);
  });

  return (
    <section className="section wrap">
      <span className="eyebrow">Catalogue</span>
      <h2>Every service has a name, an owner and a path.</h2>
      <p className="lede">
        A service that is not in the catalogue is a service nobody can page. The CI workflow
        fails without a valid entry, which is the cheapest guardrail in the platform.
        {liveCount > 0 && (
          <>
            {" "}
            <strong>
              {liveCount} new service{liveCount === 1 ? "" : "s"} arrived live while you were here.
            </strong>
          </>
        )}
      </p>

      {services === null ? (
        <p className="lede">Loading catalogue…</p>
      ) : (
        <CatalogueTable services={services} />
      )}
    </section>
  );
}
