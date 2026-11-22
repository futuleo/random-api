import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadApiSettings, parseApiSettings } from "./config.ts";

const key = "TEST_KEY_SENTINEL_".repeat(4);
describe("API deployment configuration", () => {
  it("keeps loopback defaults and fails closed for incomplete public settings", () => {
    expect(parseApiSettings({})).toEqual({
      mode: "local",
      host: "127.0.0.1",
      port: 3000,
    });
    for (const environment of [
      { API_MODE: "SENTINEL" },
      { API_MODE: "public" },
      {
        API_MODE: "public",
        API_KEY: "SENTINEL_SHORT",
        PUBLIC_API_URL: "https://example.test/api/",
      },
      {
        API_MODE: "public",
        API_KEY: key,
        PUBLIC_API_URL: "http://example.test/api/",
      },
      {
        API_MODE: "public",
        API_KEY: key,
        PUBLIC_API_URL: "https://user:SENTINEL@example.test/",
      },
      {
        API_MODE: "public",
        API_KEY: key,
        PUBLIC_API_URL: "https://example.test/api/?SENTINEL",
      },
      {
        API_MODE: "public",
        API_KEY: key,
        PUBLIC_API_URL: "https://example.test/api/#SENTINEL",
      },
      {
        API_MODE: "public",
        API_KEY: key,
        PUBLIC_API_URL: "https://example.test/<SENTINEL>",
      },
      { API_KEY: key },
      { PORT: "0" },
    ]) {
      let error: unknown;
      try {
        parseApiSettings(environment);
      } catch (failure) {
        error = failure;
      }
      expect(error).toBeInstanceOf(Error);
      expect(String(error)).not.toContain("SENTINEL");
    }
    expect(
      parseApiSettings({
        API_MODE: "public",
        API_KEY: key,
        PUBLIC_API_URL: "https://example.test/api",
      }),
    ).toMatchObject({
      mode: "public",
      host: "0.0.0.0",
      publicUrl: new URL("https://example.test/api/"),
    });
    expect(
      parseApiSettings({
        API_MODE: "public",
        API_KEY: key,
        PUBLIC_API_URL: "http://localhost:8080/api/",
      }).mode,
    ).toBe("public");
  });
  it("loads one external key file without printing secrets or paths", async () => {
    const directory = await mkdtemp(join(tmpdir(), "rgen-api-key-"));
    try {
      const path = join(directory, "key");
      await writeFile(path, `${key}\n`, { mode: 0o600 });
      const settings = await loadApiSettings({
        API_MODE: "public",
        PUBLIC_API_URL: "https://example.test/api/",
        API_KEY_FILE: path,
      });
      expect(settings).toMatchObject({ mode: "public", apiKey: key });
      await expect(loadApiSettings({ API_KEY_FILE: path })).rejects.toThrow(
        "requires API_MODE=public",
      );
      await expect(
        loadApiSettings({
          API_MODE: "public",
          API_KEY: key,
          API_KEY_FILE: path,
        }),
      ).rejects.toThrow("not both");
      await expect(
        loadApiSettings({
          API_MODE: "public",
          API_KEY_FILE: join(directory, "SENTINEL_MISSING"),
        }),
      ).rejects.toThrow("Could not read the API key file.");
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
