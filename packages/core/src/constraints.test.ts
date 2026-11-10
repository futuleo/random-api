import { describe, expect, it } from "vitest";
import { generateFieldValue } from "./fields.js";
import {
  generateRecords,
  generateSyntheticData,
  MAX_ENUM_VALUE_LENGTH,
  MAX_ENUM_VALUES,
  NUMERIC_LIMIT,
  parseFieldGenerators,
} from "./index.js";

describe("explicit fixture constraints", () => {
  it("uses inclusive integer bounds without changing legacy number output", () => {
    const number = { generator: "number", min: -2, max: 2 } as const;
    expect(generateFieldValue(number, () => 0)).toBe(-2);
    expect(generateFieldValue(number, () => 1 - Number.EPSILON)).toBe(2);
    expect(
      generateFieldValue({ generator: "number", min: 7, max: 7 }, () => 0.5),
    ).toBe(7);
    expect(generateSyntheticData({ n: 1 }, { seed: "legacy" })).toEqual(
      generateSyntheticData(
        { n: 1 },
        {
          seed: "legacy",
          fields: [{ path: ["n"], generator: "number" }],
        },
      ),
    );
    const settings = {
      seed: "ranges",
      count: 1000,
      fields: parseFieldGenerators([
        { path: ["quantity"], generator: "number", min: -2, max: 2 },
      ]),
    };
    const rows = generateRecords(settings);
    expect(generateRecords(settings)).toEqual(rows);
    expect(Array.isArray(rows)).toBe(true);
    if (!Array.isArray(rows)) throw new Error("Missing records.");
    expect(
      new Set(
        rows.map((row) =>
          typeof row === "object" && row !== null && !Array.isArray(row)
            ? row.quantity
            : null,
        ),
      ),
    ).toEqual(new Set([-2, -1, 0, 1, 2]));
  });

  it("uses only explicit choices, not source values, and copies configuration", () => {
    const choices = Object.assign(["pending", "done"], {
      toJSON: () => "SENTINEL_METADATA",
    });
    const fields = parseFieldGenerators([
      { path: ["state"], generator: "enum", values: choices },
    ]);
    expect(JSON.stringify(fields)).not.toContain("SENTINEL");
    const source = Array.from({ length: 100 }, () => ({
      state: "SENTINEL_SOURCE",
    }));
    const result = generateSyntheticData(source, { seed: "enums", fields });
    expect(JSON.stringify(result)).not.toContain("SENTINEL");
    expect(generateSyntheticData(source, { seed: "enums", fields })).toEqual(
      result,
    );
    expect(Array.isArray(result)).toBe(true);
    if (!Array.isArray(result)) throw new Error("Missing records.");
    for (const row of result)
      expect(row).toEqual({ state: expect.stringMatching(/^(pending|done)$/) });
    expect(
      generateFieldValue(
        { generator: "enum", values: ["first", "last"] },
        () => 0,
      ),
    ).toBe("first");
    expect(
      generateFieldValue(
        { generator: "enum", values: ["first", "last"] },
        () => 1 - Number.EPSILON,
      ),
    ).toBe("last");
  });

  it("applies constraints to scalar arrays, literal paths and the root", () => {
    expect(
      generateSyntheticData(
        { "a.b": [null, 100] },
        {
          seed: "literal",
          fields: [{ path: ["a.b"], generator: "number", min: 5, max: 5 }],
        },
      ),
    ).toEqual({ "a.b": [5, 5] });
    expect(
      generateSyntheticData("SENTINEL", {
        seed: "root",
        fields: [{ path: [], generator: "enum", values: ["fixed"] }],
      }),
    ).toBe("fixed");
    expect(
      generateRecords({
        seed: "bounds",
        count: 1,
        fields: [
          {
            path: ["number"],
            generator: "number",
            min: -NUMERIC_LIMIT,
            max: NUMERIC_LIMIT,
          },
        ],
      }),
    ).toHaveLength(1);
  });

  it("rejects malformed or oversized settings without reflecting their contents", () => {
    const invalid = [
      { generator: "enum" },
      { generator: "enum", values: [] },
      { generator: "enum", values: ["", "SENTINEL"] },
      { generator: "enum", values: [" "] },
      { generator: "enum", values: ["same", "same"] },
      { generator: "enum", values: [42] },
      { generator: "enum", values: ["x".repeat(MAX_ENUM_VALUE_LENGTH + 1)] },
      {
        generator: "enum",
        values: Array.from({ length: MAX_ENUM_VALUES + 1 }, (_, i) =>
          String(i),
        ),
      },
      { generator: "enum", values: ["one"], min: 0 },
      { generator: "string", values: ["SENTINEL"] },
      { generator: "auto", min: 0 },
      { generator: "number", min: 3, max: 2 },
      { generator: "number", min: 0.5 },
      { generator: "number", min: Number.NaN },
      { generator: "number", max: Number.POSITIVE_INFINITY },
      { generator: "number", min: "SENTINEL" },
      { generator: "number", min: -NUMERIC_LIMIT - 1 },
      { generator: "number", max: NUMERIC_LIMIT + 1 },
      { generator: "number", values: ["SENTINEL"] },
    ];
    for (const setting of invalid) {
      expect(() =>
        parseFieldGenerators([{ path: ["state"], ...setting }]),
      ).toThrow();
      try {
        parseFieldGenerators([{ path: ["state"], ...setting }]);
      } catch (error) {
        expect(
          error instanceof Error ? error.message : String(error),
        ).not.toContain("SENTINEL");
      }
    }
  });
});
