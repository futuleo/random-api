#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import {
  extractKeyPaths,
  generateSyntheticData,
  parseFieldGenerators,
  serializeOutput,
} from "@random-api/core";

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
        field: { type: "string", multiple: true },
        fields: { type: "string" },
        format: { type: "string" },
        output: { type: "string", short: "o" },
        help: { type: "boolean", short: "h" },
      },
      allowPositionals: false,
    });
  } catch {
    throw new Error("Invalid arguments. Use --help for usage.");
  }

  if (options.values.help) {
    process.stdout.write(
      [
        accent("RANDOM API / LOCAL DATA STUDIO"),
        "Synthetic data. Real structure. Nothing uploaded.",
        "",
        "USAGE",
        "  random-api --input <file.json> [options]",
        "",
        "WORKSPACE",
        "  -i, --input <file>       Source JSON; key inspection by default",
        "      --generate           Generate synthetic values locally",
        '      --seed <text>        Reproducible seed (default: "random-api")',
        "      --field <path=kind>   Repeatable; e.g. '[\"email\"]=email'",
        "      --fields <file>       JSON array of {path, generator} settings",
        "      --format json|csv     Export format (default: json)",
        "  -o, --output <file>      Write a new file; never overwrite",
        "  -h, --help               Show this guide",
        "",
        "GENERATORS",
        "  auto  email  name  date  uuid  string  number  boolean",
        "",
        "EXAMPLE",
        "  pnpm cli --input users.json --generate --field '[\"email\"]=email'",
        "  pnpm cli --input users.json --generate --format csv -o synthetic.csv",
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

  if (typeof options.values.input !== "string") {
    throw new Error("A JSON file is required. Use --input <file.json>.");
  }
  if (
    !options.values.generate &&
    ["seed", "field", "fields", "format"].some(
      (key) => options.values[key] !== undefined,
    )
  ) {
    throw new Error(
      "--seed, --field, --fields and --format require --generate.",
    );
  }
  const format = options.values.format ?? "json";
  if (format !== "json" && format !== "csv") {
    throw new Error("Export format must be json or csv.");
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
  const fields = parseFieldGenerators(rawFields);

  let text: string;
  try {
    text = await readFile(options.values.input, "utf8");
  } catch {
    throw new Error("Could not read the input file.");
  }

  let document: unknown;
  try {
    document = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON. Source content is omitted for privacy.");
  }

  const result = options.values.generate
    ? generateSyntheticData(document, {
        fields,
        seed:
          typeof options.values.seed === "string"
            ? options.values.seed
            : "random-api",
      })
    : extractKeyPaths(document).map((path) => [...path]);
  const output = serializeOutput(result, format);
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
      `\n${accent("Random API")} / ${options.values.generate ? "Generated" : "Inspected"} locally / ${format.toUpperCase()} / ${typeof options.values.output === "string" ? "File saved" : "Complete"}\n`,
    );
  }
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Unexpected failure.";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
