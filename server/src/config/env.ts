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
};

export const isProduction = env.nodeEnv === "production";
