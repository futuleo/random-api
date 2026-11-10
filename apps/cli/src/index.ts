#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import {
  EXPORT_FORMATS,
  extractKeyPaths,
  generateSimilarObjects,
  generateSyntheticData,
  getScenario,
  parseFieldGenerators,
  parseLocale,
  SCENARIOS,
  serializeOutput,
  validateRecordCount,
} from "@random-api/core";
import manifest from "../package.json" with { type: "json" };

function accent(text: string): string {
  return process.stdout.isTTY && !process.env.NO_COLOR
    ? `\u001b[38;5;183m${text}\u001b[0m`
    : text;
}

async function main(): Promise<void> {
  let options: ReturnType<typeof parseArgs>;
  try {
    options = parseArgs({
      options: {
        input: { type: "string", short: "i" },
        generate: { type: "boolean" },
        seed: { type: "string" },
        count: { type: "string", short: "n" },
        scenario: { type: "string" },
        locale: { type: "string" },
        "list-scenarios": { type: "boolean" },
        field: { type: "string", multiple: true },
        fields: { type: "string" },
        format: { type: "string" },
        output: { type: "string", short: "o" },
        help: { type: "boolean", short: "h" },
        version: { type: "boolean", short: "v" },
      },
      allowPositionals: true,
    });
  } catch {
    throw new Error("Invalid arguments. Use --help for usage.");
  }

  const [command, ...positionals] = options.positionals;
  if (command !== undefined) {
    if (command === "scenario" && positionals.length === 1) {
      if (options.values.scenario !== undefined)
        throw new Error("Specify a scenario only once.");
      options.values.scenario = positionals[0];
    } else if (positionals.length !== 0) {
      throw new Error("Invalid command. Use --help for usage.");
    } else if (command === "generate") {
      options.values.generate = true;
    } else if (command === "inspect") {
      if (options.values.generate || options.values.scenario !== undefined)
        throw new Error("Inspection cannot be combined with generation.");
    } else if (command === "scenarios") {
      options.values["list-scenarios"] = true;
    } else if (command === "help") {
      options.values.help = true;
    } else if (command === "version") {
      options.values.version = true;
    } else {
      throw new Error("Unknown command. Use --help for usage.");
    }
  }
  if (options.values.version) {
    process.stdout.write(`${manifest.version}\n`);
    return;
  }
  if (options.values.help) {
    process.stdout.write(
      [
        accent("RANDOM API / LOCAL DATA STUDIO"),
        "Synthetic data. Real structure. Nothing uploaded.",
        "",
        "USAGE",
        "  rgen <command> [options]",
        "  rgen --input <file.json> [options]",
        "",
        "COMMANDS",
        "  scenario <id>           Generate a built-in scenario",
        "  scenarios               List all scenarios as JSON",
        "  generate -i <file>       Generate from a local JSON template",
        "  inspect -i <file>        Inspect key paths without generating",
        "  help / version          Show usage / installed version",
        "",
        "WORKSPACE",
        "  -i, --input <file>       Source JSON; key inspection by default",
        "      --generate           Generate synthetic values locally",
        "  -n, --count <1-1000>     Number of objects (object templates only)",
        "      --scenario <id>      Generate a preset (10 objects by default)",
        "      --list-scenarios     List all 30 built-in scenarios as JSON",
        "      --locale <language>  en, fi, sv, ru or es (default: en)",
        '      --seed <text>        Reproducible seed (default: "random-api")',
        "      --field <path=kind>   Repeatable; e.g. '[\"email\"]=email'",
        "      --fields <file>       JSON settings, including ranges and choices",
        "      --format <format>     json, csv, xml or jsonl (default: json)",
        "  -o, --output <file>      Write a new file; never overwrite",
        "  -h, --help               Show this guide",
        "  -v, --version            Show the installed version",
        "",
        "GENERATORS",
        "  auto  email  name  date  uuid  string  number  boolean  enum",
        "  Use --fields for number min/max and enum values.",
        "",
        "EXAMPLE",
        "  rgen generate -i users.json --field '[\"email\"]=email'",
        "  rgen scenario users --count 100 --locale fi --format csv",
        "  rgen scenario products --format xml -o products.xml",
        "  rgen scenarios --locale es",
        "",
        "PRIVACY",
        "  No network requests. Keys and structure remain; not anonymization.",
        "  JSON segment arrays preserve literal dots and unusual field names.",
        "  CSV headers are JSON paths; nested arrays are JSON cells.",
        "",
      ].join("\n"),
    );
    return;
  }

  const locale = parseLocale(options.values.locale);
  if (options.values["list-scenarios"]) {
    if (
      Object.keys(options.values).some(
        (key) => key !== "list-scenarios" && key !== "locale",
      )
    ) {
      throw new Error("Scenario listing accepts only --locale.");
    }
    process.stdout.write(
      `${JSON.stringify(
        SCENARIOS.map(({ id }) => {
          const { name, category, description } = getScenario(id, locale);
          return { id, name, category, description };
        }),
        null,
        2,
      )}\n`,
    );
    return;
  }
  if (
    options.values.input !== undefined &&
    options.values.scenario !== undefined
  ) {
    throw new Error("Choose either --input or --scenario, not both.");
  }
  const scenario =
    typeof options.values.scenario === "string"
      ? getScenario(options.values.scenario, locale)
      : undefined;
  const generating = options.values.generate === true || scenario !== undefined;
  if (typeof options.values.input !== "string" && !scenario) {
    throw new Error("Use --input <file.json> or --scenario <id>.");
  }
  if (
    !generating &&
    ["seed", "field", "fields", "format", "count", "locale"].some(
      (key) => options.values[key] !== undefined,
    )
  ) {
    throw new Error(
      "--seed, --field, --fields, --format, --count and --locale require generation.",
    );
  }
  let count: number | undefined = scenario ? 10 : undefined;
  if (options.values.count !== undefined) {
    if (
      typeof options.values.count !== "string" ||
      !/^\d+$/.test(options.values.count)
    ) {
      throw new Error("Record count must be between 1 and 1000.");
    }
    count = Number(options.values.count);
    validateRecordCount(count);
  }
  const format = options.values.format ?? "json";
  const exportFormat = EXPORT_FORMATS.find((item) => item === format);
  if (exportFormat === undefined) {
    throw new Error("Export format must be json, csv, xml or jsonl.");
  }

  const rawFields: unknown[] = [];
  if (typeof options.values.fields === "string") {
    let parsed: unknown;
    try {
      parsed = JSON.parse(await readFile(options.values.fields, "utf8"));
    } catch {
      throw new Error("Could not read field settings as JSON.");
    }
    rawFields.push(...parseFieldGenerators(parsed));
  }
  const inlineFields = options.values.field;
  for (const setting of Array.isArray(inlineFields) ? inlineFields : []) {
    if (typeof setting !== "string") {
      throw new Error(
        'Field syntax must be \'["path","segments"]=generator\'.',
      );
    }
    const split = setting.lastIndexOf("=");
    let path: unknown;
    try {
      path = JSON.parse(setting.slice(0, split));
    } catch {
      throw new Error(
        'Field syntax must be \'["path","segments"]=generator\'.',
      );
    }
    rawFields.push({ path, generator: setting.slice(split + 1) });
  }
  const overrides = parseFieldGenerators(rawFields);
  const overridePaths = new Set(
    overrides.map((field) => JSON.stringify(field.path)),
  );
  const fields = [
    ...(scenario?.fields.filter(
      (field) => !overridePaths.has(JSON.stringify(field.path)),
    ) ?? []),
    ...overrides,
  ];

  let document: unknown = scenario?.template;
  if (!scenario) {
    if (typeof options.values.input !== "string")
      throw new Error("A JSON file is required.");
    let text: string;
    try {
      text = await readFile(options.values.input, "utf8");
    } catch {
      throw new Error("Could not read the input file.");
    }
    try {
      document = JSON.parse(text);
    } catch {
      throw new Error("Invalid JSON. Source content is omitted for privacy.");
    }
  }

  const generationOptions = {
    fields,
    locale,
    seed:
      typeof options.values.seed === "string"
        ? options.values.seed
        : "random-api",
  };
  const result = generating
    ? count === undefined
      ? generateSyntheticData(document, generationOptions)
      : generateSimilarObjects(document, { ...generationOptions, count })
    : extractKeyPaths(document).map((path) => [...path]);
  const output = serializeOutput(result, exportFormat);
  if (typeof options.values.output === "string") {
    try {
      await writeFile(options.values.output, output, { flag: "wx" });
    } catch {
      throw new Error(
        "Could not create output file. Use a new writable path; existing files are never overwritten.",
      );
    }
  } else {
    process.stdout.write(output);
  }
  if (process.stderr.isTTY) {
    process.stderr.write(
      `\n${accent("Random API")} / ${generating ? "Generated" : "Inspected"} locally / ${exportFormat.toUpperCase()} / ${typeof options.values.output === "string" ? "File saved" : "Complete"}\n`,
    );
  }
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Unexpected failure.";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
