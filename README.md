# idp — a working Internal Developer Platform

A demonstration platform: golden path CI, self-service scaffolding, a Terraform
baseline, guardrails applied at creation, and a portal that shows who owns what.

The premise is that an IDP is a **product**, and developers are the customers.
So the measure of it is not what was built — it is whether teams choose the
paved road because it is genuinely easier than rolling their own.

---

## The shape of it

```
 developer                        platform (this repo)             cloud
 ─────────                        ────────────────────             ─────
 idp new-service ────────────▶  scripts/new-service.sh
 or the portal form              templates/service-template/
                                          │
                                          ▼
                                 repo created + protected
                                 environments + approvers
                                 OIDC federation
                                 catalogue entry
                                          │
 git push ──────────────────▶  .github/workflows/
                                 reusable-service-ci.yml  ──┐
                                 reusable-terraform.yml     │  OIDC, no secrets
                                          │                 ▼
                                 modules/terraform/    ──▶  Azure
                                 service-baseline           identity · vault
                                                            logs · runtime
                                                            baseline alert
```

## Contents

| Path | What it is |
|---|---|
| `.github/workflows/reusable-service-ci.yml` | The golden path build. Catalogue check, test, CodeQL, CVE gate, SBOM, signed image. Consumed, not copied. |
| `.github/workflows/reusable-terraform.yml` | Plan on the PR, apply the reviewed plan on merge, environment gates before prod. |
| `modules/terraform/service-baseline/` | One module call for a compliant Azure footprint: workload identity, Key Vault, Log Analytics, container runtime, baseline alert. |
| `templates/service-template/` | What a team's repo looks like: 12 lines of CI, 15 lines of Terraform, health probes wired to the platform's probes. |
| `templates/service-template/template.yaml` | Backstage scaffolder form — the same journey as the CLI, for people who prefer not to use a terminal. |
| `scripts/new-service.sh` | The self-service entry point. `--dry-run` prints every call without making one. |
| `policy/` | Branch protection and environment rules, applied by the scaffolder at creation. |
| `portal/index.html` | The catalogue and adoption view. Open it in a browser. |

## Try it

```bash
# See the whole provisioning journey without touching GitHub or Azure
./scripts/new-service.sh \
  --name pricing-feed \
  --owner team-market-data \
  --system aladdin-data \
  --cost-centre EQ-4471 \
  --dry-run

# The portal
open portal/index.html
```

The scaffolder validates before it acts. A half-created service is worse than
no service — it looks provisioned but nothing owns it.

## Design decisions worth arguing about

**Reusable workflows, not templates that get copied.** A copied pipeline is a
fork the day it lands. Calling `uses:` against a pinned tag means a change to
scanning or registry policy reaches every repo on the next run, rather than
becoming forty pull requests and a spreadsheet.

**Guardrails, not gates.** Branch protection and environment approvals are
applied at creation by the platform. Nothing stops a team leaving the golden
path — it just appears in the catalogue as off-path with its owner's name next
to it. Visibility does more work than enforcement.

**No stored cloud credentials.** OIDC federation, scoped per environment, so a
dev run cannot reach production even if someone edits the workflow.

**The catalogue entry is a build gate.** A service nobody can page is the most
common failure in a large estate, and it costs almost nothing to prevent.

**The reviewed plan is the applied plan.** Applying a freshly generated plan
means the thing approved and the thing that ran are not the same thing.

## What this deliberately does not do

Progressive delivery, cost anomaly detection, ephemeral preview environments,
and a Backstage TechDocs pipeline are all natural next increments. They are out
of scope here because an IDP that tries to launch complete usually launches
unadopted — the first release should do one journey properly.

---

Synthetic data throughout. No proprietary configuration from any employer.
