import { describe, expect, it } from "vitest";
import { expectedCsv, validateGeneratedPreview } from "./smoke.js";

const generated = {
  email: "user.synthetic@example.test",
  name: "Alex Morgan",
  created_at: "2026-01-02T03:04:05.000Z",
  id: "01234567-89ab-4cde-8f01-23456789abcd",
};

describe("desktop generation smoke assertions", () => {
  it("accepts generated field formats and rejects leaked synthetic sentinels", () => {
    expect(
      validateGeneratedPreview(
        JSON.stringify([generated, generated, generated]),
      ),
    ).toEqual([generated, generated, generated]);
    for (const replacement of [
      { email: "DESKTOP_SMOKE_SENTINEL_EMAIL" },
      { name: "synthetic_token" },
      { created_at: "not-a-date" },
      { id: "01234567-89ab-1cde-8f01-23456789abcd" },
    ]) {
      expect(() =>
        validateGeneratedPreview(
          JSON.stringify([
            { ...generated, ...replacement },
            generated,
            generated,
          ]),
        ),
      ).toThrow("Generated preview validation failed.");
    }
  });

  it("independently checks CSV headers, escaping, rows, and CRLF endings", () => {
    expect(expectedCsv([generated])).toBe(
      '"[""email""]","[""name""]","[""created_at""]","[""id""]"\r\n' +
        '"user.synthetic@example.test","Alex Morgan","2026-01-02T03:04:05.000Z","01234567-89ab-4cde-8f01-23456789abcd"\r\n',
    );
  });
  it("rejects incorrect object counts and serializes every generated row", () => {
    expect(() => validateGeneratedPreview(JSON.stringify([generated]))).toThrow(
      "Generated preview validation failed.",
    );
    expect(
      expectedCsv([generated, generated, generated]).split("\r\n"),
    ).toHaveLength(5);
  });
});
