variable "service_name" {
  type        = string
  description = "Service name. Must match the name in catalog-info.yaml."
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,29}$", var.service_name))
    error_message = "Lowercase letters, digits and hyphens, 3-30 characters, starting with a letter."
  }
}

variable "environment" {
  type        = string
  description = "Deployment environment."
  validation {
    condition     = contains(["dev", "uat", "prod"], var.environment)
    error_message = "Environment must be one of: dev, uat, prod."
  }
}

variable "owner" {
  type        = string
  description = "Owning team, as an AAD group name. This is who gets paged."
}

variable "cost_centre" {
  type        = string
  description = "Cost centre code for FinOps showback."
}

variable "source_repo" {
  type        = string
  description = "Repository name, used for OIDC federation subject and tagging."
}

variable "github_org" {
  type    = string
  default = "jhi-platform"
}

variable "tenant_id" {
  type = string
}

variable "location" {
  type    = string
  default = "uksouth"
}

variable "registry_name" {
  type        = string
  description = "Shared platform container registry."
}

variable "image" {
  type        = string
  description = "Fully qualified image reference, set by the deploy pipeline."
}

variable "container_port" {
  type    = number
  default = 8000
}

variable "external_ingress" {
  type        = bool
  default     = false
  description = "Internal by default. Public exposure is a deliberate choice, not a default."
}

variable "cpu" {
  type    = number
  default = 0.5
}

variable "memory" {
  type    = string
  default = "1Gi"
}

variable "min_replicas" {
  type    = number
  default = 1
}

variable "max_replicas" {
  type    = number
  default = 5
}

variable "log_retention_days" {
  type    = number
  default = 90
}

variable "restart_alert_threshold" {
  type    = number
  default = 3
}

variable "allowed_ip_ranges" {
  type    = list(string)
  default = []
}

variable "additional_tags" {
  type    = map(string)
  default = {}
}
