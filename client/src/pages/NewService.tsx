import { ScaffoldWizard } from "../components/ScaffoldWizard";

export function NewService() {
  return (
    <section className="section wrap">
      <span className="eyebrow">Self-service</span>
      <h2>Scaffold a new service on the golden path.</h2>
      <p className="lede">
        This mirrors <code>scripts/new-service.sh</code>: repo creation, team access, branch
        protection, per-environment approval gates, workload identity federation, and a catalogue
        entry. It runs entirely as a simulation here — no GitHub org or Azure subscription is
        touched.
      </p>
      <ScaffoldWizard />
    </section>
  );
}
