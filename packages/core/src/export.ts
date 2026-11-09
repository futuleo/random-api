import type { JsonValue } from "./generate.js";

export type ExportFormat = "json" | "csv";

function cell(value: string): string {
  // Spreadsheet applications can execute formulas even inside quoted CSV cells.
  const safe = /^[\s]*[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function serializeOutput(
  value: JsonValue,
  format: ExportFormat,
): string {
  if (format === "json") return `${JSON.stringify(value, null, 2)}\n`;
  if (format !== "csv")
    throw new TypeError("Export format must be json or csv.");
  const records = Array.isArray(value) ? value : [value];
  if (records.length === 0) return "";
  const rows: Map<string, string>[] = [];
  const headers = new Set<string>();
  function flatten(
    node: JsonValue,
    path: readonly string[],
    row: Map<string, string>,
    depth: number,
  ): void {
    if (depth > 100) throw new RangeError("Output exceeds CSV depth limit.");
    if (node !== null && typeof node === "object" && !Array.isArray(node)) {
      const entries = Object.entries(node);
      if (entries.length > 0) {
        for (const [key, child] of entries) {
          flatten(child, [...path, key], row, depth + 1);
        }
        return;
      }
    }
    // JSON segment arrays distinguish literal dots, empty keys and root values.
    const header = JSON.stringify(path);
    headers.add(header);
    row.set(
      header,
      node === null
        ? ""
        : typeof node === "object"
          ? JSON.stringify(node)
          : String(node),
    );
  }
  for (const record of records) {
    const row = new Map<string, string>();
    flatten(record, [], row, 0);
    rows.push(row);
  }
  const columns = [...headers];
  return [
    columns.map(cell).join(","),
    ...rows.map((row) =>
      columns.map((column) => cell(row.get(column) ?? "")).join(","),
    ),
    "",
  ].join("\r\n");
}
