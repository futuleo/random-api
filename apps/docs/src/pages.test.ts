import { getScenario, LOCALES, SCENARIOS } from "@random-api/core";
import { describe, expect, it } from "vitest";
import pages from "../[page].paths";

describe("generated documentation", () => {
  it("generates every guide and all 30 actual scenarios in each language", () => {
    const result = pages.paths();
    expect(result).toHaveLength(5 * (7 + 1 + 30));
    expect(new Set(result.map(({ params }) => params.page)).size).toBe(
      result.length,
    );
    for (const locale of LOCALES) {
      const base = locale === "en" ? "" : `${locale}/`;
      for (const { id } of SCENARIOS) {
        const page = result.find(
          ({ params }) => params.page === `${base}scenarios/${id}`,
        );
        const preset = getScenario(id, locale);
        expect(page?.content).toContain(`# ${preset.name}`);
        expect(page?.content).toContain(JSON.stringify(preset.fields, null, 2));
        expect(page?.content).toContain(
          `rgen scenario ${id} --count 25 --locale ${locale}`,
        );
      }
    }
    for (const page of result) {
      expect(page.content).not.toContain("packages/llm");
      expect(page.content).not.toContain("random-api-cli-0.0.0");
    }
  });
});
