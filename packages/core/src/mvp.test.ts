import { describe, expect, it } from "vitest";
import {
  generateRecords,
  generateSyntheticData,
  inspectLocalFields,
  parseFieldGenerators,
  serializeOutput,
  suggestGenerator,
} from "./index.js";

describe("field generators", () => {
  const source = [
    {
      id: "SENTINEL_ID",
      email: "SENTINEL_EMAIL",
      name: "SENTINEL_NAME",
      date: null,
    },
    {
      id: "SENTINEL_ID2",
      email: "SENTINEL_EMAIL2",
      name: "SENTINEL_NAME2",
      date: null,
    },
  ];
  const fields = parseFieldGenerators([
    { path: ["id"], generator: "uuid" },
    { path: ["email"], generator: "email" },
    { path: ["name"], generator: "name" },
    { path: ["date"], generator: "date" },
  ]);
  it("generates valid seeded email, names, ISO dates and UUID v4 for every row", () => {
    const result = generateSyntheticData(source, { seed: "mvp", fields });
    expect(result).toEqual([
      {
        id: expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
        ),
        email: expect.stringMatching(/^user\.[a-z0-9]+@example\.test$/),
        name: expect.stringMatching(/^[A-Z][a-z]+ [A-Z][a-z]+$/),
        date: expect.stringMatching(
          /^202[0-9]-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/,
        ),
      },
      {
        id: expect.any(String),
        email: expect.any(String),
        name: expect.any(String),
        date: expect.any(String),
      },
    ]);
    expect(generateSyntheticData(source, { seed: "mvp", fields })).toEqual(
      result,
    );
    expect(JSON.stringify(result)).not.toContain("SENTINEL");
    const records: {
      id: string;
      date: string;
    }[] = JSON.parse(JSON.stringify(result));
    expect(records[0]?.id).not.toBe(records[1]?.id);
    for (const record of records) {
      expect(Number.isNaN(Date.parse(record.date))).toBe(false);
    }
  });

  it("maps literal key segments, root primitives and nested arrays", () => {
    expect(
      generateSyntheticData(
        { "a.b": [{ "": "SENTINEL" }], a: { b: "SENTINEL" } },
        { seed: "mvp", fields: [{ path: ["a.b", ""], generator: "email" }] },
      ),
    ).toEqual({
      "a.b": [{ "": expect.stringContaining("@example.test") }],
      a: { b: expect.stringMatching(/^synthetic_/) },
    });
    expect(
      generateSyntheticData(null, {
        seed: "mvp",
        fields: [{ path: [], generator: "uuid" }],
      }),
    ).toMatch(/^[a-f0-9-]{36}$/);
    expect(
      generateSyntheticData(
        { emails: ["SENTINEL_A", "SENTINEL_B"] },
        {
          seed: "mvp",
          fields: [{ path: ["emails"], generator: "email" }],
        },
      ),
    ).toEqual({
      emails: [
        expect.stringContaining("@example.test"),
        expect.stringContaining("@example.test"),
      ],
    });
  });

  it("validates configurations and rejects absent or container targets", () => {
    for (const invalid of [
      {},
      [{ path: ["email"], generator: "SENTINEL" }],
      [{ path: ["email"], generator: "email", value: "SENTINEL" }],
      [{ path: [42], generator: "email" }],
      [
        { path: ["email"], generator: "email" },
        { path: ["email"], generator: "name" },
      ],
      Array.from({ length: 201 }, () => ({ path: [], generator: "auto" })),
    ]) {
      expect(() => parseFieldGenerators(invalid)).toThrow();
    }
    expect(() => generateSyntheticData({}, { seed: "mvp", fields })).toThrow(
      "does not exist",
    );
    expect(() =>
      generateSyntheticData(
        { email: {} },
        {
          seed: "mvp",
          fields: [{ path: ["email"], generator: "email" }],
        },
      ),
    ).toThrow("primitive");
  });

  it("inspects types locally and suggests generators from names only", () => {
    expect(
      inspectLocalFields([{ email: "SENTINEL" }, { email: null }]),
    ).toEqual([{ path: ["email"], types: ["string", "null"] }]);
    expect(suggestGenerator(["email_address"])).toBe("email");
    expect(suggestGenerator(["full_name"])).toBe("name");
    expect(suggestGenerator(["created_at"])).toBe("date");
    expect(suggestGenerator(["id"])).toBe("uuid");
    expect(suggestGenerator(["score"])).toBe("auto");
  });
});

describe("JSON and CSV export", () => {
  it("exports parseable JSON and RFC-style CSV with disjoint columns", () => {
    const data = [
      { "a.b": 'hello,"world"\nnext', a: { b: 42 }, list: [1, 2] },
      { other: true, a: { b: null } },
    ];
    expect(JSON.parse(serializeOutput(data, "json"))).toEqual(data);
    expect(serializeOutput(data, "csv")).toBe(
      '"[""a.b""]","[""a"",""b""]","[""list""]","[""other""]"\r\n' +
        '"hello,""world""\nnext","42","[1,2]",""\r\n' +
        '"","","","true"\r\n',
    );
    expect(serializeOutput([], "csv")).toBe("");
    expect(serializeOutput(42, "csv")).toBe('"[]"\r\n"42"\r\n');
    expect(serializeOutput({}, "csv")).toBe('"[]"\r\n"{}"\r\n');
  });
  it("neutralizes spreadsheet formulas and preserves unusual keys", () => {
    const csv = serializeOutput(
      [
        { text: "=1+1" },
        { text: "+cmd" },
        { text: " @SUM(A1)" },
        { text: "\t=1" },
      ],
      "csv",
    );
    expect(csv).toContain('"\'=1+1"');
    expect(csv).toContain('"\'+cmd"');
    expect(csv).toContain('"\' @SUM(A1)"');
    expect(csv).toContain('"\'\t=1"');
  });
});

describe("keys/settings-only records", () => {
  it("generates nested records with explicit generators and safe special keys", () => {
    const fields = parseFieldGenerators([
      { path: ["__proto__", "id"], generator: "uuid" },
      { path: ["profile", "email"], generator: "email" },
    ]);
    const result = generateRecords({ seed: "mvp", count: 2, fields });
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(Object.getPrototypeOf(result)).toBe(Array.prototype);
    expect(JSON.stringify(result)).toContain('"__proto__"');
    expect({}).not.toHaveProperty("id");
    expect(generateRecords({ seed: "mvp", count: 2, fields })).toEqual(result);
  });
  it("rejects ambiguous field trees, implicit generators and unbounded counts", () => {
    for (const fields of [
      [],
      [{ path: ["id"], generator: "auto" }],
      [{ path: [], generator: "email" }],
      [
        { path: ["profile"], generator: "email" },
        { path: ["profile", "id"], generator: "uuid" },
      ],
    ]) {
      expect(() =>
        generateRecords({
          seed: "mvp",
          count: 1,
          fields: parseFieldGenerators(fields),
        }),
      ).toThrow();
    }
    for (const count of [0, -1, 1.5, 1001, Number.NaN]) {
      expect(() =>
        generateRecords({
          seed: "mvp",
          count,
          fields: [{ path: ["id"], generator: "uuid" }],
        }),
      ).toThrow("between 1 and 1000");
    }
  });
});
