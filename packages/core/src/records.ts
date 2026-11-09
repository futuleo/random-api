import { type FieldGenerator, parseFieldGenerators } from "./fields.js";
import { generateSyntheticData, type JsonValue } from "./generate.js";
import { validateRecordCount } from "./objects.js";

export interface RecordSettings {
  readonly seed: string;
  readonly count: number;
  readonly fields: readonly FieldGenerator[];
}

export function generateRecords(settings: RecordSettings): JsonValue {
  validateRecordCount(settings.count);
  const fields = parseFieldGenerators(settings.fields);
  if (
    fields.length === 0 ||
    fields.some(
      (field) => field.path.length === 0 || field.generator === "auto",
    )
  ) {
    throw new TypeError(
      "Records require named fields with explicit generators.",
    );
  }
  for (const field of fields) {
    if (
      fields.some(
        (other) =>
          other.path.length < field.path.length &&
          other.path.every((part, index) => field.path[index] === part),
      )
    ) {
      throw new TypeError("Record field paths must not overlap.");
    }
  }
  const template: Record<string, JsonValue> = {};
  for (const field of fields) {
    let node = template;
    for (const [index, segment] of field.path.entries()) {
      if (index === field.path.length - 1) {
        Object.defineProperty(node, segment, {
          value: null,
          enumerable: true,
          writable: true,
          configurable: true,
        });
      } else {
        if (!Object.hasOwn(node, segment)) {
          Object.defineProperty(node, segment, {
            value: {},
            enumerable: true,
            writable: true,
            configurable: true,
          });
        }
        const child = node[segment];
        if (
          child === null ||
          typeof child !== "object" ||
          Array.isArray(child)
        ) {
          throw new TypeError("Record field paths must not overlap.");
        }
        node = child;
      }
    }
  }
  return generateSyntheticData(
    Array.from({ length: settings.count }, () => template),
    { seed: settings.seed, fields },
  );
}
