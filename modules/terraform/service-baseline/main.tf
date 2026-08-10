// service-baseline
//
// One module call gives a team a compliant Azure footprint: identity,
// secrets, logging, and a place to run. Teams do not compose these
// resources themselves, which is how we keep diagnostic settings and
// tagging consistent across the estate.

terraform {
  required_version = ">= 1.9.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
  backend "azurerm" {} // configured by the reusable workflow
}

provider "azurerm" {
  features {}
}

locals {
  name = "${var.service_name}-${var.environment}"

  // Tags are not decoration. FinOps showback and the CMDB both key off
  // these, so they are set here rather than trusted to each team.
  tags = merge(var.additional_tags, {
    service     = var.service_name
    environment = var.environment
    owner       = var.owner
    cost_centre = var.cost_centre
    managed_by  = "idp/service-baseline"
    repo        = var.source_repo
  })
}

resource "azurerm_resource_group" "this" {
  name     = "rg-${local.name}"
  location = var.location
  tags     = local.tags
}

// Workload identity. No client secrets are ever issued to a service;
// the GitHub Actions OIDC federation and the runtime identity are the
// same principal, so an app can only reach what its pipeline can.
resource "azurerm_user_assigned_identity" "this" {
  name                = "id-${local.name}"
  resource_group_name = azurerm_resource_group.this.name
  location            = azurerm_resource_group.this.location
  tags                = local.tags
}

resource "azurerm_federated_identity_credential" "github" {
  name                = "fic-github-${var.environment}"
  resource_group_name = azurerm_resource_group.this.name
  parent_id           = azurerm_user_assigned_identity.this.id
  audience            = ["api://AzureADTokenExchange"]
  issuer              = "https://token.actions.githubusercontent.com"
  subject             = "repo:${var.github_org}/${var.source_repo}:environment:${var.environment}"
}

resource "azurerm_log_analytics_workspace" "this" {
  name                = "log-${local.name}"
  resource_group_name = azurerm_resource_group.this.name
  location            = azurerm_resource_group.this.location
  sku                 = "PerGB2018"
  retention_in_days   = var.log_retention_days
  tags                = local.tags
}

resource "azurerm_key_vault" "this" {
  name                       = substr(replace("kv-${local.name}", "_", "-"), 0, 24)
  resource_group_name        = azurerm_resource_group.this.name
  location                   = azurerm_resource_group.this.location
  tenant_id                  = var.tenant_id
  sku_name                   = "standard"
  purge_protection_enabled   = var.environment == "prod"
  soft_delete_retention_days = 90
  rbac_authorization_enabled = true
  tags                       = local.tags

  network_acls {
    default_action = "Deny"
    bypass         = "AzureServices"
    ip_rules       = var.allowed_ip_ranges
  }
}

resource "azurerm_role_assignment" "vault_read" {
  scope                = azurerm_key_vault.this.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.this.principal_id
}

resource "azurerm_container_app_environment" "this" {
  name                       = "cae-${local.name}"
  resource_group_name        = azurerm_resource_group.this.name
  location                   = azurerm_resource_group.this.location
  log_analytics_workspace_id = azurerm_log_analytics_workspace.this.id
  tags                       = local.tags
}

resource "azurerm_container_app" "this" {
  name                         = "ca-${local.name}"
  resource_group_name          = azurerm_resource_group.this.name
  container_app_environment_id = azurerm_container_app_environment.this.id
  revision_mode                = "Single"
  tags                         = local.tags

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.this.id]
  }

  registry {
    server   = "${var.registry_name}.azurecr.io"
    identity = azurerm_user_assigned_identity.this.id
  }

  template {
    min_replicas = var.min_replicas
    max_replicas = var.max_replicas

    container {
      name   = var.service_name
      image  = var.image
      cpu    = var.cpu
      memory = var.memory

      env {
        name  = "ENVIRONMENT"
        value = var.environment
      }
      env {
        name  = "AZURE_CLIENT_ID"
        value = azurerm_user_assigned_identity.this.client_id
      }

      // Health probes are part of the paved road. A service that cannot
      // say whether it is healthy cannot be safely auto-restarted, and
      // that turns a self-healing event into a 3am page.
      liveness_probe {
        transport               = "HTTP"
        port                    = var.container_port
        path                    = "/healthz"
        initial_delay           = 10
        interval_seconds        = 30
        failure_count_threshold = 3
      }

      readiness_probe {
        transport        = "HTTP"
        port             = var.container_port
        path             = "/readyz"
        interval_seconds = 10
      }
    }
  }

  ingress {
    external_enabled = var.external_ingress
    target_port      = var.container_port
    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }
}

// Every service gets a baseline alert whether the team asks for one or not.
// Opt-out is a conversation; opt-in means it never happens.
resource "azurerm_monitor_metric_alert" "restarts" {
  name                = "alert-${local.name}-restarts"
  resource_group_name = azurerm_resource_group.this.name
  scopes              = [azurerm_container_app.this.id]
  description         = "Container restart rate above baseline"
  severity            = var.environment == "prod" ? 1 : 3
  frequency           = "PT5M"
  window_size         = "PT15M"
  tags                = local.tags

  criteria {
    metric_namespace = "Microsoft.App/containerApps"
    metric_name      = "RestartCount"
    aggregation      = "Total"
    operator         = "GreaterThan"
    threshold        = var.restart_alert_threshold
  }
}
