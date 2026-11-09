# Random API

A local-first synthetic data randomizer, starting with a TypeScript monorepo.
The browser and CLI extract JSON key paths and generate seeded synthetic JSON
locally. The browser can download generated JSON. Field-aware generators,
other export formats, LLM providers, and a desktop shell are not implemented yet.
A separate Fastify REST application currently exposes a health endpoint only.

## Development

Use Node.js **24.22.1** (`.node-version`) and **pnpm 10.34.9**. Install pnpm if it
is not available: `npm install --global pnpm@10.34.9`.
`useNodeVersion` in `pnpm-workspace.yaml` also makes pnpm provision the pinned
Node.js runtime for lifecycle and workspace scripts, independently of host shims.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm check
```

`pnpm dev` builds the shared core and starts Vite on loopback. Restart it after
changing the core; live workspace-package rebuilds are not configured yet.

```sh
pnpm cli --input ./example.json
```

By default, the CLI prints deduplicated key paths. Paths use arrays of segments so
literal dots in keys are not confused with nesting. Array indices and lengths
are omitted, and keys from all array elements are merged. This keys-only catalog
is not a full schema and cannot reconstruct array shapes.

## Local generation

Paste JSON into the web app, choose a seed, and select **Generate data**.
**Download JSON** saves only the generated result. Editing input or seed clears
the previous generated result; nothing is automatically persisted.

```sh
pnpm cli --input ./example.json --generate --seed demo
```

The CLI prints generated JSON to stdout; omit `--generate` for key inspection.
The default seed is `random-api`. A seed without `--generate` is rejected.
When redirecting output, do not overwrite the source file with shell redirection:
the shell truncates the destination before the CLI reads it.

`generateSyntheticData` in `packages/core` preserves object keys, nesting, array
lengths, primitive types and nulls. It replaces strings with `synthetic_` tokens,
numbers with integers from 0 to 999999, and booleans with seeded booleans.
Empty arrays and objects stay empty. It does not infer email/date formats,
numeric ranges, uniqueness, relationships or other domain constraints.

Output is reproducible for the same seed, structure and property traversal order,
independently of original string, numeric and boolean values. Types and array
structure are inspected only locally and never sent to an LLM. Generation rejects
non-JSON values, circular references, depth beyond 100 levels (root is level 0),
and more than 100000 values including containers. These limits apply to generation,
not the existing key inspector.

This is not certified anonymization: keys and structure remain, nulls are retained,
and generated booleans or numbers can coincidentally match input values.
Do not treat the output as a guarantee that a document contains no personal data.

## Architecture

```text
apps/web           React + Vite; local browser UI
apps/cli           Node.js CLI; native argument parsing
apps/api           Fastify REST backend; independent deployment
packages/core      Pure, platform-independent JSON analysis and seeded generation
packages/llm       Keys-only serialization; future provider adapters
```

The web and CLI consume the same core; the REST backend is wired to that package
for future generation endpoints. The LLM package depends only on the core's
key-path type. No package currently sends outbound network requests.

## REST backend

```sh
pnpm dev:api
curl http://127.0.0.1:3000/health
```

Set `PORT` to choose another port. The development command watches the API source.
For a production build, run `pnpm build` followed by
`pnpm --filter @random-api/api start`.

The backend is an independent adapter, not a required middleman for browser or
CLI input. Future generation endpoints will accept key paths and explicit
generator settings, not original JSON values. Generated synthetic output may be
returned by the backend; source analysis stays on the client. The keys-only
catalog does not transmit inferred source types or a complete array schema.

Only `GET /health` exists today. The server binds to loopback, disables request
logging, limits request bodies to 64 KiB, and uses generic error responses to
avoid reflecting input. Authentication, rate limits, generation limits, and
deployment configuration must be added before public hosting.

The intended desktop application is a Tauri 2 shell reusing the web interface,
not a separate generator. Rust and desktop build tooling will be introduced when
that application is implemented.

For the next feature layers, keep richer shape/type inference and field-aware
generation local to `core`; let LLMs suggest validated generator configurations
from key names only. Provider responses must never be executed as code.

## Privacy boundary

Original values stay on the device. Only key names and nesting paths may be
sent to future LLM providers; not values, inferred types, examples, lengths, or
enumerations. `serializeKeysOnlyRequest` explicitly constructs this payload and
tests guard against source values and extra properties leaking into it.

Key names are assumed to be field names. If a document uses personal data as a
key, that key is not protected by this contract. This is not a claim of certified
anonymization.

Do not add input logging, telemetry, source snippets in parse errors, server-side
input processing, or automatic persistence. API-key storage and provider network
access need separate platform-specific implementation; the scaffold does not
collect or store credentials.

## Agent environment

`AGENTS.md` documents the architecture, privacy rules, and validation commands.
`.github/github-app.yml` supplies Copilot app instructions plus Setup, Web, and
Check scripts, plus a separate REST API script. Review and accept this configuration
in the app before it takes effect. Setup assumes Node.js and pnpm are already
installed on the execution host; pnpm provisions the pinned runtime for scripts.

GitHub Actions runs formatting/linting, strict type checking, tests, and production
builds with the same `pnpm check` command. No `/init` command is required: the
repository instructions and executable setup are version-controlled files.

Two repository custom-agent profiles live in `.github/agents`: `developer` for
implementation and `reviewer` for read-only review. Both follow `AGENTS.md` and
inherit the host's selected model. The reviewer has only read/search tools;
validation commands belong to the developer or coordinating session.

Select these profiles in a host that supports repository custom agents. They do
not start automatically or enable background orchestration. Use one session for
tightly coupled work; split only independent tasks with non-overlapping file
ownership, and have the coordinator integrate results and run `pnpm check`.
An already running host may need to reload repository customizations before the
new profiles appear.
