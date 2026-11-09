import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "./app.ts";

describe("API scaffold", () => {
  const apps: ReturnType<typeof buildApp>[] = [];

  afterEach(async () => {
    await Promise.all(apps.map((app) => app.close()));
    apps.length = 0;
  });

  function createApp() {
    const app = buildApp();
    apps.push(app);
    return app;
  }

  it("reports readiness", async () => {
    const response = await createApp().inject({
      method: "GET",
      url: "/health",
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });

  it("does not reflect unknown URLs or input values", async () => {
    const response = await createApp().inject({
      method: "POST",
      url: "/SENTINEL_PATH",
      payload: { email: "SENTINEL_EMAIL" },
    });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: "Not found." });
    expect(response.body).not.toContain("SENTINEL");
  });

  it("does not include source snippets in malformed JSON errors", async () => {
    const response = await createApp().inject({
      method: "POST",
      url: "/health",
      headers: { "content-type": "application/json" },
      payload: '{"email":"SENTINEL_EMAIL",broken}',
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: "Invalid request." });
  });

  const settings = {
    seed: "api-test",
    count: 2,
    fields: [
      { path: ["id"], generator: "uuid" },
      { path: ["profile", "email"], generator: "email" },
    ],
  };
  it("serves the local API reference", async () => {
    const response = await createApp().inject({ method: "GET", url: "/" });
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("text/html");
    expect(response.headers["content-security-policy"]).toContain(
      "default-src 'none'",
    );
    expect(response.body).toContain("/generate");
  });
  it("generates deterministic JSON and CSV from explicit fields only", async () => {
    const app = createApp();
    const first = await app.inject({
      method: "POST",
      url: "/generate",
      payload: settings,
    });
    expect(first.statusCode).toBe(200);
    expect(first.json()).toHaveLength(2);
    expect(first.json()[0].profile.email).toMatch(/@example\.test$/);
    expect(first.headers["cache-control"]).toBe("no-store");
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/generate",
          payload: settings,
        })
      ).body,
    ).toBe(first.body);
    const csv = await app.inject({
      method: "POST",
      url: "/generate",
      payload: { ...settings, format: "csv" },
    });
    expect(csv.statusCode).toBe(200);
    expect(csv.headers["content-type"]).toContain("text/csv");
    expect(csv.body).toContain('"[""profile"",""email""]"');
  });
  it("rejects documents, metadata, extra values, malformed settings and amplification", async () => {
    const app = createApp();
    for (const payload of [
      { ...settings, document: { email: "SENTINEL_SOURCE" } },
      {
        ...settings,
        fields: [
          { path: ["email"], generator: "email", value: "SENTINEL_VALUE" },
        ],
      },
      {
        ...settings,
        fields: [{ path: ["email"], generator: "email", type: "string" }],
      },
      { ...settings, count: "2" },
      { ...settings, count: 1001 },
      { ...settings, fields: [{ path: ["id"], generator: "auto" }] },
      { ...settings, fields: [settings.fields[0], settings.fields[0]] },
      {
        ...settings,
        fields: [
          { path: ["id"], generator: "email" },
          { path: ["id", "nested"], generator: "uuid" },
        ],
      },
      {
        ...settings,
        count: 1000,
        fields: Array.from({ length: 150 }, (_, index) => ({
          path: [`field${index}`],
          generator: "uuid",
        })),
      },
    ]) {
      const response = await app.inject({
        method: "POST",
        url: "/generate",
        payload,
      });
      expect(response.statusCode).toBe(400);
      expect(response.body).not.toContain("SENTINEL");
    }
  });
  it("blocks browser-origin requests and untrusted hostnames", async () => {
    const app = createApp();
    for (const headers of [
      { origin: "https://SENTINEL.test" },
      { host: "SENTINEL.test" },
    ]) {
      const response = await app.inject({
        method: "POST",
        url: "/generate",
        headers,
        payload: settings,
      });
      expect(response.statusCode).toBe(403);
      expect(response.body).not.toContain("SENTINEL");
    }
  });
  it("enforces request-body and local rate limits", async () => {
    const app = createApp();
    const large = await app.inject({
      method: "POST",
      url: "/generate",
      payload: { ...settings, seed: "SENTINEL".repeat(10_000) },
    });
    expect(large.statusCode).toBe(413);
    expect(large.body).not.toContain("SENTINEL");
    for (let index = 0; index < 119; index += 1) {
      expect(
        (await app.inject({ method: "GET", url: "/health" })).statusCode,
      ).toBe(200);
    }
    const limited = await app.inject({ method: "GET", url: "/health" });
    expect(limited.statusCode).toBe(429);
    expect(limited.headers["retry-after"]).toBe("60");
  });
});
