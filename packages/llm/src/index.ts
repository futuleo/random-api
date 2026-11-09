import type { KeyPath } from "@random-api/core";

export interface KeysOnlyRequest {
  readonly keys: readonly KeyPath[];
}

export function serializeKeysOnlyRequest(keys: readonly KeyPath[]): string {
  if (
    !Array.isArray(keys) ||
    !keys.every(
      (path) =>
        Array.isArray(path) &&
        path.every((segment) => typeof segment === "string"),
    )
  ) {
    throw new TypeError(
      "Expected an array of key paths containing only strings.",
    );
  }

  const request: KeysOnlyRequest = {
    keys: keys.map((path) => path.map((segment) => segment)),
  };
  return JSON.stringify(request);
}
