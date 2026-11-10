# Random API

A private, local-first synthetic data studio. Choose one of 30 testing scenarios
or import JSON, pick an object count and field generators, and export JSON, CSV,
XML or JSONL.
The website, CLI and
Electron desktop application share one deterministic TypeScript engine.

No accounts, API keys, telemetry or source uploads. All generation runs locally;
no LLM or external generation service is used.
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
pnpm dev:docs           # VitePress documentation on 127.0.0.1:5174
pnpm check              # formatting, lint, types, tests and production builds
pnpm test:desktop       # build and run the actual Electron smoke test
pnpm package:desktop    # unsigned app directory for the current platform
```

Web and desktop commands build their shared dependencies first. The web dev
server does not watch shared-package output: restart it after changing `core`.
The desktop command loads a production React build, not a remote dev URL; restart
it after changes. Electron downloads a platform binary on installation/first run.

## Documentation

`pnpm dev:docs` opens the VitePress site on `127.0.0.1:5174`.
`pnpm docs:build` creates static HTML in `apps/docs/.vitepress/dist`;
`pnpm docs:preview` serves that build on loopback port 4174. For subpath hosting,
build with `DOCS_BASE=/your-prefix/`. Set `VITE_DOCS_URL` at web build time to
link a deployed HTTP(S) documentation site from the developer guide.

English, Finnish, Swedish, Russian and Spanish guides cover each application,
CLI commands, generator settings, exports, architecture and privacy. The
search index is local. All 30 scenario pages per language include actual core
settings, deterministic generated examples and copyable `rgen` commands.

## Data languages

Use **Language** in web/Electron, `--locale en|fi|sv|ru|es` in `rgen`, or
`locale` in core/REST options. Names, synthetic text, scenario labels and
human-readable preset choices use that dictionary. Keys, paths, machine codes
and caller-provided enum choices stay literal. Changing data language preserves
custom source, generator overrides and choice drafts, and clears stale output.
The studio's controls, accessibility labels, guide, notices and validation
messages use the selected language too. JSON keys, format and generator
identifiers remain stable.

## Data studio

The studio opens with the **Users** scenario. A persistent scenario selector
inside **Source JSON** lists all 30 independent presets plus the linked shop.
**Browse 31 scenarios** opens a
searchable gallery organized into People, Commerce, Finance, Work, Content and
Systems. Select a scenario to load its template and editable field mappings, or
paste your own JSON/import a local `.json` file (up to 2 MiB).
Nothing is automatically saved.

1. Choose a scenario or enter your source JSON.
2. Select generators in **Field generators** below the source. **Suggest from keys** uses field
   names only and lets you review the choices before generating.
3. Choose **Objects** (1–1000; default 10) and select **Generate data** in the
   output panel. Preview JSON, CSV, XML or JSONL; copy or export the generated
   output. Each run produces fresh values automatically; no seed setting is
   exposed. Editing the source, count or mappings clears stale output.

On wide screens, source and field settings sit on the left; generation, output
and exports sit on the right. Narrow screens follow the same reading and keyboard
order: source, fields, generation, output, exports.

An object template produces an array of exactly the requested size. For an input
array of objects, samples cycle in their original order; nested arrays retain
their shapes. Non-object roots, empty arrays and mixed arrays still support
shape-preserving generation, but the object-count control is disabled.

Presets include explicit status/category choices and bounded quantities, prices,
ratings and durations. Number fields have editable inclusive integer bounds;
choice fields have an editable list (one nonempty value per line). These settings
are never inferred from original values. Fields remain independent: presets do
not guarantee chronological ordering, coherent totals or relationships.

### Linked shop

Choose **Linked shop** in the same picker, or use:

```sh
rgen datasets --locale ru
rgen dataset shop --count 30 --locale ru --seed demo
curl http://127.0.0.1:3000/datasets/shop \
  -H 'Content-Type: application/json' \
  --data '{"seed":"demo","count":30,"locale":"ru"}'
```

The result is one object containing `users`, `products` and `orders`. Count means
orders (1–1000; CLI default 10). Users number one per three orders and products
one per two, rounded up. References resolve; IDs and emails are unique within
the result; integer EUR-cent totals match line quantities and product prices.
Lifecycle dates match statuses. Pending/paid orders reserve stock, and
`on_hand` equals `reserved` plus `available`. Five orders cover all five statuses.

The studio shows a read-only recipe preview and hides field overrides for this
dataset. Import JSON or select another preset to use custom fields. This is a
synthetic final snapshot, not an inventory ledger, SQL importer or complete shop
simulator: taxes, fees and discounts are not modeled. Fixture IDs can repeat
between datasets. Generic generation from imported JSON does not retain links.
JSON/XML preserve the object; JSONL contains one object line; CSV contains one row
with the three collections as JSON cells. Full guides and generated examples
are available at `/datasets/shop` and its five documentation-language routes.

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
| `number`  | Inclusive integer range; defaults to 0 through 999999     |
| `boolean` | Seeded true/false                                         |
| `enum`    | One of 1–50 explicitly configured unique text values      |

These are test fixtures: names are not exhaustive, fields are generated
independently, and uniqueness/foreign-key relationships are not guaranteed.
Seeded UUIDs and the PRNG must not be used for secrets or security identifiers.

Generation accepts at most 100 levels (root is level 0) and 100000 values,
including containers. Seeds contain 1–256 characters. Custom settings are limited
to 200 unique paths, each with at most 100 segments of up to 256 characters.
Number bounds must be integers within -1000000000 through 1000000000. Enum
choices must be nonempty strings of at most 256 characters.
Local field inspection is also bounded; key inspection alone is not a full schema.

## CLI

The short command is **`rgen`**. Build and install its standalone tarball:

```sh
pnpm package:cli
npm install --global ./apps/cli/randomapi-studio-0.1.0.tgz
rgen --version
rgen scenarios --locale fi
rgen scenario users --count 30 --locale ru
rgen generate -i examples/input.json --count 20 --format xml
rgen inspect -i examples/input.json
```

The tarball bundles core, without unpublished runtime workspace dependencies.
`random-api` remains a compatibility alias. `randomapi-studio` is the proposed
npm package name, **not reserved or published**; npm authentication is required
for publication. No open-source license is granted yet. `pnpm test:cli` verifies
an offline isolated tarball installation and the actual `rgen` executable.

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
IDs, names, categories and descriptions as JSON; it accepts an optional `--locale`.
`--count` / `-n` accepts 1–1000 and requires an object or nonempty array of objects.
Without `--count`, source-file generation preserves the original root shape.
`--seed`, `--field`, `--fields`, `--format` and `--count` require `--generate` or
`--scenario`. Explicit mappings override matching preset mappings.
The default seed is `random-api`, locale is `en`, and export format is `json`.
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
Numeric values, including negative numbers, remain numeric CSV text.

### XML and JSON Lines

`--format xml` preserves JSON types and arbitrary keys using typed elements:
`<data type="array"><item type="object"><field name="id" type="string">...</field></item></data>`.
Null is `type="null"`; empty objects and arrays keep their distinct types. Content
and attribute values are escaped, including whitespace in keys. XML 1.0-invalid
characters cause an explicit error. No DTD or external entities are generated.

`--format jsonl` emits one compact JSON value per root-array element, terminated
by a newline. A non-array root produces one line; an empty array produces an
empty file. Line breaks inside strings are escaped. All four formats are also
available in the web/Electron preview, exports and REST responses.

## Electron desktop

Electron is a thin native shell around `apps/web/dist`. There is no separate
desktop renderer or duplicated component library. It works offline and does not
need the REST service.

The desktop smoke test exercises the real renderer with synthetic sentinel
fixtures: field selection, valid generated formats, exact object counts, fresh
values on repeated generation and
actual JSON/CSV/XML/JSONL downloads, recoverable XML preview errors and language
switching without losing custom settings. Its owned scratch exports are removed after the test;
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
```

Core has no networking, filesystem, UI, environment or provider dependencies.
There is no LLM package or provider integration. Any future external integration
requires an explicit product decision. Original values and locally inferred
metadata must stay on the device. If LLM support is ever introduced, requests
must use an explicit **key-names-and-paths-only** allowlist, never values,
inferred types, lengths, examples or enums, with sentinel regression tests.

Keys are assumed to be field names. Personal data used as a key is not protected.
Generated output preserves identifying structure; nulls remain and generated
booleans/numbers can coincidentally match originals. This is not a guarantee of
anonymity. No API keys, input logging, telemetry or automatic source persistence
are implemented. Provider output must remain untrusted configuration, never code.

## Agent environment

`AGENTS.md` defines architecture, commands and privacy rules.
`.github/github-app.yml` supplies Setup/Web/Desktop/API/Check scripts; review and accept
that app configuration before it takes effect.

The `developer`, read-only `reviewer` and `commit-reviewer` profiles in
`.github/agents` inherit the host's selected model. Before every agent-created
commit, an independent reviewer checks the exact staged changes for correctness,
unnecessary complexity, regressions, privacy leaks and security flaws. Changed
staged content requires a new review; confirmed high-impact defects block the
commit. Commit verified work in small, coherent slices.

These are agent workflow instructions, not a Git hook: profiles do not start
agents automatically or intercept manual commits. Delegate only
independent tasks with non-overlapping file ownership; the coordinator integrates
results and runs `pnpm check`. Reload repository customizations if new profiles
are not visible. GitHub Actions uses the same `pnpm check` command.
