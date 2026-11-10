import { describe, expect, it } from "vitest";
import {
  generateRecords,
  generateSimilarObjects,
  generateSyntheticData,
  getScenario,
  LOCALES,
  parseLocale,
  SCENARIOS,
} from "./index.js";
import { NAME_WORDS } from "./locale.js";
import { SCENARIO_TEXT } from "./scenario-locales.js";

describe("explicit generation languages", () => {
  it("defaults to English but rejects unsupported languages", () => {
    expect(parseLocale(undefined)).toBe("en");
    for (const locale of ["de", "", null, {}, "SENTINEL"]) {
      expect(() => parseLocale(locale)).toThrow("Locale must be");
    }
  });
  for (const locale of LOCALES) {
    it(`localizes all 30 ${locale} presets without changing paths or machine codes`, () => {
      if (locale !== "en")
        expect(Object.keys(SCENARIO_TEXT[locale]).sort()).toEqual(
          SCENARIOS.map(({ id }) => id).sort(),
        );
      for (const canonical of SCENARIOS) {
        const preset = getScenario(canonical.id, locale);
        expect(preset.id).toBe(canonical.id);
        expect(preset.fields.map(({ path }) => path)).toEqual(
          canonical.fields.map(({ path }) => path),
        );
        if (locale !== "en") {
          expect(preset.name).not.toBe(canonical.name);
          expect(preset.description).not.toBe(canonical.description);
        }
        for (const [index, field] of canonical.fields.entries()) {
          if (
            field.generator === "enum" &&
            field.values.every(
              (value) =>
                /^[a-z0-9_./]+$/.test(value) || /^[A-Z]{2,3}$/.test(value),
            )
          )
            expect(preset.fields[index]).toEqual(field);
        }
        const options = {
          seed: "localized-preset",
          count: 3,
          locale,
          fields: preset.fields,
        };
        const result = generateSimilarObjects(preset.template, options);
        expect(result).toHaveLength(3);
        expect(generateSimilarObjects(preset.template, options)).toEqual(
          result,
        );
      }
    });
    it(`preserves caller choices and never copies source values in ${locale}`, () => {
      const source = {
        name: "SENTINEL_SOURCE",
        title: "SENTINEL_TITLE",
        status: "SENTINEL_STATUS",
      };
      const result = generateSyntheticData(source, {
        seed: "locale-source",
        locale,
        fields: [
          {
            path: ["status"],
            generator: "enum",
            values: ["CUSTOM_UNTRANSLATED"],
          },
        ],
      });
      expect(JSON.stringify(result)).not.toContain("SENTINEL");
      expect(result).toMatchObject({ status: "CUSTOM_UNTRANSLATED" });
      expect(JSON.stringify(source)).toContain("SENTINEL");
    });
    it(`uses the ${locale} name dictionary deterministically without copying source values`, () => {
      const settings = {
        seed: "language-test",
        locale,
        count: 30,
        fields: [{ path: ["name"], generator: "name" as const }],
      };
      const output = generateRecords(settings);
      expect(generateRecords(settings)).toEqual(output);
      if (!Array.isArray(output)) throw new Error("Missing records.");
      for (const row of output) {
        if (
          row === null ||
          typeof row !== "object" ||
          Array.isArray(row) ||
          typeof row.name !== "string"
        )
          throw new Error("Missing name.");
        expect(NAME_WORDS[locale].first).toContain(row.name.split(" ")[0]);
        if (locale === "ru")
          expect(row.name).toMatch(/^[А-Яа-яЁё]+ [А-Яа-яЁё]+$/);
      }
    });
  }
  it("uses localized human-facing choices without mutating English presets", () => {
    const english = JSON.stringify(SCENARIOS);
    expect(getScenario("products", "ru").fields).toContainEqual({
      path: ["title"],
      generator: "enum",
      values: [
        "Тестовый блокнот",
        "Демонстрационный рюкзак",
        "Пробная кружка",
        "Тестовая лампа",
      ],
    });
    expect(JSON.stringify(SCENARIOS)).toBe(english);
    expect(getScenario("users")).toBe(SCENARIOS[0]);
  });
});
