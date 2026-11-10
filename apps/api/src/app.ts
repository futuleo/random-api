import {
  DATASETS,
  EXPORT_FORMATS,
  EXPORT_MEDIA_TYPES,
  type ExportFormat,
  type FieldGenerator,
  GENERATOR_KINDS,
  generateDataset,
  generateRecords,
  LOCALES,
  type Locale,
  MAX_ENUM_VALUE_LENGTH,
  MAX_ENUM_VALUES,
  NUMERIC_LIMIT,
  parseFieldGenerators,
  serializeOutput,
} from "@random-api/core";
import Fastify from "fastify";
import { apiReference } from "./reference.ts";

export function buildApp() {
  const app = Fastify({
    logger: false,
    bodyLimit: 64 * 1024,
    ajv: { customOptions: { removeAdditional: false, coerceTypes: false } },
  });

  let windowStart = Date.now();
  let requests = 0;
  app.addHook("onRequest", async (request, reply) => {
    reply.header("cache-control", "no-store");
    reply.header("x-content-type-options", "nosniff");
    reply.header("x-frame-options", "DENY");
    reply.header("referrer-policy", "no-referrer");
    if (Date.now() - windowStart >= 60_000) {
      windowStart = Date.now();
      requests = 0;
    }
    requests += 1;
    if (requests > 120) {
      return reply
        .code(429)
        .header("retry-after", "60")
        .send({ error: "Local request limit reached." });
    }
    if (
      !["127.0.0.1", "localhost", "::1"].includes(request.hostname) ||
      (request.method === "POST" && request.headers.origin !== undefined)
    ) {
      return reply.code(403).send({ error: "Local clients only." });
    }
  });

  app.get("/", async (_request, reply) => {
    reply.header(
      "content-security-policy",
      "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    );
    return reply.type("text/html; charset=utf-8").send(apiReference);
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

  app.post<{
    Body: {
      seed: string;
      locale: Locale;
      count: number;
      format: ExportFormat;
      fields: FieldGenerator[];
    };
  }>("/generate", {
    schema: {
      body: {
        type: "object",
        additionalProperties: false,
        required: ["seed", "count", "fields"],
        properties: {
          seed: { type: "string", minLength: 1, maxLength: 256 },
          locale: { type: "string", enum: LOCALES, default: "en" },
          count: { type: "integer", minimum: 1, maximum: 1000 },
          format: { type: "string", enum: EXPORT_FORMATS, default: "json" },
          fields: {
            type: "array",
            minItems: 1,
            maxItems: 200,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["path", "generator"],
              properties: {
                path: {
                  type: "array",
                  minItems: 1,
                  maxItems: 99,
                  items: { type: "string", maxLength: 256 },
                },
                generator: {
                  type: "string",
                  enum: GENERATOR_KINDS.filter((kind) => kind !== "auto"),
                },
                min: {
                  type: "integer",
                  minimum: -NUMERIC_LIMIT,
                  maximum: NUMERIC_LIMIT,
                },
                max: {
                  type: "integer",
                  minimum: -NUMERIC_LIMIT,
                  maximum: NUMERIC_LIMIT,
                },
                values: {
                  type: "array",
                  minItems: 1,
                  maxItems: MAX_ENUM_VALUES,
                  uniqueItems: true,
                  items: {
                    type: "string",
                    minLength: 1,
                    maxLength: MAX_ENUM_VALUE_LENGTH,
                  },
                },
              },
            },
          },
        },
      },
    },
    handler: async (request, reply) => {
      let output: string;
      try {
        const result = generateRecords({
          seed: request.body.seed,
          locale: request.body.locale,
          count: request.body.count,
          fields: parseFieldGenerators(request.body.fields),
        });
        output = serializeOutput(result, request.body.format);
      } catch (error) {
        if (error instanceof TypeError || error instanceof RangeError) {
          return reply
            .code(400)
            .send({ error: "Invalid generation settings." });
        }
        throw error;
      }
      return reply.type(EXPORT_MEDIA_TYPES[request.body.format]).send(output);
    },
  });

  app.post<{
    Params: { id: string };
    Body: { seed: string; count: number; locale: Locale; format: ExportFormat };
  }>("/datasets/:id", {
    schema: {
      params: {
        type: "object",
        additionalProperties: false,
        required: ["id"],
        properties: {
          id: { type: "string", enum: DATASETS.map(({ id }) => id) },
        },
      },
      body: {
        type: "object",
        additionalProperties: false,
        required: ["seed", "count"],
        properties: {
          seed: { type: "string", minLength: 1, maxLength: 256 },
          count: { type: "integer", minimum: 1, maximum: 1000 },
          locale: { type: "string", enum: LOCALES, default: "en" },
          format: { type: "string", enum: EXPORT_FORMATS, default: "json" },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const result = generateDataset(request.params.id, {
          seed: request.body.seed,
          count: request.body.count,
          locale: request.body.locale,
        });
        return reply
          .type(EXPORT_MEDIA_TYPES[request.body.format])
          .send(serializeOutput(result, request.body.format));
      } catch (error) {
        if (error instanceof TypeError || error instanceof RangeError)
          return reply
            .code(400)
            .send({ error: "Invalid generation settings." });
        throw error;
      }
    },
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
