// Same rule enforced in three other places in this repo: scripts/new-service.sh,
// templates/service-template/template.yaml's service_name pattern, and
// modules/terraform/service-baseline/variables.tf's service_name validation.
// Defined once here and echoed to the client for live form validation
// instead of a fourth independent copy.
export const SERVICE_NAME_PATTERN = /^[a-z][a-z0-9-]{2,29}$/;
export const SERVICE_NAME_PATTERN_SOURCE = SERVICE_NAME_PATTERN.source;

export function validateServiceName(name: string): string | null {
  if (!name) return "Service name is required.";
  if (!SERVICE_NAME_PATTERN.test(name)) {
    return "Name must be lowercase letters, digits and hyphens, 3-30 characters, starting with a letter.";
  }
  return null;
}
