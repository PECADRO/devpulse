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

  it("loads open issues and excludes pull requests returned by the issues endpoint", async () => {
    const fetch = vi.fn<FetchLike>(async input => {
      expect(String(input)).toContain("/repos/octocat/devpulse/issues?state=open");
      return Response.json([
        {
          id: 11,
          number: 8,
          title: "Improve keyboard navigation",
          html_url: "https://github.com/octocat/devpulse/issues/8",
          labels: [{ name: "accessibility", color: "0e8a16" }],
          comments: 3,
          created_at: "2026-09-20T12:00:00Z",
          updated_at: "2026-09-25T12:00:00Z",
        },
        { id: 12, pull_request: { url: "https://api.github.com/example" } },
      ]);
    });

    await expect(createGitHubConnection({ fetch }).listIssues("octocat/devpulse")).resolves.toEqual([{
      id: 11,
      number: 8,
      title: "Improve keyboard navigation",
      url: "https://github.com/octocat/devpulse/issues/8",
      repositoryFullName: "octocat/devpulse",
      labels: [{ name: "accessibility", color: "0e8a16" }],
      comments: 3,
      createdAt: "2026-09-20T12:00:00Z",
      updatedAt: "2026-09-25T12:00:00Z",
    }]);
  });

  it("loads open pull requests and preserves draft status", async () => {
    const fetch: FetchLike = async input => {
      expect(String(input)).toContain("/repos/octocat/devpulse/pulls?state=open");
      return Response.json([{
        id: 21,
        number: 14,
        title: "Add activity filters",
        html_url: "https://github.com/octocat/devpulse/pull/14",
        labels: [],
        draft: true,
        created_at: "2026-09-24T12:00:00Z",
        updated_at: "2026-09-26T12:00:00Z",
      }]);
    };

    await expect(createGitHubConnection({ fetch }).listPullRequests("octocat/devpulse")).resolves.toMatchObject([
      { id: 21, repositoryFullName: "octocat/devpulse", draft: true, comments: 0 },
    ]);
  });

  it("rejects repository names that could alter the request path", async () => {
    const fetch = vi.fn<FetchLike>();
    const connection = createGitHubConnection({ fetch });

    await expect(connection.listIssues("octocat/devpulse/../private")).rejects.toThrow("owner/name");
    await expect(connection.listPullRequests("https://github.com/octocat/devpulse")).rejects.toThrow("owner/name");
    await expect(connection.listIssues("../private")).rejects.toThrow("owner/name");
    await expect(connection.listPullRequests("octocat/..")).rejects.toThrow("owner/name");
    expect(fetch).not.toHaveBeenCalled();
  });
});
