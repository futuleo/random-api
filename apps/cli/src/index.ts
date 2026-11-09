#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { extractKeyPaths } from "@random-api/core";

async function main(): Promise<void> {
  let options: ReturnType<typeof parseArgs>;
  try {
    options = parseArgs({
      options: {
        input: { type: "string", short: "i" },
        help: { type: "boolean", short: "h" },
      },
      allowPositionals: false,
    });
  } catch {
    throw new Error("Invalid arguments. Use --help for usage.");
  }

  if (options.values.help) {
    process.stdout.write(
      "Usage: random-api --input <file.json>\nExtract JSON key paths locally. No network requests are made.\n",
    );
    return;
  }

  if (typeof options.values.input !== "string") {
    throw new Error("A JSON file is required. Use --input <file.json>.");
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

  process.stdout.write(
    `${JSON.stringify(extractKeyPaths(document), null, 2)}\n`,
  );
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Unexpected failure.";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
