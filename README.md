# Random API

A private, local-first synthetic data studio. Choose one of 30 testing scenarios
or import JSON, pick an object count and field generators, and export JSON or CSV.
The website, CLI and
Electron desktop application share one deterministic TypeScript engine.

No accounts, provider keys, telemetry or source uploads. No LLM is connected.
This is a local MVP, not a certified anonymization product.

## Get started

Use Node.js **24.22.1** (`.node-version`) and **pnpm 10.34.9**.
If needed, install pnpm with `npm install --global pnpm@10.34.9`.
`useNodeVersion` in `pnpm-workspace.yaml` provisions the pinned runtime for scripts.

```sh
pnpm install --frozen-lockfile
pnpm dev                # React website on loopback
pnpm dev:desktop        # Electron app, using the same React UI
pnpm dev:api            # optional REST service on 127.0.0.1:3000
pnpm check              # formatting, lint, types, tests and production builds
pnpm test:desktop       # build and run the actual Electron smoke test
pnpm package:desktop    # unsigned app directory for the current platform
```

Web and desktop commands build their shared dependencies first. The web dev
server does not watch shared-package output: restart it after changing `core`.
The desktop command loads a production React build, not a remote dev URL; restart
it after changes. Electron downloads a platform binary on installation/first run.

## Data studio

The studio opens with the **Users** scenario. **Browse 30 scenarios** opens a
searchable gallery organized into People, Commerce, Finance, Work, Content and
Systems. Select a scenario to load its template and editable field mappings, or
paste your own JSON/import a local `.json` file (up to 2 MiB).
Nothing is automatically saved.

1. Choose **Objects** (1–1000; default 10).
2. Select generators in **Field generators**. **Suggest from keys** uses field
   names only and lets you review the choices before generating.
3. Select **Generate data**. Preview JSON or CSV; copy or export the generated
   output. Each run produces fresh values automatically; no seed setting is
   exposed. Editing the source, count or mappings clears stale output.

An object template produces an array of exactly the requested size. For an input
array of objects, samples cycle in their original order; nested arrays retain
their shapes. Non-object roots, empty arrays and mixed arrays still support
shape-preserving generation, but the object-count control is disabled.

Presets are structural fixtures for common screens and workflows, not full
business simulations. They do not enforce enum values, realistic quantity
ranges, chronological ordering or relationships between records.

Large previews show only the first 20000 characters to keep the interface
responsive; copy and downloads still contain the full generated output.

Auto mode preserves primitive types, nulls, keys, nesting and nested array lengths.
Explicit field generators may change a primitive's type (including null).
Mappings apply to every occurrence of a path across arrays; containers cannot
be replaced by scalar generators. Empty containers remain empty.

| Generator | Output                                                    |
| --------- | --------------------------------------------------------- |
| `auto`    | Type-preserving synthetic token, integer, boolean or null |
| `email`   | Seeded address in the reserved `example.test` domain      |
| `name`    | Full name from a small fictional fixture list             |
| `date`    | UTC ISO timestamp from 2020 through 2029                  |
| `uuid`    | Seeded UUID in v4 format                                  |
| `string`  | `synthetic_` token                                        |
| `number`  | Integer from 0 to 999999                                  |
| `boolean` | Seeded true/false                                         |

These are test fixtures: names are not exhaustive, fields are generated
independently, and uniqueness/foreign-key relationships are not guaranteed.
Seeded UUIDs and the PRNG must not be used for secrets or security identifiers.

Generation accepts at most 100 levels (root is level 0) and 100000 values,
including containers. Seeds contain 1–256 characters. Custom settings are limited
to 200 unique paths, each with at most 100 segments of up to 256 characters.
Local field inspection is also bounded; key inspection alone is not a full schema.

## CLI

Machine-readable output goes to stdout; interactive terminal summaries go to
stderr. Help is styled only in a TTY, and `NO_COLOR=1` disables ANSI color.
For pipelines use `pnpm --silent cli ...` to suppress pnpm's own script banner,
or run the built CLI directly with `node apps/cli/dist/index.js ...`.

```sh
pnpm cli --help
pnpm cli --list-scenarios
pnpm cli --scenario users --count 30
pnpm cli --scenario orders --count 100 --format csv --output orders.csv
pnpm cli --input examples/input.json
pnpm cli --input examples/input.json --generate --count 30 --seed demo \
  --field '["id"]=uuid' --field '["email"]=email'
pnpm cli --input examples/input.json --generate --fields examples/fields.json \
  --format csv --output synthetic.csv
```

Without `--generate`, the CLI prints deduplicated key paths as segment arrays.
`--scenario <id>` generates 10 objects by default without an input file;
`--input` and `--scenario` are mutually exclusive. `--list-scenarios` lists all 30
IDs, names, categories and descriptions as JSON and is used on its own.
`--count` / `-n` accepts 1–1000 and requires an object or nonempty array of objects.
Without `--count`, source-file generation preserves the original root shape.
`--seed`, `--field`, `--fields`, `--format` and `--count` require `--generate` or
`--scenario`. Explicit mappings override matching preset mappings.
The default seed is `random-api` and default export format is `json`.
Seed remains an optional CLI setting for reproducible test fixtures: the same
seed, structure, property order, count and mappings produce the same result.
`--output` / `-o` creates a **new** file and refuses to overwrite anything.
Do not redirect stdout onto the input file: the shell truncates it before the
CLI starts.

`--field` is repeatable and uses a JSON segment array followed by `=generator`.
This keeps literal dots, equal signs and empty keys unambiguous. For more settings,
`--fields` reads a local JSON array:

```json
[
  { "path": ["id"], "generator": "uuid" },
  { "path": ["profile", "email"], "generator": "email" }
]
```

Duplicate, unknown, missing and container-targeting mappings fail explicitly.
Error messages omit source documents, source snippets and input paths.

## JSON and CSV

JSON retains the generated shape. In CSV, a root array becomes rows; any other
root becomes one row. Nested objects flatten to **JSON segment-array headers**,
so `["profile","email"]` and `["profile.email"]` remain distinct. Nested arrays
remain JSON-valued cells rather than silently expanding records.

Columns are the union of paths across rows. Missing values and null produce empty
cells. An empty root array produces an empty CSV. Cells use double-quote escaping
and CRLF row endings. Formula-like cells (`=`, `+`, `-`, `@`, leading tab/CR,
including whitespace-prefixed formulas) receive a leading apostrophe for
spreadsheet safety; this intentionally changes those CSV cell values.

## Electron desktop

Electron is a thin native shell around `apps/web/dist`. There is no separate
desktop renderer or duplicated component library. It works offline and does not
need the REST service.

The desktop smoke test exercises the real renderer with synthetic sentinel
fixtures: field selection, valid generated formats, exact object counts, fresh
values on repeated generation and
actual JSON/CSV downloads. Its owned scratch exports are removed after the test;
failures report only static stage names, never source content.

The renderer is sandboxed with context isolation, no Node integration or preload
bridge, and blocked remote navigation/popups/permissions. The production web
Content Security Policy blocks outgoing connections. Import uses the browser
file picker; exports contain generated data only.

```sh
pnpm package:desktop
# apps/desktop/release/mac-arm64/Random API.app on Apple Silicon macOS

# Platform-specific distributables, on appropriate build hosts:
pnpm --filter @random-api/desktop package:mac
pnpm --filter @random-api/desktop package:win
pnpm --filter @random-api/desktop package:linux
```

Build `core` first when invoking an app-local packaging command directly.
Packages are unsigned development artifacts. Notarization, Windows signing and
automatic updates are not configured. Cross-platform packaging depends on the
host toolchain; a macOS build is not proof of Windows/Linux runtime support.

## Optional REST backend

```sh
pnpm dev:api
curl http://127.0.0.1:3000/health
curl http://127.0.0.1:3000/generate \
  -H 'Content-Type: application/json' \
  -d '{"seed":"demo","count":2,"format":"json","fields":[{"path":["email"],"generator":"email"}]}'
```

Open the loopback root URL for a styled API reference. Set `PORT` for another
port. Production start: `pnpm build`, then `pnpm --filter @random-api/api start`.

`POST /generate` accepts only `seed`, `count`, optional `format` (`json`/`csv`),
and explicit `fields` (`path`/`generator`). It generates new object records; it
does not accept an original document, inferred schema or source array lengths.
All generators except `auto` are supported. Paths must be nonempty and must not
duplicate or overlap. Requests allow 1–1000 records and 1–200 fields; the same
100000-value/depth limit applies to output (root record array adds one level).

The server binds to loopback, disables request logging, caps bodies at 64 KiB,
limits all requests to 120 per minute per service instance, rejects unknown
properties, untrusted hostnames and browser-origin POSTs, and returns generic
errors with `Cache-Control: no-store`. No CORS or authentication is enabled.
**Do not expose it publicly** without authentication and deployment protection.
The website and desktop never send source JSON to this service.

## Architecture and privacy

```text
apps/web           React + Vite data studio and shared desktop renderer
apps/desktop       Secure Electron shell and unsigned packaging
apps/cli           Node.js filesystem/terminal adapter
apps/api           Optional loopback Fastify service
packages/core      Pure field inspection, seeded generation and export
packages/llm       Keys-only serialization; no provider integration
```

Core has no networking, filesystem, UI, environment or provider dependencies.
Local types and shapes must not be reused as LLM payloads. Future LLM requests
may contain **key names and paths only**, not values, inferred types, lengths,
examples or enums. `serializeKeysOnlyRequest` constructs an explicit allowlist;
sentinel tests guard it.

Keys are assumed to be field names. Personal data used as a key is not protected.
Generated output preserves identifying structure; nulls remain and generated
booleans/numbers can coincidentally match originals. This is not a guarantee of
anonymity. No API keys, input logging, telemetry or automatic source persistence
are implemented. Provider output must remain untrusted configuration, never code.

## Agent environment

`AGENTS.md` defines architecture, commands and privacy rules.
`.github/github-app.yml` supplies Setup/Web/Desktop/API/Check scripts; review and accept
that app configuration before it takes effect.

The `developer` and read-only `reviewer` profiles in `.github/agents` inherit the
host's selected model. Profiles do not start agents automatically. Delegate only
independent tasks with non-overlapping file ownership; the coordinator integrates
results and runs `pnpm check`. Reload repository customizations if new profiles
are not visible. GitHub Actions uses the same `pnpm check` command.
