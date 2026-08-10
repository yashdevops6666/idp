// A team's entire infrastructure definition. The baseline module owns
// identity, secrets, logging, alerting and runtime; the team owns the
// handful of decisions that are actually theirs to make.

module "service" {
  source = "git::https://github.com/jhi-platform/idp.git//modules/terraform/service-baseline?ref=v1"

  service_name = "${{ values.service_name }}"
  environment  = var.environment
  owner        = "${{ values.owner }}"
  cost_centre  = "${{ values.cost_centre }}"
  source_repo  = "${{ values.service_name }}"

  tenant_id     = var.tenant_id
  registry_name = var.registry_name
  image         = var.image

  min_replicas = var.environment == "prod" ? 2 : 1
  max_replicas = var.environment == "prod" ? 10 : 3
}
