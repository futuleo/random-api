import { describe, expect, it } from "vitest";
import { extractKeyPaths } from "./index.js";

describe("extractKeyPaths", () => {
  it("extracts nested names without original values", () => {
    const result = extractKeyPaths({
      name: "SENTINEL_PERSON",
      address: { city: "SENTINEL_CITY" },
      active: true,
      nullable: null,
    });

    expect(result).toEqual([
      ["name"],
      ["address"],
      ["address", "city"],
      ["active"],
      ["nullable"],
    ]);
    expect(JSON.stringify(result)).not.toContain("SENTINEL");
  });

  it("merges paths across arrays without exposing indices or counts", () => {
    expect(
      extractKeyPaths({
        users: [{ id: 12 }, { id: 13, email: "SENTINEL_EMAIL" }],
      }),
    ).toEqual([["users"], ["users", "id"], ["users", "email"]]);
  });

  it("keeps literal dots distinct from nesting and supports unusual keys", () => {
    const input: unknown = JSON.parse(
      '{"a.b":1,"a":{"b":2},"":3,"__proto__":{"constructor":4}}',
    );
    expect(extractKeyPaths(input)).toEqual([
      ["a.b"],
      ["a"],
      ["a", "b"],
      [""],
      ["__proto__"],
      ["__proto__", "constructor"],
    ]);
  });

  it("handles root arrays, empty containers, and primitive documents", () => {
    expect(extractKeyPaths([[{ id: 1 }], { id: 2 }])).toEqual([["id"]]);
    for (const input of [null, 42, true, "SENTINEL", [], {}]) {
      expect(extractKeyPaths(input)).toEqual([]);
    }
  });

  it("does not mutate the source", () => {
    const input = Object.freeze({
      nested: Object.freeze({ id: "SENTINEL" }),
    });
    expect(extractKeyPaths(input)).toEqual([["nested"], ["nested", "id"]]);
    expect(input.nested.id).toBe("SENTINEL");
  });
});
