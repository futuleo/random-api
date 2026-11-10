import { describe, expect, it } from "vitest";
import { serializeOutput } from "./index.js";

describe("XML output", () => {
  it("preserves types, nulls, containers and arbitrary property names", () => {
    expect(
      serializeOutput(
        { "1 invalid.key": [null, true, 12, "hello"], empty: {} },
        "xml",
      ),
    ).toBe(
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<data type="object">\n' +
        '  <field name="1 invalid.key" type="array">\n' +
        '    <item type="null" />\n' +
        '    <item type="boolean">true</item>\n' +
        '    <item type="number">12</item>\n' +
        '    <item type="string">hello</item>\n' +
        "  </field>\n" +
        '  <field name="empty" type="object"></field>\n' +
        "</data>\n",
    );
    expect(serializeOutput([], "xml")).toContain('<data type="array"></data>');
    expect(serializeOutput("", "xml")).toContain('<data type="string"></data>');
  });

  it("escapes XML content and attributes without interpreting markup or entities", () => {
    const output = serializeOutput(
      { 'a"<&\n\t': "<!DOCTYPE x [&evil;]>\r'\"😀" },
      "xml",
    );
    expect(output).toContain('name="a&quot;&lt;&amp;&#10;&#9;"');
    expect(output).toContain(
      "&lt;!DOCTYPE x [&amp;evil;]&gt;&#13;&apos;&quot;😀",
    );
    expect(output).not.toContain("<!DOCTYPE");
  });

  it("rejects invalid XML characters, non-finite numbers and deep or excessive output", () => {
    for (const value of [
      "\u0000",
      "\u0001",
      "\ud800",
      "\ufffe",
      { "bad\u0000": "x" },
    ]) {
      expect(() => serializeOutput(value, "xml")).toThrow(
        "unsupported by XML 1.0",
      );
    }
    expect(() => serializeOutput(Number.NaN, "xml")).toThrow("finite");
    expect(() =>
      serializeOutput(
        Array.from({ length: 100_001 }, () => null),
        "xml",
      ),
    ).toThrow("limits");
    let nested: { child?: unknown } = {};
    for (let index = 0; index < 101; index++) nested = { child: nested };
    expect(() =>
      serializeOutput(JSON.parse(JSON.stringify(nested)), "xml"),
    ).toThrow("limits");
  });
});

describe("JSON Lines output", () => {
  it("emits independently parseable rows with escaped multiline strings", () => {
    const rows = [
      { text: "line\nnext", count: 2 },
      { text: "é😀", count: -1 },
    ];
    const result = serializeOutput(rows, "jsonl");
    expect(
      result
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line)),
    ).toEqual(rows);
    expect(result.endsWith("\n")).toBe(true);
    expect(serializeOutput([], "jsonl")).toBe("");
    expect(serializeOutput(null, "jsonl")).toBe("null\n");
    expect(serializeOutput({ a: true }, "jsonl")).toBe('{"a":true}\n');
  });

  it("keeps negative CSV numbers numeric while escaping formula-like strings", () => {
    expect(
      serializeOutput(
        [
          { n: -2, s: "-2" },
          { n: 1, s: "=1+1" },
        ],
        "csv",
      ),
    ).toBe('"[""n""]","[""s""]"\r\n"-2","\'-2"\r\n"1","\'=1+1"\r\n');
  });
});
