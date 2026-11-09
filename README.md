# Random API

A local-first synthetic data randomizer, starting with a TypeScript monorepo.
The current scaffold extracts JSON key paths in the browser and CLI. Synthetic
generation, export formats, LLM providers, and a desktop shell are not implemented yet.
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

The CLI currently prints deduplicated key paths. Paths use arrays of segments so
literal dots in keys are not confused with nesting. Array indices and lengths
are omitted, and keys from all array elements are merged. This keys-only catalog
is not a full schema and cannot reconstruct array shapes.

## Architecture

```text
apps/web           React + Vite; local browser UI
apps/cli           Node.js CLI; native argument parsing
apps/api           Fastify REST backend; independent deployment
packages/core      Pure, platform-independent JSON analysis; future generators
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

For the next feature layers, keep full shape/type inference and seeded synthetic
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
