import { extractKeyPaths } from "@random-api/core";
import { describe, expect, it } from "vitest";
import { serializeKeysOnlyRequest } from "./index.js";

describe("serializeKeysOnlyRequest", () => {
  it("serializes exactly key paths, not source values or inferred metadata", () => {
    const source = {
      email: "SENTINEL_EMAIL",
      users: [{ name: "SENTINEL_NAME", age: 987654321 }],
    };
    const payload = serializeKeysOnlyRequest(extractKeyPaths(source));

    expect(JSON.parse(payload)).toEqual({
      keys: [["email"], ["users"], ["users", "name"], ["users", "age"]],
    });
    expect(payload).not.toContain("SENTINEL");
    expect(payload).not.toContain("987654321");
  });

  it("copies paths instead of serializing extra caller properties", () => {
    const path = Object.assign(["email"], {
      originalValue: "SENTINEL_VALUE",
      toJSON: () => "SENTINEL_TO_JSON",
    });
    const paths = Object.assign([path], { secret: "SENTINEL_SECRET" });

    expect(serializeKeysOnlyRequest(paths)).toBe('{"keys":[["email"]]}');
  });

  it("rejects malformed runtime input without including it in errors", () => {
    expect(() => {
      // @ts-expect-error Verify callers outside TypeScript cannot pass values.
      serializeKeysOnlyRequest([["email", { value: "SENTINEL" }]]);
    }).toThrow("Expected an array of key paths containing only strings.");
  });
});
