import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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
    join(directory, "fields.json"),
    JSON.stringify([{ path: ["name"], generator: "name" }]),
  );
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

  it("lists all 30 scenarios without reading an input file", () => {
    const result = run("--list-scenarios");
    expect(result.status).toBe(0);
    const scenarios: { id: string; category: string }[] = JSON.parse(
      result.stdout,
    );
    expect(scenarios).toHaveLength(30);
    expect(new Set(scenarios.map((item) => item.id)).size).toBe(30);
    expect(result.stdout).not.toContain("template");
  });

  it("generates exactly the chosen number from a local object template", () => {
    const result = run("--input", input, "--generate", "--count", "37");
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toHaveLength(37);
    expect(result.stdout).not.toContain("SENTINEL");
    expect(result.stdout).not.toContain("987654321");
  });

  it("generates scenario presets with editable fields, default counts and CSV", () => {
    const defaultResult = run("--scenario", "users");
    expect(defaultResult.status).toBe(0);
    expect(JSON.parse(defaultResult.stdout)).toHaveLength(10);
    const edited = run(
      "--scenario",
      "users",
      "--count",
      "3",
      "--field",
      '["email"]=uuid',
    );
    expect(edited.status).toBe(0);
    const rows: { email: string; name: string }[] = JSON.parse(edited.stdout);
    expect(rows).toHaveLength(3);
    expect(rows[0]?.email).toMatch(/^[a-f0-9-]{36}$/);
    expect(rows[0]?.name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
    const csv = run("--scenario", "orders", "--count", "17", "--format", "csv");
    expect(csv.status).toBe(0);
    expect(csv.stdout.split("\r\n")).toHaveLength(19);
    expect(csv.stdout).toContain('"[""customer"",""email""]"');
  });

  it("supports inline and file-based field selection with CSV output", () => {
    const result = run(
      "--input",
      input,
      "--generate",
      "--fields",
      join(directory, "fields.json"),
      "--field",
      '["count"]=uuid',
      "--format",
      "csv",
    );
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain('"[""name""]"');
    expect(result.stdout).toMatch(/[A-Z][a-z]+ [A-Z][a-z]+/);
    expect(result.stdout).toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-4/);
    expect(result.stdout).not.toContain("SENTINEL");
  });

  it("writes new files without overwriting existing output or the input", async () => {
    const output = join(directory, "generated.csv");
    const result = run(
      "--input",
      input,
      "--generate",
      "--format",
      "csv",
      "-o",
      output,
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toBe("");
    expect(await readFile(output, "utf8")).toContain('"[""name""]"');
    expect(run("--input", input, "--generate", "-o", output).status).toBe(1);
    expect(run("--input", input, "--generate", "-o", input).status).toBe(1);
    expect(JSON.parse(await readFile(input, "utf8"))).toEqual(source);
  });

  it("reports argument, file and JSON errors without reflecting input", () => {
    for (const args of [
      ["--input", input, "--seed", "SENTINEL_SEED"],
      ["--input", input, "--generate", "--seed", ""],
      ["--input", join(directory, "invalid.json"), "--generate"],
      ["--input", join(directory, "SENTINEL_MISSING.json")],
      ["--SENTINEL_ARGUMENT"],
      ["--input", input, "--generate", "--format", "SENTINEL"],
      ["--input", input, "--generate", "--field", "SENTINEL=email"],
      ["--input", input, "--generate", "--field", '["name"]=SENTINEL'],
      [
        "--input",
        input,
        "--generate",
        "--fields",
        join(directory, "invalid.json"),
      ],
      ["--input", input, "--generate", "--field", '["missing"]=email'],
      ["--input", input, "--count", "5"],
      ["--input", input, "--generate", "--count", "0"],
      ["--input", input, "--generate", "--count", "1001"],
      ["--input", input, "--generate", "--count", "1.5"],
      ["--scenario", "SENTINEL_UNKNOWN"],
      ["--scenario", "users", "--input", input],
      ["--list-scenarios", "--count", "5"],
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
