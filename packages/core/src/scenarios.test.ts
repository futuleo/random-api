import { describe, expect, it } from "vitest";
import {
  generateSimilarObjects,
  getScenario,
  inspectLocalFields,
  isObjectTemplate,
  SCENARIOS,
  serializeOutput,
} from "./index.js";

describe("requested object counts", () => {
  it("generates exactly the requested number without mutating or copying source values", () => {
    const source = Object.freeze({
      email: "SENTINEL_SOURCE",
      score: 987654321,
    });
    const options = {
      seed: "count-test",
      count: 25,
      fields: [{ path: ["email"], generator: "email" as const }],
    };
    const result = generateSimilarObjects(source, options);
    expect(result).toHaveLength(25);
    expect(generateSimilarObjects(source, options)).toEqual(result);
    expect(JSON.stringify(result)).not.toContain("SENTINEL");
    expect(JSON.stringify(result)).not.toContain("987654321");
    expect(source.email).toBe("SENTINEL_SOURCE");
    expect(
      new Set(
        JSON.parse(JSON.stringify(result)).map(
          (row: { email: string }) => row.email,
        ),
      ).size,
    ).toBeGreaterThan(1);
    expect(
      generateSimilarObjects({}, { seed: "count-test", count: 1 }),
    ).toEqual([{}]);
    expect(
      generateSimilarObjects({}, { seed: "count-test", count: 1000 }),
    ).toHaveLength(1000);
  });

  it("cycles different object samples and handles settings outside a shortened selection", () => {
    const source = [{ a: "SENTINEL_A" }, { b: "SENTINEL_B" }];
    const fields = [{ path: ["b"], generator: "email" as const }];
    expect(
      generateSimilarObjects(source, { seed: "count-test", count: 3, fields }),
    ).toEqual([
      { a: expect.any(String) },
      { b: expect.stringContaining("@example.test") },
      { a: expect.any(String) },
    ]);
    expect(
      generateSimilarObjects(source, { seed: "count-test", count: 1, fields }),
    ).toEqual([{ a: expect.any(String) }]);
    expect(() =>
      generateSimilarObjects(source, {
        seed: "count-test",
        count: 1,
        fields: [{ path: ["absent"], generator: "email" }],
      }),
    ).toThrow("does not exist");
  });

  it("keeps nested arrays local and rejects unsupported roots and invalid counts", () => {
    expect(
      generateSimilarObjects(
        { items: [{ id: "SENTINEL" }, { id: "SENTINEL" }] },
        {
          seed: "count-test",
          count: 2,
        },
      ),
    ).toEqual([
      { items: [{ id: expect.any(String) }, { id: expect.any(String) }] },
      { items: [{ id: expect.any(String) }, { id: expect.any(String) }] },
    ]);
    for (const root of [null, 1, "SENTINEL", [], [1], [{}, null], new Date()]) {
      expect(isObjectTemplate(root)).toBe(false);
      expect(() =>
        generateSimilarObjects(root, { seed: "count-test", count: 1 }),
      ).toThrow("Object count requires");
    }
    for (const count of [
      0,
      -1,
      1.5,
      1001,
      Number.NaN,
      Number.POSITIVE_INFINITY,
    ]) {
      expect(() =>
        generateSimilarObjects({}, { seed: "count-test", count }),
      ).toThrow("between 1 and 1000");
    }
  });

  it("enforces total output limits instead of bypassing them through repetition", () => {
    const source = { values: Array.from({ length: 101 }, () => null) };
    expect(() =>
      generateSimilarObjects(source, { seed: "count-test", count: 1000 }),
    ).toThrow("generation limits");
  });
});

describe("scenario catalog", () => {
  it("contains exactly 30 unique scenarios in six useful categories", () => {
    expect(SCENARIOS).toHaveLength(30);
    expect(new Set(SCENARIOS.map((item) => item.id)).size).toBe(30);
    expect(new Set(SCENARIOS.map((item) => item.category)).size).toBe(6);
    expect(getScenario("users").name).toBe("Users");
    expect(() => getScenario("SENTINEL_UNKNOWN")).toThrow("Unknown scenario");
  });

  for (const scenario of SCENARIOS) {
    it(`generates and exports the ${scenario.id} scenario without changing its template`, () => {
      const before = JSON.stringify(scenario);
      const result = generateSimilarObjects(scenario.template, {
        seed: "scenario-test",
        count: 12,
        fields: scenario.fields,
      });
      expect(result).toHaveLength(12);
      expect(isObjectTemplate(scenario.template)).toBe(true);
      expect(inspectLocalFields(result).map((field) => field.path)).toEqual(
        scenario.fields.map((field) => field.path),
      );
      expect(JSON.parse(serializeOutput(result, "json"))).toHaveLength(12);
      expect(serializeOutput(result, "csv").split("\r\n")).toHaveLength(14);
      expect(JSON.stringify(scenario)).toBe(before);
      if (!Array.isArray(result)) throw new Error("Missing records.");
      for (const row of result) {
        for (const field of scenario.fields) {
          let value = row;
          for (const segment of field.path) {
            if (
              value === null ||
              typeof value !== "object" ||
              Array.isArray(value) ||
              value[segment] === undefined
            )
              throw new Error("Missing scenario field.");
            value = value[segment];
          }
          if (field.generator === "number") {
            expect(value).toBeGreaterThanOrEqual(field.min ?? 0);
            expect(value).toBeLessThanOrEqual(field.max ?? 999_999);
            expect(Number.isInteger(value)).toBe(true);
          }
          if (field.generator === "enum") expect(field.values).toContain(value);
        }
      }
    });
  }
});
