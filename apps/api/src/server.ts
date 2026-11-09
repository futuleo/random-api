import { buildApp } from "./app.ts";

const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  process.stderr.write("PORT must be an integer between 1 and 65535.\n");
  process.exitCode = 1;
} else {
  const app = buildApp();
  try {
    const address = await app.listen({ port, host: "127.0.0.1" });
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
}
