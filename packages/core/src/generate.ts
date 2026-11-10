export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface GenerationOptions {
  readonly seed: string;
  readonly locale?: Locale | undefined;
  readonly fields?: readonly FieldGenerator[];
}

const MAX_DEPTH = 100;
const MAX_NODES = 100_000;

export function generateSyntheticData(
  input: unknown,
  options: GenerationOptions,
): JsonValue {
  const random = createSeededRandom(options?.seed);
  const settings = parseFieldGenerators(options.fields ?? []);
  const locale = parseLocale(options.locale);
  const generators = new Map(
    settings.map((field) => [JSON.stringify(field.path), field]),
  );
  const matched = new Set<string>();

  const ancestors = new WeakSet<object>();
  let nodes = 0;

  function generate(value: unknown, depth: number, path: KeyPath): JsonValue {
    nodes += 1;
    if (depth > MAX_DEPTH || nodes > MAX_NODES) {
      throw new RangeError(
        "Input exceeds generation limits (100 levels or 100000 values).",
      );
    }

    const id = JSON.stringify(path);
    const field = generators.get(id);
    if (field !== undefined) matched.add(id);
    if (
      field !== undefined &&
      field.generator !== "auto" &&
      !Array.isArray(value)
    ) {
      if (value !== null && typeof value === "object") {
        throw new TypeError("Field generators must target primitive values.");
      }
      if (
        value !== null &&
        (!["string", "number", "boolean"].includes(typeof value) ||
          (typeof value === "number" && !Number.isFinite(value)))
      ) {
        throw new TypeError("Input must contain only JSON-compatible values.");
      }
      return generateFieldValue(field, random, locale);
    }
    if (value === null) return null;
    if (typeof value === "string") {
      return generateFieldValue({ generator: "string" }, random, locale);
    }
    if (typeof value === "boolean") return random() >= 0.5;
    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.floor(random() * 1_000_000);
    }
    if (
      typeof value !== "object" ||
      (!Array.isArray(value) &&
        Object.getPrototypeOf(value) !== Object.prototype &&
        Object.getPrototypeOf(value) !== null)
    ) {
      throw new TypeError("Input must contain only JSON-compatible values.");
    }
    if (ancestors.has(value)) {
      throw new TypeError("Input must not contain circular references.");
    }

    ancestors.add(value);
    const result = Array.isArray(value)
      ? Array.from(value, (item) => generate(item, depth + 1, path))
      : Object.fromEntries(
          Object.entries(value).map(([key, child]) => [
            key,
            generate(child, depth + 1, [...path, key]),
          ]),
        );
    ancestors.delete(value);
    return result;
  }

  const result = generate(input, 0, []);
  if (matched.size !== generators.size) {
    throw new TypeError(
      "A configured field path does not exist in this input.",
    );
  }
  return result;
}

import {
  type FieldGenerator,
  generateFieldValue,
  parseFieldGenerators,
} from "./fields.js";
import type { KeyPath } from "./index.js";
import { type Locale, parseLocale } from "./locale.js";
import { createSeededRandom } from "./random.js";
