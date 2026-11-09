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
});
