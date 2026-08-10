import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Service } from "../types";
import { CatalogueTable } from "../components/CatalogueTable";

export function Catalogue() {
  const [services, setServices] = useState<Service[] | null>(null);

  useEffect(() => {
    api.catalogue().then(setServices).catch(() => setServices([]));
  }, []);

  return (
    <section className="section wrap">
      <span className="eyebrow">Catalogue</span>
      <h2>Every service has a name, an owner and a path.</h2>
      <p className="lede">
        A service that is not in the catalogue is a service nobody can page. The CI workflow
        fails without a valid entry, which is the cheapest guardrail in the platform.
      </p>

      {services === null ? (
        <p className="lede">Loading catalogue…</p>
      ) : (
        <CatalogueTable services={services} />
      )}
    </section>
  );
}
