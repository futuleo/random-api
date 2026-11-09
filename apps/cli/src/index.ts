#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { extractKeyPaths, generateSyntheticData } from "@random-api/core";

async function main(): Promise<void> {
  let options: ReturnType<typeof parseArgs>;
  try {
    options = parseArgs({
      options: {
        input: { type: "string", short: "i" },
        generate: { type: "boolean" },
        seed: { type: "string" },
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
        "Usage: random-api --input <file.json> [--generate [--seed <text>]]",
        "By default, extract JSON key paths locally.",
        "--generate replaces primitive values and preserves local JSON structure.",
        '--seed sets reproducible output (default: "random-api").',
        "No network requests are made. Original values are not copied.",
        "Keys, array lengths and primitive types are preserved; this is not anonymization.",
        "",
      ].join("\n"),
    );
    return;
  }

  if (typeof options.values.input !== "string") {
    throw new Error("A JSON file is required. Use --input <file.json>.");
  }
  if (options.values.seed !== undefined && !options.values.generate) {
    throw new Error("--seed requires --generate.");
  }

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
        seed:
          typeof options.values.seed === "string"
            ? options.values.seed
            : "random-api",
      })
    : extractKeyPaths(document);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Unexpected failure.";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
