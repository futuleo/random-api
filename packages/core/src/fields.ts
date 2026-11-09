import type { KeyPath } from "./index.js";

export const GENERATOR_KINDS = [
  "auto",
  "email",
  "name",
  "date",
  "uuid",
  "string",
  "number",
  "boolean",
] as const;

export type GeneratorKind = (typeof GENERATOR_KINDS)[number];

export interface FieldGenerator {
  readonly path: KeyPath;
  readonly generator: GeneratorKind;
}

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
      Object.keys(item).some((key) => key !== "path" && key !== "generator") ||
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
    const path: string[] = item.path.map((segment: string) => segment);
    const id = JSON.stringify(path);
    if (seen.has(id)) {
      throw new TypeError("Field generator paths must be unique.");
    }
    seen.add(id);
    return { path, generator: item.generator };
  });
}

export function suggestGenerator(path: KeyPath): GeneratorKind {
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

const FIRST_NAMES = ["Alex", "Jordan", "Taylor", "Casey", "Morgan", "Robin"];
const LAST_NAMES = ["Reed", "Parker", "Brooks", "Hayes", "Lane", "Wells"];

export function generateFieldValue(
  kind: Exclude<GeneratorKind, "auto">,
  random: () => number,
): string | number | boolean {
  const token = () => Math.floor(random() * 4294967296).toString(36);
  switch (kind) {
    case "email":
      return `user.${token()}@example.test`;
    case "name":
      return `${FIRST_NAMES[Math.floor(random() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(random() * LAST_NAMES.length)]}`;
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
      return `synthetic_${token()}`;
    case "number":
      return Math.floor(random() * 1_000_000);
    case "boolean":
      return random() >= 0.5;
  }
}
