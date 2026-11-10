import { LOCALES } from "@random-api/core";
import { describe, expect, it } from "vitest";
import {
  MESSAGES,
  type MessageKey,
  translate,
  translateError,
} from "./i18n.js";

describe("studio translations", () => {
  for (const locale of LOCALES) {
    it(`has complete ${locale} copy and identical interpolation parameters`, () => {
      for (const key of Object.keys(MESSAGES) as MessageKey[]) {
        const values = {
          count: 7,
          bytes: 300,
          format: "XML",
          path: '["customer.name"]',
        };
        const text = translate(locale, key, values);
        expect(text.trim().length).toBeGreaterThan(0);
        expect(text).not.toMatch(/\{\w+\}/);
        const expected = [...key.matchAll(/\{(\w+)\}/g)]
          .map((match) => match[1])
          .sort();
        for (const translated of MESSAGES[key])
          expect(
            [...translated.matchAll(/\{(\w+)\}/g)]
              .map((match) => match[1])
              .sort(),
          ).toEqual(expected);
      }
      expect(
        translate(locale, "Generator for {path}", {
          path: '["customer.name"]',
        }),
      ).toContain('["customer.name"]');
      expect(translateError(locale, "SENTINEL_PRIVATE_ERROR")).not.toContain(
        "SENTINEL",
      );
      expect(translateError(locale, "Export {format}")).toBe(
        translate(locale, "Could not generate data."),
      );
    });
  }
  it("translates actionable validation errors without dropping bounds", () => {
    expect(
      translateError("ru", "Record count must be between 1 and 1000."),
    ).toContain("1000");
    expect(
      translateError(
        "fi",
        "Enum settings require 1–50 unique, nonempty strings of at most 256 characters.",
      ),
    ).toContain("256");
    expect(
      translateError(
        "es",
        "XML output contains characters unsupported by XML 1.0.",
      ),
    ).toContain("XML 1.0");
  });
});
