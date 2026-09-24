import { describe, expect, it, vi } from "vitest";
import { GitHubApiError, createGitHubConnection, type FetchLike } from "./github";

const viewerResponse = {
  id: 42,
  login: "octocat",
  avatar_url: "https://avatars.example/octocat",
  html_url: "https://github.com/octocat",
};

describe("GitHub connection", () => {
  it("uses versioned headers and requests tokens only when needed", async () => {
    const getToken = vi.fn(async () => "session-token");
    const fetch = vi.fn<FetchLike>(async (_input, init) => {
      const headers = new Headers(init?.headers);
      expect(headers.get("authorization")).toBe("Bearer session-token");
      expect(headers.get("x-github-api-version")).toBe("2022-11-28");
      return Response.json(viewerResponse);
    });

    const viewer = await createGitHubConnection({ fetch, tokenSource: { getToken } }).getViewer();

    expect(viewer).toEqual({
      id: 42,
      login: "octocat",
      avatarUrl: "https://avatars.example/octocat",
      profileUrl: "https://github.com/octocat",
    });
    expect(getToken).toHaveBeenCalledOnce();
  });

  it("rejects insecure remote endpoints and credentials in URLs", () => {
    expect(() => createGitHubConnection({ apiBaseUrl: "http://example.com" })).toThrow("require HTTPS");
    expect(() => createGitHubConnection({ apiBaseUrl: "https://token@example.com" })).toThrow("cannot contain credentials");
    expect(() => createGitHubConnection({ apiBaseUrl: "http://localhost:8787" })).not.toThrow();
  });

  it("maps repositories into a stable application shape", async () => {
    const fetch: FetchLike = async () => Response.json([{
      id: 7,
      name: "devpulse",
      full_name: "octocat/devpulse",
      private: false,
      html_url: "https://github.com/octocat/devpulse",
      default_branch: "main",
      updated_at: "2026-09-24T12:00:00Z",
    }]);

    await expect(createGitHubConnection({ fetch }).listRepositories()).resolves.toEqual([{
      id: 7,
      name: "devpulse",
      fullName: "octocat/devpulse",
      private: false,
      url: "https://github.com/octocat/devpulse",
      defaultBranch: "main",
      updatedAt: "2026-09-24T12:00:00Z",
    }]);
  });

  it("returns typed errors with rate-limit context without exposing response bodies", async () => {
    const fetch: FetchLike = async () => Response.json(
      { message: "API rate limit exceeded", documentation_url: "secret detail" },
      { status: 403, headers: { "x-ratelimit-remaining": "0", "x-ratelimit-reset": "1800000000" } },
    );

    const error = await createGitHubConnection({ fetch }).getViewer().catch(value => value);

    expect(error).toBeInstanceOf(GitHubApiError);
    expect(error).toMatchObject({ status: 403, message: "API rate limit exceeded", rateLimitRemaining: 0 });
    expect(error.rateLimitResetAt).toEqual(new Date(1800000000 * 1000));
    expect(JSON.stringify(error)).not.toContain("secret detail");
  });

  it("rejects malformed successful responses", async () => {
    const fetch: FetchLike = async () => Response.json({ id: "wrong", login: "octocat" });
    await expect(createGitHubConnection({ fetch }).getViewer()).rejects.toThrow("invalid viewer response");
  });
});
