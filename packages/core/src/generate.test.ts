import { describe, expect, it } from "vitest";
import { extractKeyPaths, generateSyntheticData } from "./index.js";

const options = { seed: "repeatable-test" };

describe("generateSyntheticData", () => {
  it("replaces values while preserving local JSON structure and primitive types", () => {
    const input = {
      name: "SENTINEL_PERSON",
      age: 987654321,
      enabled: true,
      missing: null,
      users: [{ email: "SENTINEL_EMAIL" }, { score: 123.45 }],
      empty: { array: [], object: {} },
    };
    const result = generateSyntheticData(input, options);

    expect(result).toEqual({
      name: expect.stringMatching(/^synthetic_[a-z0-9]+$/),
      age: expect.any(Number),
      enabled: expect.any(Boolean),
      missing: null,
      users: [
        { email: expect.stringMatching(/^synthetic_[a-z0-9]+$/) },
        { score: expect.any(Number) },
      ],
      empty: { array: [], object: {} },
    });
    expect(extractKeyPaths(result)).toEqual(extractKeyPaths(input));
    expect(JSON.stringify(result)).not.toContain("SENTINEL");
    expect(JSON.stringify(result)).not.toContain("987654321");
  });

  it("is deterministic and uses the seed rather than source values", () => {
    const first = { text: "SENTINEL_A", number: 123, active: true };
    const second = { text: "SENTINEL_LONGER_B", number: -4.5, active: false };
    const result = generateSyntheticData(first, options);

    expect(generateSyntheticData(first, options)).toEqual(result);
    expect(generateSyntheticData(second, options)).toEqual(result);
    expect(generateSyntheticData(first, { seed: "different" })).not.toEqual(
      result,
    );
    expect(result).toMatchInlineSnapshot(`
      {
        "active": false,
        "number": 883141,
        "text": "synthetic_378v5l",
      }
    `);
  });

  it("handles root primitives and arrays without mutating or sharing input", () => {
    const nested = Object.freeze({ name: "SENTINEL" });
    const input = Object.freeze([nested, nested, Object.freeze([null, false])]);
    const result = generateSyntheticData(input, options);
    expect(result).toEqual([
      { name: expect.any(String) },
      { name: expect.any(String) },
      [null, expect.any(Boolean)],
    ]);
    expect(result).not.toBe(input);
    expect(input[0]).toBe(nested);
    expect(nested.name).toBe("SENTINEL");
    expect(generateSyntheticData(null, options)).toBeNull();
    expect(generateSyntheticData([], options)).toEqual([]);
    expect(generateSyntheticData({}, options)).toEqual({});
    expect(typeof generateSyntheticData("SENTINEL", options)).toBe("string");
    const number = generateSyntheticData(-12.5, options);
    expect(Number.isInteger(number)).toBe(true);
    expect(number).toBeGreaterThanOrEqual(0);
    expect(number).toBeLessThan(1_000_000);
  });

  it("preserves unusual keys without setting the output prototype", () => {
    const input: unknown = JSON.parse(
      '{"__proto__":{"polluted":"SENTINEL"},"constructor":"SENTINEL","a.b":null,"":true}',
    );
    const result = generateSyntheticData(input, options);
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    expect(Object.keys(result ?? {})).toContain("__proto__");
    expect(extractKeyPaths(result)).toEqual(extractKeyPaths(input));
    expect(JSON.stringify(result)).not.toContain("SENTINEL");
    expect({}).not.toHaveProperty("polluted");
  });

  it("rejects invalid values and seeds without including source data", () => {
    for (const input of [
      undefined,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      1n,
      Symbol("SENTINEL"),
      () => "SENTINEL",
      new Date(),
      { secret: undefined },
      new Array(1),
    ]) {
      expect(() => generateSyntheticData(input, options)).toThrow(
        "Input must contain only JSON-compatible values.",
      );
    }
    expect(() => generateSyntheticData("SENTINEL", { seed: "" })).toThrow(
      "A non-empty string seed is required.",
    );
  });

  it("rejects cycles and excessive depth or size with generic errors", () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(() => generateSyntheticData(cyclic, options)).toThrow(
      "Input must not contain circular references.",
    );

    let deep: unknown = null;
    for (let index = 0; index < 101; index += 1) deep = [deep];
    expect(() => generateSyntheticData(deep, options)).toThrow(
      "Input exceeds generation limits",
    );
    expect(() =>
      generateSyntheticData(
        Array.from({ length: 100_000 }, () => null),
        options,
      ),
    ).toThrow("Input exceeds generation limits");
    expect(
      generateSyntheticData(
        Array.from({ length: 99_999 }, () => null),
        options,
      ),
    ).toHaveLength(99_999);
  });
});
