import type { JsonValue } from "./generate.js";

export const EXPORT_FORMATS = ["json", "csv", "xml", "jsonl"] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];
export const EXPORT_MEDIA_TYPES: Record<ExportFormat, string> = {
  json: "application/json; charset=utf-8",
  csv: "text/csv; charset=utf-8",
  xml: "application/xml; charset=utf-8",
  jsonl: "application/x-ndjson; charset=utf-8",
};

function xmlText(value: string): string {
  if (/[^\t\n\r\u0020-\ud7ff\ue000-\ufffd\u{10000}-\u{10ffff}]/u.test(value)) {
    throw new TypeError(
      "XML output contains characters unsupported by XML 1.0.",
    );
  }
  return value.replace(/[&<>"'\t\r\n]/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&apos;";
      case "\t":
        return "&#9;";
      case "\r":
        return "&#13;";
      case "\n":
        return "&#10;";
      default:
        throw new TypeError("Unsupported XML escape.");
    }
  });
}

function serializeXml(value: JsonValue): string {
  let nodes = 0;
  function element(
    node: JsonValue,
    tag: "data" | "item" | "field",
    depth: number,
    name?: string,
  ): string {
    nodes += 1;
    if (depth > 100 || nodes > 100_000)
      throw new RangeError("Output exceeds XML generation limits.");
    const type =
      node === null ? "null" : Array.isArray(node) ? "array" : typeof node;
    const attributes = `${name === undefined ? "" : ` name="${xmlText(name)}"`} type="${type}"`;
    const indent = "  ".repeat(depth);
    if (node === null) return `${indent}<${tag}${attributes} />`;
    if (typeof node === "object") {
      const children = Array.isArray(node)
        ? node.map((item) => element(item, "item", depth + 1))
        : Object.entries(node).map(([key, child]) =>
            element(child, "field", depth + 1, key),
          );
      return children.length === 0
        ? `${indent}<${tag}${attributes}></${tag}>`
        : `${indent}<${tag}${attributes}>\n${children.join("\n")}\n${indent}</${tag}>`;
    }
    if (typeof node === "number" && !Number.isFinite(node))
      throw new TypeError("XML requires finite JSON numbers.");
    return `${indent}<${tag}${attributes}>${xmlText(String(node))}</${tag}>`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n${element(value, "data", 0)}\n`;
}

function cell(value: string, guardFormula = true): string {
  // Spreadsheet applications can execute formulas even inside quoted CSV cells.
  const safe =
    guardFormula && /^[\s]*[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function serializeOutput(
  value: JsonValue,
  format: ExportFormat,
): string {
  if (format === "json") return `${JSON.stringify(value, null, 2)}\n`;
  if (format === "xml") return serializeXml(value);
  if (format === "jsonl") {
    const rows = Array.isArray(value) ? value : [value];
    return rows.length === 0
      ? ""
      : `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`;
  }
  if (format !== "csv")
    throw new TypeError("Export format must be json, csv, xml or jsonl.");
  const records = Array.isArray(value) ? value : [value];
  if (records.length === 0) return "";
  type CsvValue = { text: string; numeric: boolean };
  const rows: Map<string, CsvValue>[] = [];
  const headers = new Set<string>();
  function flatten(
    node: JsonValue,
    path: readonly string[],
    row: Map<string, CsvValue>,
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
    row.set(header, {
      numeric: typeof node === "number" && Number.isFinite(node),
      text:
        node === null
          ? ""
          : typeof node === "object"
            ? JSON.stringify(node)
            : String(node),
    });
  }
  for (const record of records) {
    const row = new Map<string, CsvValue>();
    flatten(record, [], row, 0);
    rows.push(row);
  }
  const columns = [...headers];
  return [
    columns.map((column) => cell(column)).join(","),
    ...rows.map((row) =>
      columns
        .map((column) => {
          const value = row.get(column);
          return cell(value?.text ?? "", !value?.numeric);
        })
        .join(","),
    ),
    "",
  ].join("\r\n");
}
