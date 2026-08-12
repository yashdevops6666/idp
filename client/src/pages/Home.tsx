import { GoldenPathRail } from "../components/GoldenPathRail";
import { BeforeAfterCompare } from "../components/BeforeAfterCompare";
import { CoreComponentsGrid } from "../components/CoreComponentsGrid";
import { GuardrailsGrid } from "../components/GuardrailsGrid";
import { Reveal } from "../components/effects/Reveal";
import { TypingText } from "../components/effects/TypingText";
import styles from "./Home.module.css";

const TAGLINES = [
  "golden-path CI in 12 lines",
  "OIDC — zero stored credentials",
  "branch protection applied, not requested",
  "reviewed plan = applied plan",
];

export function Home() {
  return (
    <>
      <header className={styles.masthead}>
        <div className="wrap">
          <span className="eyebrow">Platform Engineering — Internal Developer Platform</span>
          <p className={styles.typingLine}>
            <TypingText phrases={TAGLINES} />
          </p>
          <h1 className={styles.h1}>
            From nothing to a running service in{" "}
            <em className="glitch" data-text="four minutes">
              four minutes
            </em>
            .
          </h1>
          <p className={styles.lede}>
            The paved road for services on this platform. You bring the code and the name of the
            team that gets paged. The platform brings the pipeline, the infrastructure, the
            scanning, the approvals and the alerting — and keeps bringing them, without you
            maintaining any of it.
          </p>
        </div>
      </header>

      <GoldenPathRail />

      <Reveal>
        <section className="section wrap">
          <span className="eyebrow">What a team actually maintains</span>
          <h2>The pipeline is a dependency, not a copy.</h2>
          <p className="lede">
            When the platform adds a scan or rotates a registry, every consuming repo picks it up
            on the next run — instead of forty pull requests and a spreadsheet.
          </p>
          <BeforeAfterCompare />
        </section>
      </Reveal>

      <Reveal>
        <section className="section wrap">
          <span className="eyebrow">The platform, broken down</span>
          <h2>Every IDP is built from five parts.</h2>
          <p className="lede">
            Application configuration, infrastructure, environments, deployments and
            access control — glued together so developers get self-service without the
            cognitive load of owning each piece themselves. This is what this platform
            covers end to end.
          </p>
          <CoreComponentsGrid />
        </section>
      </Reveal>

      <Reveal>
        <section className="section wrap">
          <span className="eyebrow">Guardrails</span>
          <h2>Enforced by default, not by review board.</h2>
          <GuardrailsGrid />
        </section>
      </Reveal>

      <footer className={`${styles.footer} wrap`}>
        Platform Engineering · Release &amp; Environments
        <br />
        Demonstration build — synthetic service data, no proprietary systems involved.
      </footer>
    </>
  );
}
