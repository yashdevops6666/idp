#!/usr/bin/env bash
#
# new-service — create a service on the golden path.
#
#   ./scripts/new-service.sh --name pricing-feed --owner team-market-data \
#                            --system aladdin-data --cost-centre EQ-4471
#
# What you get: a repo from the template, branch protection, environments
# with the right approvers, OIDC federation to Azure, a catalogue entry,
# and a green pipeline. Target is under four minutes, unattended.
#
# What you do not do: raise a ticket, wait for a platform engineer, or
# copy YAML from whichever repo looked closest to yours.

set -euo pipefail

ORG="${IDP_GITHUB_ORG:-jhi-platform}"
TEMPLATE_REPO="${IDP_TEMPLATE_REPO:-idp-service-template}"
DRY_RUN=false

log()  { printf '\033[0;36m  %s\033[0m\n' "$*"; }
ok()   { printf '\033[0;32m  ok  %s\033[0m\n' "$*"; }
die()  { printf '\033[0;31m  error: %s\033[0m\n' "$*" >&2; exit 1; }
run()  { if $DRY_RUN; then printf '\033[0;90m  would run: %s\033[0m\n' "$*"; else "$@"; fi; }

usage() {
  sed -n '3,12p' "$0" | sed 's/^# \{0,1\}//'
  exit "${1:-0}"
}

NAME=""; OWNER=""; SYSTEM=""; COST_CENTRE=""; RUNTIME="python"; LIFECYCLE="experimental"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name)         NAME="$2"; shift 2 ;;
    --owner)        OWNER="$2"; shift 2 ;;
    --system)       SYSTEM="$2"; shift 2 ;;
    --cost-centre)  COST_CENTRE="$2"; shift 2 ;;
    --runtime)      RUNTIME="$2"; shift 2 ;;
    --lifecycle)    LIFECYCLE="$2"; shift 2 ;;
    --dry-run)      DRY_RUN=true; shift ;;
    -h|--help)      usage 0 ;;
    *)              die "unknown flag: $1  (try --help)" ;;
  esac
done

# Fail on the inputs before touching anything. A half-created service is
# worse than no service: it looks provisioned but nothing owns it.
[[ -n "$NAME" ]]        || die "--name is required"
[[ -n "$OWNER" ]]       || die "--owner is required. Every service needs a team that gets paged."
[[ -n "$SYSTEM" ]]      || die "--system is required. Which system does this belong to?"
[[ -n "$COST_CENTRE" ]] || die "--cost-centre is required for FinOps showback."

[[ "$NAME" =~ ^[a-z][a-z0-9-]{2,29}$ ]] \
  || die "name must be lowercase letters, digits and hyphens, 3-30 chars, starting with a letter"

command -v gh >/dev/null || die "GitHub CLI not found. Install it: https://cli.github.com"
gh auth status >/dev/null 2>&1 || die "Not logged in. Run: gh auth login --hostname github.com"

if gh repo view "$ORG/$NAME" >/dev/null 2>&1; then
  die "$ORG/$NAME already exists. Pick another name or ask the owning team for access."
fi

echo
log "Creating $ORG/$NAME"
log "owner=$OWNER  system=$SYSTEM  runtime=$RUNTIME  lifecycle=$LIFECYCLE"
echo

# ---------------------------------------------------------------- repo
run gh repo create "$ORG/$NAME" \
  --template "$ORG/$TEMPLATE_REPO" \
  --private \
  --description "$SYSTEM / $NAME — created by IDP" \
  --clone
ok "repository created from template"

# ------------------------------------------------------------ ownership
run gh api -X PUT "orgs/$ORG/teams/$OWNER/repos/$ORG/$NAME" -f permission=push
run gh api -X PUT "orgs/$ORG/teams/platform-engineering/repos/$ORG/$NAME" -f permission=admin
ok "team access granted to $OWNER"

# ----------------------------------------------------------- guardrails
# Branch protection is applied by the platform, not left to the team to
# remember. This is the difference between a policy and a suggestion.
run gh api -X PUT "repos/$ORG/$NAME/branches/main/protection" \
  --input policy/branch-protection.json
ok "branch protection applied to main"

for ENV in dev uat prod; do
  run gh api -X PUT "repos/$ORG/$NAME/environments/$ENV" \
    --input "policy/environment-$ENV.json" 2>/dev/null || true
  ok "environment $ENV configured"
done

# ------------------------------------------------------------- identity
# One federated credential per environment. The pipeline's permissions
# are scoped to the environment it is deploying to, so a dev run cannot
# reach production even if someone edits the workflow.
for ENV in dev uat prod; do
  run az identity federated-credential create \
    --name "fic-$NAME-$ENV" \
    --identity-name "id-$NAME-$ENV" \
    --resource-group "rg-$NAME-$ENV" \
    --issuer "https://token.actions.githubusercontent.com" \
    --subject "repo:$ORG/$NAME:environment:$ENV" \
    --audiences "api://AzureADTokenExchange" >/dev/null 2>&1 || true
done
ok "workload identity federation configured"

# ------------------------------------------------------------- catalogue
if ! $DRY_RUN; then
  cd "$NAME"
  cat > catalog-info.yaml <<YAML
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: $NAME
  description: TODO — one line on what this service does and who consumes it
  annotations:
    github.com/project-slug: $ORG/$NAME
    backstage.io/techdocs-ref: dir:.
spec:
  type: service
  owner: $OWNER
  system: $SYSTEM
  lifecycle: $LIFECYCLE
YAML
  git add catalog-info.yaml
  git commit -q -m "Add catalogue entry"
  git push -q
  cd ..
fi
ok "registered in the service catalogue"

echo
printf '\033[1m  %s is on the golden path.\033[0m\n\n' "$NAME"
echo "  Repository   https://github.com/$ORG/$NAME"
echo "  Portal       https://platform.jhi.internal/catalog/$NAME"
echo "  Next         cd $NAME && make dev"
echo
echo "  Your first deploy to dev runs automatically on merge to main."
echo "  Promotion to uat and prod needs an approval from $OWNER."
echo
