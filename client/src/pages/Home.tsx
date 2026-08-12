import { GoldenPathRail } from "../components/GoldenPathRail";
import { BeforeAfterCompare } from "../components/BeforeAfterCompare";
import { CoreComponentsGrid } from "../components/CoreComponentsGrid";
import { ImpactTable } from "../components/ImpactTable";
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

      <Reveal>
        <section className="section wrap">
          <span className="eyebrow">Why bother</span>
          <h2>The cost isn't the platform. It's not having one.</h2>
          <p className="lede">
            IDPs enable developer self-service while keeping cognitive load low — enhancing
            productivity, improving developer experience, and reducing manual ops, cost and
            maintenance overhead. On an organizational level, they drive standardization by
            design and establish a clear separation of concerns: platform teams set the
            standards, developers follow golden paths.
          </p>
          <blockquote className={styles.tldr}>
            <strong>TL;DR</strong>
            IDPs enforce standardization by design, increase developer productivity and improve
            developer experience — with a measurable effect on core DevOps metrics like mean
            time to recovery (MTTR) and change failure rate. For application developers, IDPs
            drive deployment frequency and reduce lead time.
          </blockquote>
          <p className="lede">
            The biggest impact is the hardest one to put in a chart: self-service and
            ownership. Developers take a service from idea to production without ever
            involving operations, which pushes responsibility for configuration, deployment
            and rollback onto the team that actually owns the service — and frees them to
            experiment, since spinning up a workload to try something no longer means filing
            a ticket. Below is a rough model of where that time goes without a platform,
            adapted from a framework originally published by Humanitec: hours spent per 100
            deployments on procedures that a golden path either automates or removes entirely.
          </p>
          <ImpactTable />
          <p className={styles.impactNote}>
            Estimates per 100 deployments — the exact numbers depend on your organization, but
            the shape holds across most engineering orgs: the majority of the wasted time is
            waiting on someone else, not doing the work itself.
          </p>
        </section>
      </Reveal>

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
