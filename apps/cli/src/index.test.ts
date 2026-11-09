import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateSyntheticData } from "@random-api/core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const source = { name: "SENTINEL_PERSON", count: 987654321, active: true };
const entry = fileURLToPath(new URL("./index.ts", import.meta.url));
let directory: string;
let input: string;

beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), "random-api-cli-"));
  input = join(directory, "input.json");
  await writeFile(input, JSON.stringify(source));
  await writeFile(
    join(directory, "invalid.json"),
    '{"name":"SENTINEL_INVALID"',
  );
});

afterAll(async () => {
  if (directory) await rm(directory, { recursive: true, force: true });
});

function run(...args: string[]) {
  return spawnSync(process.execPath, [entry, ...args], {
    encoding: "utf8",
    timeout: 10_000,
  });
}

describe("CLI", () => {
  it("preserves default key inspection", () => {
    const result = run("--input", input);
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout)).toEqual([
      ["name"],
      ["count"],
      ["active"],
    ]);
  });

  it("generates the same seeded JSON as core without original values", () => {
    const result = run("--input", input, "--generate", "--seed", "cli-seed");
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout)).toEqual(
      generateSyntheticData(source, { seed: "cli-seed" }),
    );
    expect(result.stdout).not.toContain("SENTINEL");
    expect(result.stdout).not.toContain("987654321");
    expect(
      run("--input", input, "--generate", "--seed", "cli-seed").stdout,
    ).toBe(result.stdout);
  });

  it("uses the documented default seed", () => {
    const result = run("--input", input, "--generate");
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual(
      generateSyntheticData(source, { seed: "random-api" }),
    );
  });

  it("shows usage without reading input", () => {
    const result = run("--help");
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("--generate");
    expect(result.stdout).toContain("--seed");
  });

  it("reports argument, file and JSON errors without reflecting input", () => {
    for (const args of [
      ["--input", input, "--seed", "SENTINEL_SEED"],
      ["--input", input, "--generate", "--seed", ""],
      ["--input", join(directory, "invalid.json"), "--generate"],
      ["--input", join(directory, "SENTINEL_MISSING.json")],
      ["--SENTINEL_ARGUMENT"],
      [],
    ]) {
      const result = run(...args);
      expect(result.status).toBe(1);
      expect(result.stdout).toBe("");
      expect(result.stderr).not.toContain("SENTINEL");
      expect(result.stderr.trim().length).toBeGreaterThan(0);
    }
  });
});
