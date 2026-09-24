const DEFAULT_API_URL = "https://api.github.com";
const API_VERSION = "2022-11-28";

export interface GitHubViewer {
  id: number;
  login: string;
  avatarUrl: string;
  profileUrl: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  url: string;
  defaultBranch: string;
  updatedAt: string;
}

export interface GitHubTokenSource {
  getToken(): Promise<string | null>;
}

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface GitHubConnectionOptions {
  fetch?: FetchLike;
  tokenSource?: GitHubTokenSource;
  apiBaseUrl?: string;
}

export interface GitHubConnection {
  getViewer(signal?: AbortSignal): Promise<GitHubViewer>;
  listRepositories(signal?: AbortSignal): Promise<GitHubRepository[]>;
}

export class GitHubApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly rateLimitRemaining: number | null,
    readonly rateLimitResetAt: Date | null,
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}

function normalizeApiBaseUrl(value: string): URL {
  const url = new URL(value);
  const isLocalDevelopment = url.protocol === "http:" &&
    (url.hostname === "localhost" || url.hostname === "127.0.0.1");

  if (url.protocol !== "https:" && !isLocalDevelopment) {
    throw new Error("GitHub API connections require HTTPS outside local development.");
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error("GitHub API base URL cannot contain credentials, query parameters, or fragments.");
  }

  url.pathname = url.pathname.replace(/\/+$/, "");
  return url;
}

function safeErrorMessage(value: unknown, fallback: string): string {
  if (typeof value !== "object" || value === null) return fallback;
  const message = (value as { message?: unknown }).message;
  return typeof message === "string" && message.length <= 240 ? message : fallback;
}

function rateLimitFrom(response: Response): Pick<GitHubApiError, "rateLimitRemaining" | "rateLimitResetAt"> {
  const remainingHeader = response.headers.get("x-ratelimit-remaining");
  const resetHeader = response.headers.get("x-ratelimit-reset");
  const remaining = remainingHeader === null ? null : Number.parseInt(remainingHeader, 10);
  const resetSeconds = resetHeader === null ? null : Number.parseInt(resetHeader, 10);

  return {
    rateLimitRemaining: remaining !== null && Number.isFinite(remaining) ? remaining : null,
    rateLimitResetAt: resetSeconds !== null && Number.isFinite(resetSeconds)
      ? new Date(resetSeconds * 1000)
      : null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseViewer(value: unknown): GitHubViewer {
  if (!isRecord(value) || typeof value.id !== "number" || typeof value.login !== "string" ||
      typeof value.avatar_url !== "string" || typeof value.html_url !== "string") {
    throw new Error("GitHub returned an invalid viewer response.");
  }

  return { id: value.id, login: value.login, avatarUrl: value.avatar_url, profileUrl: value.html_url };
}

function parseRepository(value: unknown): GitHubRepository {
  if (!isRecord(value) || typeof value.id !== "number" || typeof value.name !== "string" ||
      typeof value.full_name !== "string" || typeof value.private !== "boolean" ||
      typeof value.html_url !== "string" || typeof value.default_branch !== "string" ||
      typeof value.updated_at !== "string") {
    throw new Error("GitHub returned an invalid repository response.");
  }

  return {
    id: value.id,
    name: value.name,
    fullName: value.full_name,
    private: value.private,
    url: value.html_url,
    defaultBranch: value.default_branch,
    updatedAt: value.updated_at,
  };
}

export function createGitHubConnection(options: GitHubConnectionOptions = {}): GitHubConnection {
  const request = options.fetch ?? globalThis.fetch.bind(globalThis);
  const baseUrl = normalizeApiBaseUrl(options.apiBaseUrl ?? DEFAULT_API_URL);

  async function get(path: string, signal?: AbortSignal): Promise<unknown> {
    const token = await options.tokenSource?.getToken() ?? null;
    if (token && /[\r\n]/.test(token)) throw new Error("Invalid GitHub access token.");

    const headers = new Headers({
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": API_VERSION,
    });
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const url = new URL(`${baseUrl.pathname}${path}`, baseUrl);
    const response = await request(url, {
      method: "GET",
      headers,
      signal,
      redirect: "error",
    });

    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      if (response.ok) throw new Error("GitHub returned a non-JSON response.");
    }

    if (!response.ok) {
      const limits = rateLimitFrom(response);
      throw new GitHubApiError(
        safeErrorMessage(body, `GitHub request failed with status ${response.status}.`),
        response.status,
        limits.rateLimitRemaining,
        limits.rateLimitResetAt,
      );
    }

    return body;
  }

  return {
    async getViewer(signal) {
      return parseViewer(await get("/user", signal));
    },
    async listRepositories(signal) {
      const value = await get("/user/repos?affiliation=owner,collaborator,organization_member&per_page=100&sort=updated", signal);
      if (!Array.isArray(value)) throw new Error("GitHub returned an invalid repository list.");
      return value.map(parseRepository);
    },
  };
}
