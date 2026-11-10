import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const directory = await mkdtemp(join(tmpdir(), "rgen-package-"));
let stage = "pack";

function runPnpm(args: string[], cwd = root) {
  const entry = process.env.npm_execpath;
  if (!entry) throw new Error("Run the CLI package smoke with pnpm test:cli.");
  return /\.(?:c|m)?js$/.test(entry)
    ? run(process.execPath, [entry, ...args], cwd)
    : run(entry, args, cwd);
}

function run(command: string, args: string[], cwd = directory) {
  const result = spawnSync(command, args, {
    cwd,
    env: { ...process.env, NODE_PATH: "", NO_COLOR: "1" },
    encoding: "utf8",
    timeout: 120_000,
  });
  if (result.error || result.status !== 0) {
    const setupFailure =
      stage === "pack" || stage === "offline isolated installation";
    throw new Error(
      `CLI package smoke failed: ${stage}.${setupFailure ? `\n${result.stderr || result.error?.message || result.status}` : ""}`,
    );
  }
  return result.stdout;
}

try {
  runPnpm(
    ["--filter", "randomapi-studio", "pack", "--pack-destination", directory],
    root,
  );
  const archives = (await readdir(directory)).filter((file) =>
    file.endsWith(".tgz"),
  );
  assert.equal(archives.length, 1);
  const archive = archives[0];
  if (archive === undefined) throw new Error("Missing CLI tarball.");
  stage = "offline isolated installation";
  const prefix = join(directory, "installed");
  await mkdir(prefix);
  runPnpm(["init"], prefix);
  runPnpm(
    ["add", "--offline", "--ignore-scripts", join(directory, archive)],
    prefix,
  );
  const manifest = JSON.parse(
    await readFile(
      join(prefix, "node_modules/randomapi-studio/package.json"),
      "utf8",
    ),
  );
  assert.deepEqual(Object.keys(manifest.dependencies ?? {}), []);
  const command = join(prefix, "node_modules", ".bin", "rgen");
  stage = "installed executable";
  assert.equal(run(command, ["--version"]).trim(), manifest.version);
  assert.match(run(command, ["--help"]), /rgen <command>/);
  assert.equal(
    JSON.parse(run(command, ["scenarios", "--locale", "fi"])).length,
    30,
  );
  stage = "localized standalone generation";
  const result = run(command, [
    "scenario",
    "users",
    "--locale",
    "ru",
    "-n",
    "7",
  ]);
  const rows = JSON.parse(result);
  assert.equal(rows.length, 7);
  assert.match(rows[0].name, /^[А-Яа-яЁё]+ [А-Яа-яЁё]+$/);
  for (const format of ["json", "csv", "xml", "jsonl"]) {
    const output = join(directory, `export.${format}`);
    run(command, [
      "scenario",
      "products",
      "--format",
      format,
      "-n",
      "3",
      "-o",
      output,
    ]);
    assert.ok((await readFile(output, "utf8")).length > 0);
    const duplicate = spawnSync(
      command,
      ["scenario", "products", "-o", output],
      {
        cwd: directory,
        encoding: "utf8",
        timeout: 10_000,
      },
    );
    assert.equal(duplicate.status, 1);
  }
  stage = "local input privacy";
  const input = join(directory, "input.json");
  await writeFile(
    input,
    JSON.stringify({ name: "PACKED_SENTINEL", value: 987654321 }),
  );
  const generated = run(command, ["generate", "-i", input, "-n", "3"]);
  assert.equal(JSON.parse(generated).length, 3);
  assert.ok(
    !generated.includes("PACKED_SENTINEL") && !generated.includes("987654321"),
  );
  assert.ok((await readFile(input, "utf8")).includes("PACKED_SENTINEL"));
  process.stdout.write(
    "Standalone rgen tarball smoke passed (offline isolated install).\n",
  );
} finally {
  await rm(directory, { recursive: true, force: true });
}
