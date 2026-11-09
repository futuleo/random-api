export {
  type GenerationOptions,
  generateSyntheticData,
  type JsonValue,
} from "./generate.js";

export type KeyPath = readonly string[];

export function extractKeyPaths(input: unknown): KeyPath[] {
  const paths = new Map<string, KeyPath>();

  function visit(value: unknown, parent: KeyPath): void {
    if (Array.isArray(value)) {
      for (const item of value) {
        visit(item, parent);
      }
      return;
    }

    if (value === null || typeof value !== "object") {
      return;
    }

    for (const [key, child] of Object.entries(value)) {
      const path = [...parent, key];
      paths.set(JSON.stringify(path), path);
      visit(child, path);
    }
  }

  visit(input, []);
  return [...paths.values()];
}
