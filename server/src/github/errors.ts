export class GitHubIntegrationError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface OctokitLikeError {
  status?: number;
  message?: string;
  response?: {
    headers?: Record<string, string>;
    data?: { message?: string };
  };
}

// Octokit throws a RequestError with .status and .response — duck-typed
// here rather than importing @octokit/request-error's class, since all we
// need is the status code and the rate-limit header.
export function mapOctokitError(err: unknown): GitHubIntegrationError {
  const e = err as OctokitLikeError;
  const status = e?.status ?? 500;
  const rateLimitRemaining = e?.response?.headers?.["x-ratelimit-remaining"];

  if (status === 401) {
    return new GitHubIntegrationError("GitHub token is invalid or expired.", 401);
  }
  if (status === 403 && rateLimitRemaining === "0") {
    return new GitHubIntegrationError("GitHub API rate limit exceeded. Try again shortly.", 429);
  }
  if (status === 403) {
    return new GitHubIntegrationError("GitHub token lacks the required 'repo' scope.", 403);
  }
  if (status === 404) {
    return new GitHubIntegrationError("Configured GITHUB_OWNER was not found on GitHub.", 404);
  }
  if (status === 422) {
    return new GitHubIntegrationError("A repository with that name already exists on GitHub.", 409);
  }
  return new GitHubIntegrationError(
    e?.response?.data?.message ?? e?.message ?? "GitHub API request failed.",
    status,
  );
}
