import {
  type ExportFormat,
  type JsonValue,
  serializeOutput,
} from "@random-api/core";

export type OutputPreview =
  | { readonly ok: true; readonly text: string }
  | { readonly ok: false; readonly error: string };

export function createOutputPreview(
  value: JsonValue,
  format: ExportFormat,
): OutputPreview {
  try {
    return { ok: true, text: serializeOutput(value, format) };
  } catch (failure) {
    return {
      ok: false,
      error:
        failure instanceof TypeError || failure instanceof RangeError
          ? failure.message
          : "Could not preview generated data.",
    };
  }
}
