import { inspectLocalFields, parseFieldGenerators } from "./fields.js";
import {
  type GenerationOptions,
  generateSyntheticData,
  type JsonValue,
} from "./generate.js";

export function validateRecordCount(count: number): void {
  if (!Number.isInteger(count) || count < 1 || count > 1000) {
    throw new RangeError("Record count must be between 1 and 1000.");
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null)
  );
}

export function isObjectTemplate(input: unknown): boolean {
  return (
    isObject(input) ||
    (Array.isArray(input) && input.length > 0 && input.every(isObject))
  );
}

export function generateSimilarObjects(
  input: unknown,
  options: GenerationOptions & { readonly count: number },
): JsonValue {
  validateRecordCount(options.count);
  if (!isObjectTemplate(input)) {
    throw new TypeError(
      "Object count requires an object or a non-empty array of objects.",
    );
  }
  const samples: unknown[] = Array.isArray(input) ? input : [input];
  const fields = parseFieldGenerators(options.fields ?? []);
  const sourcePaths = new Set(
    inspectLocalFields(input).map((field) => JSON.stringify(field.path)),
  );
  if (fields.some((field) => !sourcePaths.has(JSON.stringify(field.path)))) {
    throw new TypeError(
      "A configured field path does not exist in this input.",
    );
  }
  const selected = samples.slice(0, Math.min(options.count, samples.length));
  const selectedPaths = new Set(
    inspectLocalFields(selected).map((field) => JSON.stringify(field.path)),
  );
  return generateSyntheticData(
    Array.from(
      { length: options.count },
      (_, index) => samples[index % samples.length],
    ),
    {
      seed: options.seed,
      locale: options.locale,
      fields: fields.filter((field) =>
        selectedPaths.has(JSON.stringify(field.path)),
      ),
    },
  );
}
