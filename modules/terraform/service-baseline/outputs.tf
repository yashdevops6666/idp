output "resource_group_name" {
  value = azurerm_resource_group.this.name
}

output "identity_client_id" {
  description = "Set this as AZURE_CLIENT_ID in the workload."
  value       = azurerm_user_assigned_identity.this.client_id
}

output "key_vault_uri" {
  value = azurerm_key_vault.this.vault_uri
}

output "app_url" {
  value = try("https://${azurerm_container_app.this.ingress[0].fqdn}", null)
}

output "log_analytics_workspace_id" {
  description = "Used by the platform dashboard to stitch service logs together."
  value       = azurerm_log_analytics_workspace.this.id
}
