function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  anthropicApiKey: required("ANTHROPIC_API_KEY"),
  sitePassword: required("SITE_PASSWORD"),
  cookieSecret: required("COOKIE_SECRET"),
  chatModel: process.env.CHAT_MODEL ?? "claude-sonnet-5",
  chatMaxTokens: Number(process.env.CHAT_MAX_TOKENS ?? 1024),
  // Optional at boot, unlike the vars above: real GitHub repo creation is a
  // bonus capability layered on a scaffolder that already fully works
  // simulated, not something the app needs to exist. If GITHUB_PAT is set
  // but GITHUB_OWNER isn't, that's a config typo (not "feature off") and
  // should fail fast rather than surface as a confusing 400 on first use.
  github: process.env.GITHUB_PAT
    ? { token: process.env.GITHUB_PAT, owner: required("GITHUB_OWNER") }
    : null,
};

export const isProduction = env.nodeEnv === "production";
