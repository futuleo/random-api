export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface GenerationOptions {
  readonly seed: string;
  readonly fields?: readonly FieldGenerator[];
}

const MAX_DEPTH = 100;
const MAX_NODES = 100_000;

export function generateSyntheticData(
  input: unknown,
  options: GenerationOptions,
): JsonValue {
  if (typeof options?.seed !== "string" || options.seed.length === 0) {
    throw new TypeError("A non-empty string seed is required.");
  }
  if (options.seed.length > 256) {
    throw new RangeError("Seed must contain at most 256 characters.");
  }
  const settings = parseFieldGenerators(options.fields ?? []);
  const generators = new Map(
    settings.map((field) => [JSON.stringify(field.path), field.generator]),
  );
  const matched = new Set<string>();

  let state = 2166136261;
  for (let index = 0; index < options.seed.length; index += 1) {
    state = Math.imul(state ^ options.seed.charCodeAt(index), 16777619) >>> 0;
  }

  function random(): number {
    // Mulberry32 keeps seeded output identical in browsers and Node.js.
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

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
    const kind = generators.get(id);
    if (kind !== undefined) matched.add(id);
    if (kind !== undefined && kind !== "auto" && !Array.isArray(value)) {
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
      return generateFieldValue(kind, random);
    }
    if (value === null) return null;
    if (typeof value === "string") {
      return `synthetic_${Math.floor(random() * 4294967296).toString(36)}`;
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
