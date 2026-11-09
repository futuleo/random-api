import Fastify from "fastify";

export function buildApp() {
  const app = Fastify({
    logger: false,
    bodyLimit: 64 * 1024,
  });

  app.get("/health", {
    schema: {
      response: {
        200: {
          type: "object",
          additionalProperties: false,
          required: ["status"],
          properties: { status: { type: "string", const: "ok" } },
        },
      },
    },
    handler: async () => ({ status: "ok" as const }),
  });

  app.setNotFoundHandler((_request, reply) => {
    return reply.code(404).send({ error: "Not found." });
  });

  app.setErrorHandler((error, _request, reply) => {
    const status =
      error instanceof Error &&
      "statusCode" in error &&
      typeof error.statusCode === "number" &&
      error.statusCode >= 400 &&
      error.statusCode < 500
        ? error.statusCode
        : 500;
    return reply.code(status).send({
      error: status === 500 ? "Internal server error." : "Invalid request.",
    });
  });

  return app;
}
