import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateDataset, generateSyntheticData } from "@random-api/core";
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
  it("generates linked shop data identically to core and rejects conflicting options", () => {
    for (const locale of ["en", "fi", "sv", "ru", "es"] as const) {
      expect(JSON.parse(run("datasets", "--locale", locale).stdout)[0].id).toBe(
        "shop",
      );
      const result = run(
        "dataset",
        "shop",
        "--count",
        "7",
        "--locale",
        locale,
        "--seed",
        "cli-shop",
      );
      expect(result.status).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual(
        generateDataset("shop", { count: 7, locale, seed: "cli-shop" }),
      );
    }
    expect(JSON.parse(run("dataset", "shop").stdout).orders).toHaveLength(10);
    for (const format of ["csv", "xml", "jsonl"])
      expect(run("dataset", "shop", "--format", format).status).toBe(0);
    for (const args of [
      ["dataset", "SENTINEL_DATASET"],
      ["dataset", "shop", "--input", input],
      ["dataset", "shop", "--scenario", "users"],
      ["dataset", "shop", "--field", '["id"]=uuid'],
      ["dataset", "shop", "--fields", input],
      ["dataset", "shop", "--count", "1001"],
      ["datasets", "--count", "3"],
      ["inspect", "--dataset", "shop"],
      ["dataset", "shop", "--dataset", "shop"],
    ]) {
      const result = run(...args);
      expect(result.status).toBe(1);
      expect(result.stdout).toBe("");
      expect(result.stderr).not.toContain("SENTINEL");
    }
  });
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
    expect(result.stdout).toContain("rgen <command>");
    expect(run("--version").stdout.trim()).toBe("0.1.0");
    expect(run("version").stdout).toBe(run("--version").stdout);
    expect(run("help").stdout).toBe(run("--help").stdout);
  });
  it("supports standalone commands and all five explicit locales", () => {
    expect(run("inspect", "-i", input).stdout).toBe(run("-i", input).stdout);
    expect(run("generate", "-i", input).stdout).toBe(
      run("-i", input, "--generate").stdout,
    );
    for (const locale of ["en", "fi", "sv", "ru", "es"]) {
      const list = run("scenarios", "--locale", locale);
      expect(list.status).toBe(0);
      expect(JSON.parse(list.stdout)).toHaveLength(30);
      const generated = run(
        "scenario",
        "products",
        "--locale",
        locale,
        "-n",
        "3",
      );
      expect(generated.status).toBe(0);
      expect(JSON.parse(generated.stdout)).toHaveLength(3);
      expect(generated.stdout).toBe(
        run("--scenario", "products", "--locale", locale, "-n", "3").stdout,
      );
    }
    const russian = JSON.parse(run("scenarios", "--locale", "ru").stdout);
    expect(russian[0].name).toBe("Пользователи");
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
  it("supports range and enum overrides plus XML and JSONL files", async () => {
    const fields = join(directory, "constraints.json");
    await writeFile(
      fields,
      JSON.stringify([
        { path: ["name"], generator: "enum", values: ["ready", "waiting"] },
        { path: ["count"], generator: "number", min: -2, max: 2 },
      ]),
    );
    const generated = run(
      "--input",
      input,
      "--generate",
      "--count",
      "25",
      "--fields",
      fields,
      "--format",
      "jsonl",
    );
    expect(generated.status).toBe(0);
    const rows: { name: string; count: number }[] = generated.stdout
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    expect(rows).toHaveLength(25);
    for (const row of rows) {
      expect(["ready", "waiting"]).toContain(row.name);
      expect(row.count).toBeGreaterThanOrEqual(-2);
      expect(row.count).toBeLessThanOrEqual(2);
    }
    expect(generated.stdout).not.toContain("SENTINEL");
    const xml = run("--scenario", "orders", "--count", "3", "--format", "xml");
    expect(xml.status).toBe(0);
    expect(xml.stdout).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml.stdout.match(/<item type="object">/g)).toHaveLength(3);
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
      ["scenario", "SENTINEL_COMMAND"],
      ["scenario", "users", "--scenario", "products"],
      ["inspect", "-i", input, "--generate"],
      ["--input", input, "--locale", "fi"],
      ["--scenario", "users", "--locale", "SENTINEL_LANGUAGE"],
      ["scenarios", "--output", join(directory, "SENTINEL_OUTPUT")],
      ["SENTINEL_COMMAND"],
      ["scenario"],
      ["generate", "SENTINEL_EXTRA", "-i", input],
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
