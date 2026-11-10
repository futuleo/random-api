import { describe, expect, it } from "vitest";
import { generateRecords, LOCALES, parseLocale } from "./index.js";
import { NAME_WORDS } from "./locale.js";

describe("explicit generation languages", () => {
  it("defaults to English but rejects unsupported languages", () => {
    expect(parseLocale(undefined)).toBe("en");
    for (const locale of ["de", "", null, {}, "SENTINEL"]) {
      expect(() => parseLocale(locale)).toThrow("Locale must be");
    }
  });
  for (const locale of LOCALES) {
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
});
