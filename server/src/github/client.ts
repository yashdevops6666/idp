import { Octokit } from "@octokit/rest";
import { env } from "../config/env.js";

// Lazy — only constructed if env.github is actually configured, so the app
// never touches this module's Octokit instantiation when real GitHub
// creation isn't set up.
let instance: Octokit | null = null;

export function getOctokit(): Octokit {
  if (!env.github) {
    throw new Error("getOctokit() called without GITHUB_PAT configured.");
  }
  if (!instance) {
    instance = new Octokit({ auth: env.github.token });
  }
  return instance;
}
