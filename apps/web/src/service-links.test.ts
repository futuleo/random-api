import { describe, expect, it } from "vitest";
import { serviceLink } from "./service-links.js";

describe("configured service links", () => {
  it("accepts explicit local or hosted links without exposing caller values", () => {
    expect(serviceLink(undefined)).toBeUndefined();
    expect(serviceLink("/api/")).toBe("/api/");
    expect(serviceLink("/docs/")).toBe("/docs/");
    expect(serviceLink("https://example.test/api/")).toBe(
      "https://example.test/api/",
    );
    expect(serviceLink("http://127.0.0.1:3000")).toBe("http://127.0.0.1:3000/");
    for (const value of [
      "https://example.test/api/?",
      "https://example.test/api/#",
      "//example.test",
      "javascript:alert(1)",
      "https://user:secret@example.test",
      "/api/?source=SENTINEL",
      "https://example.test/#SENTINEL",
    ]) {
      expect(() => serviceLink(value)).toThrow();
    }
  });
});
