import { randomUUID } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmdirSync,
  unlinkSync,
} from "node:fs";
import { join } from "node:path";
import type { DownloadItem, WebContents } from "electron";

type GeneratedRecord = {
  email: string;
  name: string;
  created_at: string;
  id: string;
};

export type GenerationSmokeStage =
  | "scenario library and studio layout"
  | "synthetic fixture entry"
  | "key-based generator suggestions"
  | "counted native generation"
  | "generated field validation"
  | "download directory creation"
  | "JSON blob download"
  | "CSV blob download"
  | "download cleanup";

function isGeneratedRecord(record: unknown): record is GeneratedRecord {
  return (
    record !== null &&
    typeof record === "object" &&
    !Array.isArray(record) &&
    Object.keys(record).join(",") === "email,name,created_at,id" &&
    "email" in record &&
    typeof record.email === "string" &&
    /^user\.[a-z0-9]+@example\.test$/.test(record.email) &&
    "name" in record &&
    typeof record.name === "string" &&
    /^[A-Za-z]+ [A-Za-z]+$/.test(record.name) &&
    "created_at" in record &&
    typeof record.created_at === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(record.created_at) &&
    Number.isFinite(Date.parse(record.created_at)) &&
    "id" in record &&
    typeof record.id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
      record.id,
    )
  );
}

export function validateGeneratedPreview(output: unknown): GeneratedRecord[] {
  if (typeof output !== "string" || output.includes("DESKTOP_SMOKE_SENTINEL")) {
    throw new Error("Generated preview validation failed.");
  }
  const records: unknown = JSON.parse(output);
  if (
    !Array.isArray(records) ||
    records.length !== 3 ||
    !records.every(isGeneratedRecord)
  ) {
    throw new Error("Generated preview validation failed.");
  }
  return records;
}

export function expectedCsv(records: readonly GeneratedRecord[]): string {
  const first = records[0];
  if (!first) throw new Error("Missing generated records.");
  const quote = (value: string) => `"${value.replaceAll('"', '""')}"`;
  return [
    Object.keys(first)
      .map((key) => quote(JSON.stringify([key])))
      .join(","),
    ...records.map((record) => Object.values(record).map(quote).join(",")),
    "",
  ].join("\r\n");
}

export async function verifyGenerationAndExports(
  contents: WebContents,
  setStage: (stage: GenerationSmokeStage) => void,
  registerCleanup: (cleanup: () => void) => void,
): Promise<void> {
  setStage("synthetic fixture entry");
  const fixture = {
    email: "DESKTOP_SMOKE_SENTINEL_EMAIL",
    name: "DESKTOP_SMOKE_SENTINEL_NAME",
    created_at: "DESKTOP_SMOKE_SENTINEL_DATE",
    id: "DESKTOP_SMOKE_SENTINEL_UUID",
  };
  const run = (script: string) => contents.executeJavaScript(script);
  const helpers = `
    const waitFor = async (test) => {
      for (let attempt = 0; attempt < 100; attempt++) {
        if (test()) return;
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      throw new Error("Smoke UI wait failed.");
    };
    const clickButton = (text) => {
      const button = Array.from(document.querySelectorAll("button")).find((item) => {
        const label = item.cloneNode(true);
        label.querySelectorAll("kbd, svg, [aria-hidden='true']")
          .forEach((decoration) => decoration.remove());
        return label.textContent?.trim() === text;
      });
      if (!button || button.disabled) throw new Error("Smoke UI action failed.");
      button.click();
    };
    const setInput = (selector, value, prototype) => {
      const input = document.querySelector(selector);
      if (!input) throw new Error("Smoke UI input failed.");
      Object.getOwnPropertyDescriptor(prototype, "value").set.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    };
  `;
  setStage("scenario library and studio layout");
  await run(`(async () => {
    ${helpers}
    const picker = document.querySelector("#scenario");
    if (!picker || picker.querySelectorAll("optgroup option").length !== 30) {
      throw new Error("Missing scenario choices.");
    }
    picker.value = "orders";
    picker.dispatchEvent(new Event("change", { bubbles: true }));
    await waitFor(() => document.querySelector("#source").value.includes("total_cents"));
    clickButton("Browse 30 scenarios");
    await waitFor(() => document.querySelectorAll(".scenario-card").length === 30);
    setInput('[aria-label="Search scenarios"]', "Support tickets", HTMLInputElement.prototype);
    await waitFor(() => document.querySelectorAll(".scenario-card").length === 1);
    document.querySelector(".scenario-card").click();
    await waitFor(() => document.querySelector("#scenario").value === "support-tickets");
    if (document.querySelector(".scenario-browser")) throw new Error("Scenario choice did not close the library.");
    const flow = ["#source", ".field-panel", ".control-strip", ".output-panel .panel-heading", ".export-bar"]
      .map((selector) => document.querySelector(selector));
    if (flow.some((element) => !element) || flow.slice(1).some((element, index) =>
        !(flow[index].compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING))) {
      throw new Error("Studio controls are out of sequence.");
    }
  })()`);
  const entry: unknown = await run(`(async () => {
    ${helpers}
    setInput("#source", ${JSON.stringify(JSON.stringify(fixture))}, HTMLTextAreaElement.prototype);
    await waitFor(() => document.querySelectorAll(".field-row select").length === 4);
    return true;
  })()`);
  if (entry !== true) throw new Error("Smoke UI input failed.");

  setStage("key-based generator suggestions");
  await run(`(async () => {
    ${helpers}
    clickButton("Suggest from keys");
    await waitFor(() => Array.from(document.querySelectorAll(".field-row select"))
      .map((select) => select.value).join(",") === "email,name,date,uuid");
  })()`);

  setStage("counted native generation");
  const output: unknown = await run(`(async () => {
    ${helpers}
    if (document.querySelector("#seed")) throw new Error("Seed must not be exposed in the studio.");
    const generate = async (count) => {
      setInput("#object-count", String(count), HTMLInputElement.prototype);
      await new Promise((resolve) => setTimeout(resolve, 50));
      clickButton("Generate data");
      await waitFor(() => document.querySelector(".output-code"));
      return document.querySelector(".output-code").textContent;
    };
    const first = await generate(3);
    const larger = await generate(5);
    const fresh = await generate(3);
    if (JSON.parse(first).length !== 3 || JSON.parse(larger).length !== 5 ||
        JSON.parse(fresh).length !== 3 || first === fresh) {
      throw new Error("Object count or fresh generation failed.");
    }
    return fresh;
  })()`);
  setStage("generated field validation");
  const records = validateGeneratedPreview(output);
  const json = `${JSON.stringify(records, null, 2)}\n`;
  if (output !== json) throw new Error("Generated JSON formatting failed.");

  setStage("download directory creation");
  // Keep owned scratch artifacts inside the checkout, never in system temp paths.
  const workspaceDesktop = join(process.cwd(), "apps", "desktop");
  const parent = existsSync(join(workspaceDesktop, "package.json"))
    ? workspaceDesktop
    : process.cwd();
  const metadata: unknown = JSON.parse(
    readFileSync(join(parent, "package.json"), "utf8"),
  );
  if (
    metadata === null ||
    typeof metadata !== "object" ||
    !("name" in metadata) ||
    metadata.name !== "@random-api/desktop"
  ) {
    throw new Error("Smoke artifact location unavailable.");
  }
  const directory = join(parent, `.smoke-downloads-${randomUUID()}`);
  mkdirSync(directory);
  const ownedFiles: string[] = [];
  const activeDownloads = new Set<DownloadItem>();
  const cleanup = () => {
    for (const item of activeDownloads) item.cancel();
    for (const path of ownedFiles) {
      if (existsSync(path)) unlinkSync(path);
    }
    rmdirSync(directory);
  };
  registerCleanup(cleanup);

  async function verifyDownload(
    format: "json" | "csv",
    expectedContent: string,
  ): Promise<void> {
    const filename = `synthetic-data.${format}`;
    const path = join(directory, filename);
    ownedFiles.push(path);
    let downloadListener:
      | ((
          _event: Electron.Event,
          item: DownloadItem,
          source: WebContents,
        ) => void)
      | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await new Promise<void>((resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error("Smoke download timed out.")),
          6_000,
        );
        downloadListener = (_event, item, source) => {
          if (
            source !== contents ||
            item.getFilename() !== filename ||
            !item.getURL().startsWith("blob:file://")
          ) {
            item.cancel();
            reject(new Error("Unexpected smoke download."));
            return;
          }
          activeDownloads.add(item);
          item.setSavePath(path);
          item.once("done", (_doneEvent, state) => {
            activeDownloads.delete(item);
            if (state !== "completed") {
              reject(new Error("Smoke download did not complete."));
              return;
            }
            try {
              if (readFileSync(path, "utf8") !== expectedContent) {
                reject(new Error("Smoke download content mismatch."));
              } else {
                resolve();
              }
            } catch {
              reject(new Error("Smoke download could not be read."));
            }
          });
        };
        contents.session.once("will-download", downloadListener);
        void run(`(() => {
          ${helpers}
          clickButton("Export ${format.toUpperCase()}");
        })()`).catch(reject);
      });
    } finally {
      clearTimeout(timer);
      if (downloadListener) {
        contents.session.removeListener("will-download", downloadListener);
      }
    }
  }

  setStage("JSON blob download");
  await verifyDownload("json", json);
  setStage("CSV blob download");
  await verifyDownload("csv", expectedCsv(records));
  setStage("download cleanup");
}
