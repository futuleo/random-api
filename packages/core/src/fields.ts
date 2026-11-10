import type { KeyPath } from "./index.js";
import { type Locale, NAME_WORDS, TEXT_PREFIX } from "./locale.js";

export const GENERATOR_KINDS = [
  "auto",
  "email",
  "name",
  "date",
  "uuid",
  "string",
  "number",
  "boolean",
  "enum",
] as const;

export type GeneratorKind = (typeof GENERATOR_KINDS)[number];

export type GeneratorSettings =
  | { readonly generator: Exclude<GeneratorKind, "number" | "enum"> }
  | {
      readonly generator: "number";
      readonly min?: number;
      readonly max?: number;
    }
  | { readonly generator: "enum"; readonly values: readonly string[] };

export type FieldGenerator = GeneratorSettings & { readonly path: KeyPath };

export const NUMERIC_LIMIT = 1_000_000_000;
export const MAX_ENUM_VALUES = 50;
export const MAX_ENUM_VALUE_LENGTH = 256;

export interface LocalField {
  readonly path: KeyPath;
  readonly types: readonly string[];
}

export function isGeneratorKind(value: unknown): value is GeneratorKind {
  return GENERATOR_KINDS.some((kind) => kind === value);
}

export function parseFieldGenerators(input: unknown): FieldGenerator[] {
  if (!Array.isArray(input) || input.length > 200) {
    throw new TypeError("Expected at most 200 field generator settings.");
  }
  const seen = new Set<string>();
  return input.map((item: unknown) => {
    if (
      item === null ||
      typeof item !== "object" ||
      !("path" in item) ||
      !("generator" in item) ||
      !Array.isArray(item.path) ||
      item.path.length > 100 ||
      !item.path.every(
        (segment: unknown) =>
          typeof segment === "string" && segment.length <= 256,
      ) ||
      !isGeneratorKind(item.generator)
    ) {
      throw new TypeError(
        "Each field setting must contain only a string-segment path and a supported generator.",
      );
    }
    const allowed = [
      "path",
      "generator",
      ...(item.generator === "number"
        ? ["min", "max"]
        : item.generator === "enum"
          ? ["values"]
          : []),
    ];
    if (Object.keys(item).some((key) => !allowed.includes(key))) {
      throw new TypeError("Field settings contain unsupported properties.");
    }
    const path: string[] = item.path.map((segment: string) => segment);
    const id = JSON.stringify(path);
    if (seen.has(id)) {
      throw new TypeError("Field generator paths must be unique.");
    }
    seen.add(id);
    if (item.generator === "number") {
      const min = "min" in item ? item.min : 0;
      const max = "max" in item ? item.max : 999_999;
      if (
        typeof min !== "number" ||
        typeof max !== "number" ||
        !Number.isInteger(min) ||
        !Number.isInteger(max) ||
        min < -NUMERIC_LIMIT ||
        max > NUMERIC_LIMIT ||
        min > max
      ) {
        throw new RangeError(
          "Number settings require ordered integer bounds between -1000000000 and 1000000000.",
        );
      }
      return { path, generator: "number", min, max };
    }
    if (item.generator === "enum") {
      const values = "values" in item ? item.values : undefined;
      if (
        !Array.isArray(values) ||
        values.length < 1 ||
        values.length > MAX_ENUM_VALUES ||
        !values.every(
          (value: unknown) =>
            typeof value === "string" &&
            value.trim().length > 0 &&
            value.length <= MAX_ENUM_VALUE_LENGTH,
        ) ||
        new Set(values).size !== values.length
      ) {
        throw new TypeError(
          "Enum settings require 1–50 unique, nonempty strings of at most 256 characters.",
        );
      }
      return {
        path,
        generator: "enum",
        values: values.map((value: string) => value),
      };
    }
    return { path, generator: item.generator };
  });
}

export function suggestGenerator(
  path: KeyPath,
): Exclude<GeneratorKind, "enum"> {
  const key = (path.at(-1) ?? "").toLowerCase().replace(/[-_\s]/g, "");
  if (key.includes("email")) return "email";
  if (["name", "fullname", "firstname", "lastname"].includes(key))
    return "name";
  if (key === "id" || key.endsWith("uuid")) return "uuid";
  if (
    [
      "date",
      "createdat",
      "updatedat",
      "deletedat",
      "birthdate",
      "birthday",
      "timestamp",
      "startdate",
      "enddate",
    ].includes(key)
  )
    return "date";
  return "auto";
}

export function inspectLocalFields(input: unknown): LocalField[] {
  const fields = new Map<string, { path: KeyPath; types: Set<string> }>();
  const ancestors = new WeakSet<object>();
  let nodes = 0;
  function visit(value: unknown, path: KeyPath, depth: number): void {
    nodes += 1;
    if (depth > 100 || nodes > 100_000) {
      throw new RangeError("Input exceeds inspection limits.");
    }
    if (value !== null && typeof value === "object") {
      if (ancestors.has(value)) {
        throw new TypeError("Input must not contain circular references.");
      }
      ancestors.add(value);
      if (Array.isArray(value)) {
        for (const child of value) visit(child, path, depth + 1);
      } else {
        for (const [key, child] of Object.entries(value)) {
          visit(child, [...path, key], depth + 1);
        }
      }
      ancestors.delete(value);
      return;
    }
    const id = JSON.stringify(path);
    const field = fields.get(id) ?? { path, types: new Set<string>() };
    field.types.add(value === null ? "null" : typeof value);
    fields.set(id, field);
  }
  visit(input, [], 0);
  return [...fields.values()].map(({ path, types }) => ({
    path,
    types: [...types],
  }));
}

export function generateFieldValue(
  setting: GeneratorSettings,
  random: () => number,
  locale: Locale = "en",
): string | number | boolean {
  const token = () => Math.floor(random() * 4294967296).toString(36);
  switch (setting.generator) {
    case "email":
      return `user.${token()}@example.test`;
    case "name": {
      const words = NAME_WORDS[locale];
      const firstIndex = Math.floor(random() * words.first.length);
      const last = words.last[Math.floor(random() * words.last.length)];
      const family =
        locale === "ru" && [1, 2, 5].includes(firstIndex) ? `${last}а` : last;
      return `${words.first[firstIndex]} ${family}`;
    }
    case "date":
      return new Date(
        Date.UTC(2020, 0, 1) + Math.floor(random() * 315619200000),
      ).toISOString();
    case "uuid": {
      const bytes = Array.from({ length: 16 }, () =>
        Math.floor(random() * 256),
      );
      bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
      bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
      const hex = bytes
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
    case "string":
      return `${TEXT_PREFIX[locale]}_${token()}`;
    case "number":
      return (
        (setting.min ?? 0) +
        Math.floor(
          random() * ((setting.max ?? 999_999) - (setting.min ?? 0) + 1),
        )
      );
    case "boolean":
      return random() >= 0.5;
    case "enum": {
      const value =
        setting.values[Math.floor(random() * setting.values.length)];
      if (value === undefined)
        throw new TypeError("Enum settings require at least one value.");
      return value;
    }
    case "auto":
      throw new TypeError("Automatic generation requires a source value.");
  }
}
