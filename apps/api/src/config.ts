import { readFile } from "node:fs/promises";

export type ApiSettings =
  | { mode: "local"; host: "127.0.0.1"; port: number }
  | {
      mode: "public";
      host: "0.0.0.0";
      port: number;
      apiKey: string;
      publicUrl: URL;
    };

export function parseApiSettings(environment: NodeJS.ProcessEnv): ApiSettings {
  const port = Number(environment.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new RangeError("PORT must be an integer between 1 and 65535.");
  const mode = environment.API_MODE ?? "local";
  if (mode === "local") {
    if (
      environment.API_KEY !== undefined ||
      environment.PUBLIC_API_URL !== undefined
    )
      throw new TypeError(
        "API_KEY and PUBLIC_API_URL require API_MODE=public.",
      );
    return { mode, host: "127.0.0.1", port };
  }
  if (mode !== "public")
    throw new TypeError("API_MODE must be local or public.");
  const apiKey = environment.API_KEY;
  if (typeof apiKey !== "string" || !/^[\x21-\x7e]{32,256}$/.test(apiKey))
    throw new TypeError("Public API requires a 32–256 character API_KEY.");
  let publicUrl: URL;
  try {
    publicUrl = new URL(environment.PUBLIC_API_URL ?? "");
  } catch {
    throw new TypeError("Public API requires a valid PUBLIC_API_URL.");
  }
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(
    publicUrl.hostname,
  );
  if (
    (publicUrl.protocol !== "https:" &&
      !(publicUrl.protocol === "http:" && loopback)) ||
    publicUrl.username ||
    publicUrl.password ||
    publicUrl.search ||
    publicUrl.hash ||
    !/^\/[a-zA-Z0-9/_-]*$/.test(publicUrl.pathname)
  )
    throw new TypeError(
      "PUBLIC_API_URL must use HTTPS (HTTP only on loopback), without credentials, query or fragment.",
    );
  if (!publicUrl.pathname.endsWith("/")) publicUrl.pathname += "/";
  return { mode, host: "0.0.0.0", port, apiKey, publicUrl };
}

export async function loadApiSettings(
  environment: NodeJS.ProcessEnv,
): Promise<ApiSettings> {
  let key = environment.API_KEY;
  if (environment.API_KEY_FILE !== undefined) {
    if (environment.API_MODE !== "public")
      throw new TypeError("API_KEY_FILE requires API_MODE=public.");
    if (key !== undefined)
      throw new TypeError("Choose API_KEY or API_KEY_FILE, not both.");
    try {
      key = (await readFile(environment.API_KEY_FILE, "utf8")).replace(
        /\r?\n$/,
        "",
      );
    } catch {
      throw new Error("Could not read the API key file.");
    }
  }
  return parseApiSettings({
    PORT: environment.PORT,
    API_MODE: environment.API_MODE,
    PUBLIC_API_URL: environment.PUBLIC_API_URL,
    API_KEY: key,
  });
}
