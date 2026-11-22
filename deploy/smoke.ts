import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { request as httpRequest } from "node:http";
import { request } from "node:https";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

function run(
  command: string,
  args: string[],
  environment = process.env,
  allowedStatuses = [0],
): string {
  const result = spawnSync(command, args, {
    env: environment,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
    timeout: 10 * 60 * 1000,
  });
  if (result.status === null || !allowedStatuses.includes(result.status))
    throw new Error(`${command} failed:\n${result.stderr || result.stdout}`);
  return result.stdout;
}

async function freePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  assert(address !== null && typeof address === "object");
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  return address.port;
}

const dockerHost = run("docker", [
  "context",
  "inspect",
  "--format",
  "{{.Endpoints.docker.Host}}",
]).trim();
assert(
  dockerHost.startsWith("unix://"),
  "Deployment smoke requires a local Docker engine.",
);
assert(
  !process.env.DOCKER_HOST || process.env.DOCKER_HOST.startsWith("unix://"),
  "Refusing a remote Docker host.",
);
const directory = await mkdtemp(join(tmpdir(), "random-api-deployment-"));
const key = randomBytes(32).toString("hex");
const keyFile = join(directory, "api-key");
const certificateFile = join(directory, "certificate.pem");
const tlsKeyFile = join(directory, "tls-key.pem");
const httpPort = await freePort();
const tlsPort = await freePort();
const project = `random-api-smoke-${randomBytes(6).toString("hex")}`;
const environment = {
  ...process.env,
  API_KEY_FILE: keyFile,
  PUBLIC_API_URL: `http://127.0.0.1:${httpPort}/api/`,
  HTTP_BIND: "127.0.0.1",
  HTTP_PORT: String(httpPort),
  HTTPS_BIND: "127.0.0.1",
  HTTPS_PORT: String(tlsPort),
  RUNTIME_UID: String(process.getuid?.() || 1000),
  RUNTIME_GID: String(process.getgid?.() || 1000),
  TLS_CERT_FILE: certificateFile,
  TLS_KEY_FILE: tlsKeyFile,
};
const files = ["-f", "deploy/compose.yml"];
const tlsFiles = [...files, "-f", "deploy/compose.tls.yml"];
function compose(args: string[], tls = false, allowedStatuses = [0]): string {
  return run(
    "docker",
    [
      "compose",
      "--project-name",
      project,
      ...(tls ? tlsFiles : files),
      ...args,
    ],
    environment,
    allowedStatuses,
  );
}
const base = `http://127.0.0.1:${httpPort}`;
function api(
  path: string,
  options: {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
  } = {},
): Promise<Response> {
  // Native HTTP preserves explicit Host probes; fetch normalizes that header.
  return new Promise((resolve, reject) => {
    const connection = httpRequest(
      `${base}/api/${path}`,
      {
        method: options.method ?? "GET",
        headers: { host: `127.0.0.1:${httpPort}`, ...options.headers },
      },
      (response) => {
        if (response.statusCode === undefined) {
          response.resume();
          reject(new Error("HTTP response is missing its status."));
          return;
        }
        const status = response.statusCode;
        const headers = new Headers();
        for (const [name, value] of Object.entries(response.headers)) {
          if (Array.isArray(value))
            for (const entry of value) headers.append(name, entry);
          else if (value !== undefined) headers.set(name, value);
        }
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk: string) => {
          body += chunk;
        });
        response.once("error", reject);
        response.once("end", () =>
          resolve(new Response(body, { status, headers })),
        );
      },
    );
    connection.setTimeout(10_000, () =>
      connection.destroy(new Error("HTTP request timed out.")),
    );
    connection.once("error", reject);
    connection.end(options.body);
  });
}
const generation = {
  seed: "deployment-test",
  count: 2,
  fields: [{ path: ["name"], generator: "name" }],
};
let tlsEnabled = false;
try {
  await writeFile(keyFile, `${key}\n`, { mode: 0o600 });
  console.log("Building isolated deployment images...");
  compose(["build", "--quiet"]);
  compose(["up", "--detach", "--wait", "--wait-timeout", "120"]);
  const configuration = JSON.parse(compose(["config", "--format", "json"]));
  assert.equal(configuration.services.api.ports, undefined);
  assert.equal(configuration.services["api-nginx"].ports, undefined);
  for (const service of ["api", "api-nginx", "web"]) {
    assert.equal(configuration.services[service].read_only, true);
    assert(
      Number(compose(["exec", "-T", service, "id", "-u"]).trim()) > 0,
      "Every running service must be unprivileged.",
    );
  }
  const license = await readFile("LICENSE", "utf8");
  assert.equal(
    compose(["exec", "-T", "api", "cat", "/opt/api/LICENSE"]),
    license,
  );
  assert.equal(
    compose([
      "exec",
      "-T",
      "api-nginx",
      "cat",
      "/usr/share/licenses/random-api/LICENSE",
    ]),
    license,
  );
  const homepage = await fetch(base);
  assert.equal(homepage.status, 200);
  const html = await homepage.text();
  assert(html.includes("connect-src &#39;none&#39;"));
  assert.equal((await fetch(`${base}/LICENSE.txt`)).status, 200);
  for (const locale of ["", "fi/", "sv/", "ru/", "es/"]) {
    const docs = await fetch(`${base}/docs/${locale}deployment`);
    assert.equal(docs.status, 200);
    assert((await docs.text()).includes("API_KEY_FILE"));
  }
  assert.equal(
    await (await fetch(`${base}/docs/LICENSE.txt`)).text(),
    await readFile("LICENSE", "utf8"),
  );
  for (const path of ["/api", "/docs"]) {
    const redirect = await fetch(`${base}${path}`, { redirect: "manual" });
    assert.equal(redirect.status, 308);
    assert.equal(
      new URL(redirect.headers.get("location") ?? "", base).href,
      `${base}${path}/`,
    );
  }
  const reference = await api("");
  assert.equal(reference.status, 200);
  const referenceHtml = await reference.text();
  assert(referenceHtml.includes(environment.PUBLIC_API_URL));
  assert(!referenceHtml.includes(key));
  assert.equal((await api("health")).status, 200);
  const unauthorized = await api("generate", {
    method: "POST",
    body: JSON.stringify(generation),
    headers: { "content-type": "application/json" },
  });
  assert.equal(unauthorized.status, 401);
  const authorizedHeaders = {
    "content-type": "application/json",
    authorization: `Bearer ${key}`,
  };
  const generated = await api("generate", {
    method: "POST",
    body: JSON.stringify(generation),
    headers: authorizedHeaders,
  });
  assert.equal(generated.status, 200);
  assert.equal((await generated.json()).length, 2);
  const shop = await api("datasets/shop", {
    method: "POST",
    body: JSON.stringify({ seed: "test", count: 2 }),
    headers: authorizedHeaders,
  });
  assert.equal(shop.status, 200);
  const source = await api("generate", {
    method: "POST",
    body: JSON.stringify({
      ...generation,
      source: { original: "PRIVATE_SOURCE_SENTINEL" },
    }),
    headers: authorizedHeaders,
  });
  assert.equal(source.status, 400);
  assert(!(await source.text()).includes("PRIVATE_SOURCE_SENTINEL"));
  const origin = await api("generate", {
    method: "POST",
    body: JSON.stringify(generation),
    headers: { ...authorizedHeaders, origin: "https://example.invalid" },
  });
  assert.equal(origin.status, 403);
  const host = await api("health", { headers: { host: "attacker.invalid" } });
  assert.equal(host.status, 403);
  const large = await api("generate", {
    method: "POST",
    body: JSON.stringify({ source: "BODY_SOURCE_SENTINEL".repeat(4000) }),
    headers: authorizedHeaders,
  });
  assert.equal(large.status, 413);
  assert(!(await large.text()).includes("BODY_SOURCE_SENTINEL"));
  compose([
    "up",
    "--detach",
    "--force-recreate",
    "--wait",
    "--wait-timeout",
    "120",
  ]);
  for (let index = 0; index < 12; index += 1) {
    const response = await api("health", {
      headers: {
        "x-forwarded-for": `198.51.100.${index + 1}`,
        "x-real-ip": `198.51.100.${index + 1}`,
      },
    });
    assert.equal(
      response.status,
      index < 11 ? 200 : 429,
      "Caller forwarding headers must not bypass the per-client burst limit.",
    );
    if (response.status === 429)
      assert.equal(response.headers.get("retry-after"), "2");
  }
  await delay(2200);
  assert.equal(
    (await api("health")).status,
    200,
    "30/minute limiter must refill after two seconds.",
  );
  const logs = compose(["logs", "--no-color"]);
  for (const sentinel of [
    key,
    "PRIVATE_SOURCE_SENTINEL",
    "BODY_SOURCE_SENTINEL",
  ])
    assert(
      !logs.includes(sentinel),
      "Logs must not contain credentials or source values.",
    );
  const builtFiles = compose(
    ["exec", "-T", "web", "grep", "-R", "-l", key, "/usr/share/nginx/html"],
    false,
    [0, 1],
  );
  assert.equal(builtFiles, "");

  run("openssl", [
    "req",
    "-x509",
    "-newkey",
    "rsa:2048",
    "-nodes",
    "-keyout",
    tlsKeyFile,
    "-out",
    certificateFile,
    "-days",
    "1",
    "-subj",
    "/CN=localhost",
    "-addext",
    "subjectAltName=DNS:localhost,IP:127.0.0.1",
  ]);
  environment.PUBLIC_API_URL = `https://localhost:${tlsPort}/api/`;
  tlsEnabled = true;
  compose(
    ["up", "--detach", "--force-recreate", "--wait", "--wait-timeout", "120"],
    true,
  );
  const tlsConfiguration = JSON.parse(
    compose(["config", "--format", "json"], true),
  );
  assert.equal(tlsConfiguration.services.web.ports.length, 1);
  assert.equal(tlsConfiguration.services.web.ports[0].target, 8443);
  const certificate = await readFile(certificateFile);
  const securedCall = (path: string, payload?: string, authorize = false) =>
    new Promise<{
      status: number;
      hsts: string | string[] | undefined;
      location: string | undefined;
      body: string;
    }>((resolve, reject) => {
      const connection = request(
        {
          hostname: "127.0.0.1",
          servername: "localhost",
          port: tlsPort,
          path,
          ca: certificate,
          method: payload === undefined ? "GET" : "POST",
          headers: {
            host: `localhost:${tlsPort}`,
            "content-type": "application/json",
            ...(authorize ? { authorization: `Bearer ${key}` } : {}),
          },
        },
        (response) => {
          let body = "";
          response.setEncoding("utf8");
          response.on("data", (chunk: string) => {
            body += chunk;
          });
          response.once("end", () =>
            resolve({
              status: response.statusCode ?? 0,
              hsts: response.headers["strict-transport-security"],
              location: response.headers.location,
              body,
            }),
          );
        },
      );
      connection.setTimeout(10_000, () =>
        connection.destroy(new Error("HTTPS request timed out.")),
      );
      connection.once("error", reject);
      connection.end(payload);
    });
  const secured = await securedCall("/api/health");
  assert.equal(secured.status, 200);
  assert.equal(secured.hsts, "max-age=31536000");
  assert.deepEqual(JSON.parse(secured.body), { status: "ok" });
  assert.equal(
    (await securedCall("/api/generate", JSON.stringify(generation))).status,
    401,
  );
  const securedGeneration = await securedCall(
    "/api/generate",
    JSON.stringify(generation),
    true,
  );
  assert.equal(securedGeneration.status, 200);
  assert.equal(JSON.parse(securedGeneration.body).length, 2);
  const securedBase = new URL(environment.PUBLIC_API_URL).origin;
  for (const path of ["/api", "/docs"]) {
    const redirect = await securedCall(path);
    assert.equal(redirect.status, 308);
    assert.equal(
      new URL(redirect.location ?? "", securedBase).href,
      `${securedBase}${path}/`,
    );
  }
  console.log(
    "Deployment smoke passed: static site/docs, authenticated REST, privacy, limits and verified HTTPS.",
  );
} catch (error) {
  const diagnostics = compose(
    ["logs", "--no-color", "--tail", "30"],
    tlsEnabled,
  );
  console.error(
    diagnostics
      .replaceAll(key, "[redacted]")
      .replaceAll("PRIVATE_SOURCE_SENTINEL", "[redacted]")
      .replaceAll("BODY_SOURCE_SENTINEL", "[redacted]"),
  );
  throw error;
} finally {
  try {
    compose(
      ["down", "--remove-orphans", "--rmi", "local", "--timeout", "5"],
      tlsEnabled,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
