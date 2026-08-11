import styles from "./BeforeAfterCompare.module.css";

export function BeforeAfterCompare() {
  return (
    <div className={styles.compare}>
      <div className={`${styles.pane} ${styles.before} glass`}>
        <header>
          <span>azure-pipelines.yml · inherited</span>
          <span className={styles.countBefore}>183 lines</span>
        </header>
        <pre>
          <span className={styles.comment}># copied from whichever repo looked closest,</span>
          {"\n"}
          <span className={styles.comment}># then edited until it went green</span>
          {"\n"}
          {"trigger: [main]\n"}
          {"pool: { name: 'Build-Win-DEV-01' }\n"}
          {"variables:\n"}
          {"  - group: svc-secrets      "}
          <span className={styles.comment}># 11 stored creds</span>
          {"\n"}
          {"steps:\n"}
          {"  - task: UsePythonVersion@0 ...\n"}
          {"  - script: pip install -r req.txt\n"}
          {"  - script: pytest\n"}
          {"  - task: Docker@2 ...\n"}
          {"  - task: AzureCLI@2 ...\n"}
          {"  "}
          <span className={styles.comment}># + 150 more lines, last reviewed 2023</span>
        </pre>
      </div>

      <div className={`${styles.pane} ${styles.after} glass`}>
        <header>
          <span>.github/workflows/ci.yml · golden path</span>
          <span className={styles.countAfter}>12 lines</span>
        </header>
        <pre>
          {"name: CI\n"}
          <span className={styles.keyword}>on</span>
          {": { push: { branches: [main] }, pull_request: }\n\n"}
          <span className={styles.keyword}>jobs</span>
          {":\n  ci:\n    "}
          <span className={styles.keyword}>uses</span>
          {": example-platform/idp/.github/workflows/\n          reusable-service-ci.yml@v1\n    "}
          <span className={styles.keyword}>with</span>
          {":\n      service-name: ${{ github.event.repository.name }}\n      runtime: python\n    "}
          <span className={styles.keyword}>secrets</span>
          {": inherit\n"}
          <span className={styles.comment}># scanning, SBOM and push are inherited</span>
          {"\n"}
          <span className={styles.comment}># credentials: none. OIDC only.</span>
        </pre>
      </div>
    </div>
  );
}
