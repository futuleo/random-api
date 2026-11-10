# Random API / rgen

Local synthetic data generation from your terminal. The command is **`rgen`**.
No accounts, API keys, LLM or network service are needed at runtime.

## Install a built package

Use Node.js 24. From the repository root:

```sh
pnpm package:cli
npm install --global ./apps/cli/randomapi-studio-0.1.0.tgz
rgen --help
```

The package bundles the shared generator; it does not depend on unpublished
workspace packages. `random-api` remains a compatibility alias.

The npm name `randomapi-studio` is a publication target, **not a reservation or
confirmation of publication**. Registry publication requires authorized npm
credentials. This package currently grants no open-source license.

## Examples

```sh
rgen scenarios --locale fi
rgen scenario users --count 30 --locale ru
rgen --scenario orders --count 100 --format csv --output orders.csv
rgen --input source.json
rgen --input source.json --generate --count 20 --fields fields.json
rgen --scenario products --format xml
rgen --scenario audit-logs --format jsonl
```

`--input` without `--generate` inspects key paths. A scenario implies generation.
Output goes to stdout; terminal status goes to stderr. `--output` creates a new
file and refuses to overwrite anything. Never redirect output onto your input.

Use `--fields` for a JSON array of explicit settings:

```json
[
  { "path": ["id"], "generator": "uuid" },
  { "path": ["quantity"], "generator": "number", "min": 1, "max": 20 },
  { "path": ["status"], "generator": "enum", "values": ["pending", "done"] }
]
```

Paths are arrays of literal segments. Fields generate independently; there are no
guarantees of relational integrity, chronological order or unique business IDs.
Seeded UUIDs are fixtures, not security identifiers.

The input stays local. Keys and structure remain; synthetic data is not certified
anonymization. JSON/CSV/XML/JSONL exports contain generated output only.
