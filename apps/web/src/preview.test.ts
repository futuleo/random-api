import { generateSyntheticData } from "@random-api/core";
import { describe, expect, it } from "vitest";
import { createOutputPreview } from "./preview.js";

it("recovers from unsupported XML keys without discarding generated data", () => {
  const source = { "\u0000": "SENTINEL_SOURCE" };
  const generated = generateSyntheticData(source, { seed: "preview" });
  const json = createOutputPreview(generated, "json");
  expect(json.ok).toBe(true);
  const xml = createOutputPreview(generated, "xml");
  expect(xml).toEqual({
    ok: false,
    error: "XML output contains characters unsupported by XML 1.0.",
  });
  expect(JSON.stringify(xml)).not.toContain("SENTINEL");
  expect(createOutputPreview(generated, "json")).toEqual(json);
  expect(source["\u0000"]).toBe("SENTINEL_SOURCE");
});

describe("generated previews", () => {
  it("supports all valid formats without catching success as an error", () => {
    for (const format of ["json", "csv", "xml", "jsonl"] as const) {
      const preview = createOutputPreview([{ id: "fixture" }], format);
      expect(preview.ok).toBe(true);
      if (preview.ok) expect(preview.text.length).toBeGreaterThan(0);
    }
  });
});
