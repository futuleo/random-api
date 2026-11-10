export {
  DATASETS,
  type DatasetOptions,
  generateDataset,
  getDataset,
  type ShopDataset,
} from "./datasets.js";
export {
  EXPORT_FORMATS,
  EXPORT_MEDIA_TYPES,
  type ExportFormat,
  serializeOutput,
} from "./export.js";
export {
  type FieldGenerator,
  GENERATOR_KINDS,
  type GeneratorKind,
  type GeneratorSettings,
  inspectLocalFields,
  isGeneratorKind,
  type LocalField,
  MAX_ENUM_VALUE_LENGTH,
  MAX_ENUM_VALUES,
  NUMERIC_LIMIT,
  parseFieldGenerators,
  suggestGenerator,
} from "./fields.js";
export {
  type GenerationOptions,
  generateSyntheticData,
  type JsonValue,
} from "./generate.js";
export {
  isLocale,
  LOCALE_NAMES,
  LOCALES,
  type Locale,
  parseLocale,
} from "./locale.js";
export {
  generateSimilarObjects,
  isObjectTemplate,
  validateRecordCount,
} from "./objects.js";
export { generateRecords, type RecordSettings } from "./records.js";
export { getScenario, SCENARIOS, type Scenario } from "./scenarios.js";

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
