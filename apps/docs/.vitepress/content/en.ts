import { type GuidePages, snippets } from "./shared";

export const en: GuidePages = {
  index: `---
layout: home
hero:
  name: Random API
  text: Real structure. Synthetic data.
  tagline: Practical documentation for local generation in your browser, on your desktop and in your terminal.
  actions:
    - theme: brand
      text: Start generating
      link: /getting-started
    - theme: alt
      text: Explore 30 scenarios
      link: /scenarios
    - theme: alt
      text: Learn rgen
      link: /cli
features:
  - title: One engine, four entry points
    details: Use the browser or Electron UI, automate with rgen, or opt into the loopback REST adapter. All share the same pure core.
    link: /architecture
  - title: Fixtures you can reproduce
    details: Choose 1–1000 objects, set integer ranges and enum choices, then export JSON, CSV, XML or JSONL.
    link: /generators
  - title: Local by design
    details: No source uploads, account, API key, analytics or LLM integration. Learn the limits of synthetic data before sharing output.
    link: /architecture
---
`,
  "getting-started": `# Getting started

Random API turns a JSON structure into synthetic test data. It is useful for UI prototypes, table pagination, demos and repeatable fixtures. It is **not** an anonymizer or a relational database seeder.

## Choose your interface

| Interface | Best for | Requires the REST service? |
| --- | --- | --- |
| [Web / Electron](/web-desktop) | Inspecting JSON and tuning fields visually | No |
| [rgen CLI](/cli) | Repeatable fixtures, scripts and CI | No |
| [Local REST](/rest) | Explicit keys-only generation from local programs | Yes, opt-in |
| [Core package](/architecture#workspace-packages) | Integration inside this monorepo | No |

## Run from source

Use **Node.js 24** and the pnpm version pinned in the root \`package.json\` (currently 10.34.9). Run these commands from the repository root:
${snippets.setup}
Open the local address printed by Vite. The web application remains usable without \`pnpm dev:api\`.

## Your first dataset

1. Select the **Users** scenario, or paste a small JSON object.
2. Inspect source and field settings on the left. Pick generators and adjust number bounds or enum choices.
3. Set the object count on the right, then generate. Each run uses a fresh hidden seed.
4. Inspect the result, then copy it or export JSON, CSV, XML or JSONL.

For a custom source, save this as \`source.json\`:
${snippets.fixture}
Use \`fields.json\` from the [generator guide](/generators) to make the output intentional rather than relying on inferred generators.

## Generate from the terminal

After [installing the CLI](/cli#installation):
${snippets.cli}
The command is **\`rgen\`**; the product is **Random API**. A preset implies generation. With \`--input\` alone, the CLI only inspects key paths.

## Choose a language

Generation and documentation support English, Finnish, Swedish, Russian and Spanish. The CLI uses \`--locale en|fi|sv|ru|es\`; generation options use \`locale\`. Scenario IDs, field paths and generator identifiers remain stable. Localized names and preset choices are not a promise of country-specific validation.

::: warning Before sharing output
Keys and structure are preserved. Sensitive information in field names is not detected. Fields are independent: an end date can precede a start date and a total need not match line items.
:::

Continue with [web and desktop](/web-desktop), the [CLI reference](/cli), or the complete [scenario catalog](/scenarios).
`,
  "web-desktop": `# Web and desktop

Both interfaces use the same local generation engine. No REST server is required, and original JSON values are not uploaded.

Use **Language** to switch interface captions, notices, scenario labels and supported generated values between English, Finnish, Swedish, Russian and Spanish. Custom JSON keys and field overrides stay intact; changing language clears the previous result so it cannot be confused with new output.

## Browser workflow

Start with \`pnpm dev\` from the repository root. Paste valid JSON or use the file picker, then choose a preset or configure the detected fields.

The **left column** contains the source and field configuration. The **right column** contains object count, generation controls, output and export actions. On narrow screens these sections stack in that semantic order: source → fields → controls → output → exports.

1. Inspect the parsed structure before generating.
2. Set the requested object count; the seed is fresh and automatic.
3. Override a field with email, name, date, UUID, string, number, boolean or enum.
4. For a number, choose inclusive integer bounds; for an enum, provide an explicit set of choices.
5. Generate, inspect, then copy or download the result.

## Shape and count

An object or nonempty array of objects supports a requested count of **1–1000**. Object templates repeat their structure; array templates cycle through source objects. Without an explicit count, shape-preserving generation keeps the original JSON shape, including nested arrays. A primitive, empty array or mixed array is not an object-count template.

Generation is bounded by **100,000 total output values** and **depth 100**. A large nested template can hit the value budget before reaching 1000 objects.

## Electron desktop

The desktop shell loads the built web application locally. It is not a second generator implementation.

\`\`\`sh
pnpm dev:desktop
pnpm package:desktop
\`\`\`

The directory package is a local development artifact. Platform targets are available through the desktop workspace:

\`\`\`sh
pnpm --filter @random-api/desktop package:mac
pnpm --filter @random-api/desktop package:win
pnpm --filter @random-api/desktop package:linux
\`\`\`

::: warning Distribution status
The macOS build is unsigned. Do not treat it as notarized or bypass operating-system protections without reviewing and trusting the source. Windows and Linux packaging scripts exist, but their runtimes have not been verified. A packaging command is not evidence that a platform has been tested.
:::

## Troubleshooting

- **Invalid JSON:** validate commas, quotes and the root value. Errors deliberately omit the source content.
- **Count unavailable:** use an object or a nonempty array containing only objects.
- **Unexpected strings or numbers:** choose an explicit generator instead of \`auto\`.
- **Output too large:** lower the object count or simplify nested arrays.
- **CSV looks flattened:** headers encode JSON segment paths; nested arrays remain JSON cells.

See [generators and exports](/generators) for exact settings and [privacy](/architecture#privacy-contract) before sharing generated files.
`,
  cli: `# rgen CLI

\`rgen\` is the standalone terminal command for Random API. It runs locally and does not start or contact the REST adapter.

## Installation

Use Node.js 24. Install a locally built npm tarball; replace the example filename with the actual artifact:
${snippets.install}
The package bundles its runtime core dependency, so installing the tarball does not require this monorepo. A public npm package name and publication are **not confirmed**. If a package is published later, use \`npm install -g <package-name>\` with its verified name; this is a placeholder, not a published install command.

For source development, run the same arguments through \`pnpm cli\` from the repository root:

\`\`\`sh
pnpm cli --scenario users --count 10 --locale en
\`\`\`

## Everyday commands
${snippets.cli}

## Options

| Option | Meaning |
| --- | --- |
| \`-i, --input <file>\` | Read JSON; inspect key paths unless generation is requested |
| \`--generate\` | Generate synthetic values from the input |
| \`--scenario <id>\` | Generate a built-in scenario; default count 10 |
| \`--list-scenarios\` | List available IDs and labels as JSON; may be combined with locale |
| \`-n, --count <1-1000>\` | Requested number of objects; requires an object template |
| \`--seed <text>\` | Repeatable seed; default \`random-api\` |
| \`--locale en\\|fi\\|sv\\|ru\\|es\` | Select the language for supported generated values and scenario choices |
| \`--fields <file>\` | JSON array of field settings, including number bounds and enum choices |
| \`--field <path=kind>\` | Repeatable shorthand for generators without extra settings |
| \`--format json\\|csv\\|xml\\|jsonl\` | Output format; default JSON |
| \`-o, --output <file>\` | Create a new file; never overwrite an existing one |
| \`-h, --help\` | Show usage |
| \`--version\` | Print CLI version |

Do not combine \`--input\` and \`--scenario\`. Generation-specific options require \`--generate\` or \`--scenario\`. Inspection output is a list of key paths, not generated records.

## Field overrides

Save this as \`fields.json\` and use the matching \`source.json\` from [getting started](/getting-started):
${snippets.fields}
\`\`\`sh
rgen --input source.json --generate --count 50 --fields fields.json --seed qa --locale en --output fixture.json
rgen --scenario users --count 5 --field '["email"]=email'
\`\`\`

Paths are arrays of literal segments. \`["profile","name"]\` is nested; \`["profile.name"]\` is a single key containing a dot. The shell quotes above work in POSIX shells and PowerShell; in Windows Command Prompt prefer \`--fields\` to avoid quote escaping. Use the JSON file for \`enum\` and bounded \`number\` settings. Scenario overrides replace the preset setting for the same path.

## Automation and CI

\`\`\`sh
rgen --scenario orders --count 100 --seed regression-v1 --locale en > orders.json
rgen --scenario users --count 25 --format csv --output users.csv
\`\`\`

Successful output goes to stdout or the requested file; failures go to stderr with a nonzero exit status. Shell redirection can overwrite files, unlike \`--output\`. Pin the CLI version, seed, locale and settings for fixtures. Do not assume stable generated values across package upgrades.

Use [the catalog](/scenarios) to discover all 30 IDs and copy a command for each. Read [export behavior](/generators#export-formats) before using CSV in spreadsheets.
`,
  generators: `# Generators and exports

## Field configuration

Every setting has a \`path\` (an array of string segments) and a \`generator\`. Object keys containing dots are not split automatically. Duplicate paths and unknown setting properties are rejected. At most 200 explicit field settings are accepted.
${snippets.fields}

| Generator | Behavior / settings |
| --- | --- |
| \`auto\` | Use local source shape/type behavior; available for template generation, not keys-only REST |
| \`email\` | Synthetic email address |
| \`name\` | Synthetic person name; locale affects supported values |
| \`date\` | Generated date; no dependency on other date fields |
| \`uuid\` | Generated UUID-shaped identifier |
| \`string\` | Synthetic string |
| \`number\` | Inclusive integer \`min\` / \`max\`; defaults 0 and 999999 |
| \`boolean\` | Generated true/false |
| \`enum\` | Select from explicit \`values\` |

Number bounds must be ordered integers within **−1,000,000,000 to 1,000,000,000**. Enum choices must contain **1–50 unique, nonempty strings**, each at most **256 characters**. These options belong only to their corresponding generator.

::: tip Explicit is predictable
Presets include bounded numbers and enum choices. For your own sources, configure important fields explicitly instead of assuming that a name or source value implies a business rule.
:::

## Reproducibility and language

Use the same seed, locale, core version, template and ordered field configuration to reproduce a dataset. The supported locales are \`en\`, \`fi\`, \`sv\`, \`ru\`, \`es\`. Locale does not rename your JSON keys or change generator identifiers. Explicit caller-provided enum choices are your configuration, not text to translate automatically.

Presets generate fields independently. Names need not match emails; totals need not match quantities; dates need not be chronological. Repeated generation is not a uniqueness guarantee.

## Core usage inside the workspace

The following imports refer to the monorepo's internal \`@random-api/core\` package, not an announced public npm SDK.
${snippets.core}

## Export formats

**JSON** preserves nested objects and arrays. Object-count generation returns an array; source-shape generation without a count preserves the source's overall shape.

**CSV** flattens nested object fields into headers encoded as JSON segment paths. For example, \`["profile","name"]\` identifies a nested field without confusing it with the literal key \`profile.name\`. Nested arrays are serialized as JSON cells. Quoting is applied for CSV delimiters, newlines and quotes.

**JSONL** writes one JSON value per root-array element. Other roots produce one line; an empty array produces an empty file.

**XML** preserves keys and types with \`data\`, \`item\` and \`field name="…"\` elements and \`type\` attributes. Markup is escaped, no DTD is used and XML 1.0-invalid characters are rejected. An XML preview error is recoverable: the source and result remain available in another format.

Treat exports as untrusted text when opening them in spreadsheets or downstream tools. Synthetic values do not remove risks carried by original field names or structure.

## Limits

- Object count: 1–1000.
- Total generated values: 100,000; nesting depth: 100.
- Explicit field settings: at most 200.
- Field paths use string segments; CLI inline paths use JSON array syntax.

Limits can fail a request before the requested count is reached. Reduce the count or template complexity rather than splitting sensitive source data into remote requests.
`,
  rest: `# Optional local REST API

The web app, Electron app and CLI work **without** this service. Start it only when another local program needs keys-only generation:
${snippets.rest}
The default listener is \`127.0.0.1:3000\`. Set \`PORT\` to change the port. The root route provides a small API reference.

## Endpoints

| Method / path | Result |
| --- | --- |
| \`GET /\` | Local HTML reference |
| \`GET /health\` | JSON \`{"status":"ok"}\` |
| \`POST /generate\` | Synthetic JSON, CSV, XML or JSONL |

## Request contract

Send a nonempty seed (at most 256 characters), a count from 1 to 1000 and 1–200 explicit field settings. Optional \`format\` accepts \`json\` (default), \`csv\`, \`xml\` or \`jsonl\`; optional \`locale\` defaults to \`en\`. Explicit number bounds and enum choices are supported. Use concrete generators, not \`auto\`.

Paths contain 1–99 string segments, each at most 256 characters. Shared-prefix conflicts and unsafe object paths can be rejected by core validation.

::: danger Never send the source document
Only send key paths and explicit generation settings. Do not send original JSON, example values, inferred types, lengths, extracted enum choices or any other value-derived metadata.
:::

The minimal example above intentionally uses only \`path\` and \`generator\`. Do not assume that every new core setting is exposed by the REST schema; consult the running root reference and adapter validation before using additional properties.

## Response and failures

Successful responses use \`application/json\`, \`text/csv\`, \`application/xml\` or \`application/x-ndjson\`. Invalid settings or JSON produce 400-class failures without source snippets; rate limiting returns **429** and \`Retry-After\`. Oversized bodies are rejected. Unexpected failures return a generic **500** message.

## Local boundary

- Loopback listener only; allowed hostnames are \`127.0.0.1\`, \`localhost\` and \`::1\`.
- Request body limit: **64 KiB**.
- Request budget: **120 requests per minute** for the process, including health checks.
- POST requests with any browser \`Origin\` header are rejected.
- No authentication, account system, API keys or CORS integration.
- Request logging is disabled; responses are marked \`no-store\`.

Do not expose the listener through a public interface, tunnel, reverse proxy or shared network. Host checks and an Origin restriction are not authentication. This adapter is for local tools, not a production hosted API.
`,
  architecture: `# Architecture and privacy

## Workspace packages

| Location | Responsibility |
| --- | --- |
| \`packages/core\` | Pure analysis and generation; no network, filesystem, UI, environment access or providers |
| \`apps/web\` | Browser UI; local source and field editing |
| \`apps/desktop\` | Electron shell reusing the built web UI |
| \`apps/cli\` | Node.js file/stdin-independent command adapter; domain logic stays in core |
| \`apps/api\` | Optional bounded loopback Fastify REST adapter |
| \`apps/docs\` | Static VitePress documentation and build-time scenario catalog |

All interfaces share the core rather than maintaining separate generation implementations. Scenario pages on this site are generated from \`SCENARIOS\` / \`getScenario\` and actual seeded core output at build time.

## Privacy contract

Original JSON values remain on the device. They must not be sent through logs, analytics, crash reports, server rendering or provider requests. Current generation does not use a network provider or LLM. No account or API key is required.

If a future provider is added, outbound requests must be constructed from an explicit **keys-only allowlist**. Only field names and nesting paths may leave the device; inferred types, example values, lengths, enum values and other value-derived metadata are not permitted without a separate product decision.

**Keys are assumed to be field names.** Sensitive data in key names is intentionally not detected. Preserving structure can reveal information too. Generated output is synthetic replacement data, not a guarantee of anonymization or privacy compliance.

API keys must never be stored in this repository or browser localStorage. Platform-specific credential storage and provider adapters are not implemented. LLM responses, if introduced, must be treated as untrusted configuration, never executable code.

## What stays offline

Generation in the browser, desktop and CLI is local. The REST service is optional and loopback-only. This documentation is prebuilt static HTML with a local search index: reading and searching it does not call an external search service, load a remote font or require a backend. Hosting the site can still create ordinary web-server access logs; that is separate from application source processing.

## Development and verification

\`\`\`sh
pnpm format
pnpm check
pnpm test:desktop
\`\`\`

Run commands from the repository root. The full check covers lint, types, tests and builds; Electron native smoke checks are a separate step. A passing build is not a verified Windows or Linux runtime.

## Build and host this documentation

\`\`\`sh
pnpm --filter @random-api/docs dev
pnpm --filter @random-api/docs build
pnpm --filter @random-api/docs preview
\`\`\`

Publish \`apps/docs/.vitepress/dist\` to a static host. No API server or network access is required during content generation after dependencies are installed. For a subpath, set \`DOCS_BASE=/your-prefix/\` during the build. Keep the trailing slash. The default \`/\` works at a domain root. The site uses ordinary \`.html\` routes rather than requiring custom clean-URL rewrites.
`,
};
