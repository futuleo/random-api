# Working in this repository

## Commands

- Use Node.js 24 and pnpm (the exact versions are in `.node-version` and `package.json`).
- Install with `pnpm install --frozen-lockfile`.
- Start the website with `pnpm dev`.
- Start the standalone REST backend with `pnpm dev:api`.
- Run `pnpm check` before handing off code changes. For focused iteration, use
  `pnpm test -- <test-file>`, `pnpm typecheck`, or `pnpm lint`.
- Run `pnpm format` after editing files.

## Architecture

- `packages/core`: platform-independent, local JSON analysis and seeded synthetic
  data generation. No networking, filesystem, UI, environment variables, or providers.
- `packages/llm`: keys-only request construction and future provider adapters.
  Never depend on application code.
- `apps/web`: React/Vite browser application. Input stays in the browser.
- `apps/cli`: Node.js command-line adapter. Keep domain logic in shared packages.
- `apps/api`: Fastify REST adapter using the same core. Accept only key paths and
  explicit generation settings in future generation endpoints, never original
  JSON documents. Keep the web app usable without the backend.
- A future Tauri desktop shell will reuse the web UI and shared packages. Do not
  add a separate desktop implementation of domain logic.
- Use ESM, strict TypeScript, and `workspace:*` for internal dependencies.
- Keep tooling simple; do not introduce a task orchestrator until it is needed.

## Privacy contract

- Original JSON values must never leave the device, including through logs,
  analytics, crash reports, server rendering, or LLM requests.
- Only key names and their nesting paths may be sent to an LLM. Do not send
  inferred types, example values, lengths, enum values, or other value-derived
  metadata without an explicit product decision.
- Keys are assumed to be field names. Detecting sensitive data inside key names
  is intentionally out of scope; do not claim that all personal data is protected.
- Construct outbound requests from an explicit keys-only allowlist. Never
  serialize the input document or spread caller objects into a request.
- LLM responses are untrusted configuration, never executable code.
- Never persist API keys in the repository or browser localStorage. Provider
  integration and platform-specific credential storage are not implemented yet.
- Add regression tests using sentinel input values for every outbound payload
  change. Never include real customer data in fixtures.
- Surface failures without logging the source document, source snippets, or secrets.
- The REST scaffold is loopback-only and has no authentication or generation
  endpoints yet. Do not expose it publicly without authentication and resource limits.

## Agent coordination

- `.github/agents/developer.agent.md` implements scoped features and their tests.
- `.github/agents/reviewer.agent.md` provides read-only correctness and privacy
  review; it cannot edit files or execute commands.
- Profiles inherit the selected model; no provider credentials are required by
  these files. Model and tool availability still depend on the execution host.
- Keep small or tightly coupled work in one session. Delegate only concrete,
  independent workstreams, with a bounded scope and an explicit handoff.
- Do not have multiple agents edit the same files concurrently. The coordinator
  owns integration, resolution of conflicting changes and the final pnpm check.
- Do not create branches, commits, pushes or pull requests without user
  authorization. Profiles do not start agents or scheduled work automatically.
