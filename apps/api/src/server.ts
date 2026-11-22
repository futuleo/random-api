import { buildApp } from "./app.ts";
import { loadApiSettings } from "./config.ts";

try {
  const settings = await loadApiSettings(process.env);
  const app = buildApp(settings);
  try {
    const address = await app.listen({
      port: settings.port,
      host: settings.host,
    });
    process.stdout.write(`API listening at ${address}\n`);
    for (const signal of ["SIGINT", "SIGTERM"] as const) {
      process.once(signal, () => {
        app.close().catch(() => {
          process.stderr.write("Could not shut down the API cleanly.\n");
          process.exitCode = 1;
        });
      });
    }
  } catch {
    process.stderr.write(
      "Could not start the API. Check the port and try again.\n",
    );
    process.exitCode = 1;
  }
} catch (error) {
  process.stderr.write(
    `${error instanceof Error ? error.message : "Invalid API configuration."}\n`,
  );
  process.exitCode = 1;
}
