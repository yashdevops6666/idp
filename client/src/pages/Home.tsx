import { GoldenPathRail } from "../components/GoldenPathRail";
import { BeforeAfterCompare } from "../components/BeforeAfterCompare";
import { MetricsGrid } from "../components/MetricsGrid";
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
          <span className="eyebrow">What we measure</span>
          <h2>Adoption is the only score that counts.</h2>
          <p className="lede">
            A platform nobody uses is a platform that failed, however good the engineering was.
            These are the four numbers reviewed monthly with engineering leads — and the reason
            the golden path has to stay genuinely easier than rolling your own.
          </p>
          <MetricsGrid />
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
