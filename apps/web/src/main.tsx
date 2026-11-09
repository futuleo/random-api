import {
  type ExportFormat,
  type FieldGenerator,
  GENERATOR_KINDS,
  type GeneratorKind,
  generateSyntheticData,
  inspectLocalFields,
  isGeneratorKind,
  type JsonValue,
  serializeOutput,
  suggestGenerator,
} from "@random-api/core";
import { StrictMode, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const EXAMPLE = JSON.stringify(
  [
    {
      id: "replace-me",
      name: "Example person",
      email: "source@example.test",
      created_at: "2024-01-01",
      active: true,
      profile: { score: 42 },
    },
    {
      id: "replace-me-too",
      name: "Another example",
      email: "another@example.test",
      created_at: "2024-02-01",
      active: false,
      profile: { score: 87 },
    },
  ],
  null,
  2,
);

const LABELS: Record<GeneratorKind, string> = {
  auto: "Auto · preserve type",
  email: "Email address",
  name: "Full name",
  date: "ISO date",
  uuid: "UUID v4",
  string: "Text token",
  number: "Number",
  boolean: "Boolean",
};
const PREVIEW_LIMIT = 20_000;

function Icon({
  name,
}: {
  name:
    | "spark"
    | "grid"
    | "shield"
    | "arrow"
    | "copy"
    | "download"
    | "code"
    | "terminal"
    | "check";
}) {
  const paths = {
    spark: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z",
    grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
    shield: "m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-6",
    arrow: "M5 12h14m-5-5 5 5-5 5",
    copy: "M8 8h12v12H8zM16 8V4H4v12h4",
    download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
    code: "m8 6-6 6 6 6m8-12 6 6-6 6M14 3l-4 18",
    terminal: "m4 6 6 6-6 6m9 0h7",
    check: "m5 12 4 4L19 6",
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}

function JsonCode({ text }: { text: string }) {
  const tokens = text.split(
    /("(?:\\.|[^"\\])*"\s*:|"(?:\\.|[^"\\])*"|\b(?:true|false|null)\b|-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b)/g,
  );
  let offset = 0;
  return (
    <code>
      {tokens
        .filter((token) => token.length > 0)
        .map((token) => {
          const position = offset;
          offset += token.length;
          const type = token.startsWith('"')
            ? token.trimEnd().endsWith(":")
              ? "key"
              : "string"
            : /^(true|false|null)$/.test(token)
              ? "literal"
              : /^-?\d/.test(token)
                ? "number"
                : "";
          return (
            <span
              className={type ? `syntax-${type}` : undefined}
              key={position}
            >
              {token}
            </span>
          );
        })}
    </code>
  );
}

function App() {
  const [input, setInput] = useState(EXAMPLE);
  const [seed, setSeed] = useState("studio-01");
  const [settings, setSettings] = useState<FieldGenerator[]>([]);
  const [result, setResult] = useState<{
    value: JsonValue;
  } | null>(null);
  const [format, setFormat] = useState<ExportFormat>("json");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [view, setView] = useState<"studio" | "guide">("studio");
  const upload = useRef<HTMLInputElement>(null);
  const analysis = useMemo(() => {
    if (input.length > 2 * 1024 * 1024)
      return {
        document: null,
        fields: [],
        error: "Use a JSON document smaller than 2 MiB.",
      };
    let document: unknown;
    try {
      document = JSON.parse(input);
    } catch {
      return {
        document: null,
        fields: [],
        error: "Invalid JSON. Check your input and try again.",
      };
    }
    try {
      return { document, fields: inspectLocalFields(document), error: null };
    } catch {
      return {
        document: null,
        fields: [],
        error: "Use JSON within 100 levels and 100000 values.",
      };
    }
  }, [input]);

  function invalidate() {
    setResult(null);
    setError(null);
    setNotice("");
  }
  function updateSource(text: string) {
    setInput(text);
    setSettings([]);
    invalidate();
  }
  function choose(path: readonly string[], generator: GeneratorKind) {
    setSettings((current) => [
      ...current.filter(
        (field) => JSON.stringify(field.path) !== JSON.stringify(path),
      ),
      ...(generator === "auto" ? [] : [{ path, generator }]),
    ]);
    invalidate();
  }
  function generate() {
    invalidate();
    if (analysis.error) {
      setError(analysis.error);
      return;
    }
    try {
      const value = generateSyntheticData(analysis.document, {
        seed,
        fields: settings,
      });
      serializeOutput(value, format);
      setResult({ value });
      setNotice("Fresh synthetic data. Generated entirely on your device.");
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Could not generate data.",
      );
    }
  }
  const output = result === null ? "" : serializeOutput(result.value, format);
  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(output);
      setNotice("Generated output copied to clipboard.");
    } catch {
      setError(
        "Clipboard access is unavailable. Use an export button instead.",
      );
    }
  }
  function download(exportFormat: ExportFormat) {
    if (!result) return;
    try {
      const content = serializeOutput(result.value, exportFormat);
      const url = URL.createObjectURL(
        new Blob([content], {
          type:
            exportFormat === "json"
              ? "application/json"
              : "text/csv;charset=utf-8",
        }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `synthetic-data.${exportFormat}`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      setNotice(`${exportFormat.toUpperCase()} export prepared.`);
    } catch {
      setError("Could not export generated data.");
    }
  }
  async function loadFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Use a JSON file smaller than 2 MiB.");
      return;
    }
    try {
      updateSource(await file.text());
    } catch {
      setError("Could not read the selected file.");
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button
          type="button"
          className="brand"
          onClick={() => setView("studio")}
          aria-label="Random API home"
        >
          <span className="brand-mark">
            <Icon name="grid" />
          </span>
          random<span className="brand-light">api</span>
          <span className="version">LOCAL</span>
        </button>
        <p className="nav-caption">WORKSPACE</p>
        <nav aria-label="Workspace">
          <button
            type="button"
            className={`nav-item ${view === "studio" ? "active" : ""}`}
            onClick={() => setView("studio")}
          >
            <Icon name="grid" />
            Data studio<span className="nav-count">01</span>
          </button>
          <button
            type="button"
            className={`nav-item ${view === "guide" ? "active" : ""}`}
            onClick={() => setView("guide")}
          >
            <Icon name="terminal" />
            Developer guide
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="local-card">
            <span className="status-dot" />
            <span>
              Local engine<strong>Everything stays here.</strong>
            </span>
            <Icon name="shield" />
          </div>
          <p>
            No accounts. No uploads.
            <br />
            Just a little controlled randomness.
          </p>
          <span className="sidebar-footer">BUILT FOR THE WHAT-IFS.</span>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Workspace</span>
            <span className="slash">/</span>
            {view === "studio" ? "Data studio" : "Developer guide"}
          </div>
          <button
            type="button"
            className="mobile-nav text-button"
            onClick={() => setView(view === "studio" ? "guide" : "studio")}
          >
            {view === "studio" ? "Developer guide" : "Data studio"}
          </button>
          <span className="private-badge">
            <Icon name="shield" />
            Private by design
          </span>
        </header>
        <main id="studio">
          <div className="page-heading">
            <div>
              <p className="eyebrow">
                <span />
                YOUR DATA, REIMAGINED
              </p>
              <h1>
                Real structure.
                <br className="mobile-break" />
                <span className="hero-secondary"> Zero real details.</span>
              </h1>
              <p className="subtitle">
                Turn your JSON into fresh test data. Keep the shape. Leave the
                originals behind.
              </p>
            </div>
            <span className="workspace-badge">
              LOCAL WORKSPACE <span className="status-dot" />
            </span>
          </div>
          {view === "guide" ? (
            <section className="guide-grid">
              <article className="panel guide-card">
                <Icon name="terminal" />
                <h2>A small CLI. A lot of possibilities.</h2>
                <p>
                  Keep stdout clean for pipelines. Set generators by exact
                  key-segment paths.
                </p>
                <pre>
                  <code>{`pnpm cli --input users.json --generate \\\n  --field '["email"]=email' \\\n  --field '["id"]=uuid' --seed demo\n\npnpm cli --input users.json --generate \\\n  --format csv --output synthetic.csv`}</code>
                </pre>
                <p>
                  Use <code>--fields settings.json</code> for a JSON array of{" "}
                  <code>{"{path, generator}"}</code> objects. Output files are
                  never overwritten.
                </p>
              </article>
              <article className="panel guide-card">
                <Icon name="code" />
                <h2>One core. Every surface.</h2>
                <p>
                  The website, CLI and Electron desktop app share the same local
                  generation engine. No backend is needed for your source JSON.
                </p>
                <pre>
                  <code>{`pnpm dev              # website\npnpm dev:desktop      # Electron app\npnpm dev:api          # loopback REST\npnpm check            # all checks`}</code>
                </pre>
                <p>
                  The REST service accepts only explicit field paths and
                  generator settings, never source documents. Open its loopback
                  URL for the API reference.
                </p>
              </article>
              <article className="panel guide-card full-width">
                <Icon name="shield" />
                <h2>Private, not a promise of anonymization.</h2>
                <p>
                  Keys, nesting and array lengths remain. Auto mode preserves
                  primitive types and nulls. Choosing a generator explicitly may
                  change a field's type. Email addresses use the reserved{" "}
                  <code>example.test</code> domain; names come from a small
                  fictional fixture list. Dates are UTC in 2020–2029. Seeded
                  UUIDs are for test data, not secrets. No LLM is connected. CSV
                  uses JSON-path headers, nested arrays remain JSON cells, and
                  spreadsheet formula prefixes are escaped.
                </p>
              </article>
            </section>
          ) : (
            <>
              <section
                className="control-strip"
                aria-label="Generation settings"
              >
                <div className="control-label">
                  <span className="small-icon">
                    <Icon name="spark" />
                  </span>
                  <div>
                    <strong>Make it your own</strong>
                    <span>Predictable randomness, every time.</span>
                  </div>
                </div>
                <label className="seed-control" htmlFor="seed">
                  <span>SEED</span>
                  <input
                    id="seed"
                    value={seed}
                    maxLength={256}
                    onChange={(event) => {
                      setSeed(event.target.value);
                      invalidate();
                    }}
                    spellCheck={false}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") generate();
                    }}
                  />
                </label>
                <button
                  className="primary-button"
                  type="button"
                  onClick={generate}
                >
                  <Icon name="spark" />
                  Generate data<kbd>↵</kbd>
                </button>
              </section>
              {error && (
                <div role="alert" className="alert">
                  <strong>Let's fix that.</strong> {error}
                </div>
              )}
              <section className="editor-grid" aria-label="JSON workspace">
                <article className="panel editor-panel">
                  <div className="panel-heading">
                    <div className="panel-title">
                      <span className="step">01</span>
                      <h2>Source JSON</h2>
                      <span className="tag">INPUT</span>
                    </div>
                    <div className="panel-tools">
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => updateSource(EXAMPLE)}
                      >
                        Load example
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label="Import JSON file"
                        onClick={() => upload.current?.click()}
                      >
                        <Icon name="download" />
                      </button>
                      <input
                        ref={upload}
                        className="visually-hidden"
                        type="file"
                        accept=".json,application/json"
                        aria-label="Choose local JSON file"
                        onChange={(event) => {
                          void loadFile(event.target.files?.[0]);
                          event.target.value = "";
                        }}
                      />
                    </div>
                  </div>
                  <div className="code-editor">
                    <div className="line-numbers" aria-hidden="true">
                      {Array.from(
                        { length: Math.min(input.split("\n").length, 200) },
                        (_, index) => index + 1,
                      ).map((line) => (
                        <span key={line}>{line}</span>
                      ))}
                    </div>
                    <textarea
                      id="source"
                      aria-label="Your JSON"
                      value={input}
                      onChange={(event) => updateSource(event.target.value)}
                      onScroll={(event) => {
                        const numbers =
                          event.currentTarget.previousElementSibling;
                        if (numbers)
                          numbers.scrollTop = event.currentTarget.scrollTop;
                      }}
                      spellCheck={false}
                    />
                  </div>
                  <div className="panel-footer">
                    <span>
                      <span
                        className={`status-dot ${analysis.error ? "warning" : ""}`}
                      />
                      {analysis.error ? "Awaiting valid JSON" : "Valid JSON"}
                    </span>
                    <span>
                      Never leaves your device <Icon name="shield" />
                    </span>
                  </div>
                </article>
                <article className="panel editor-panel output-panel">
                  <div className="panel-heading">
                    <div className="panel-title">
                      <span className="step">02</span>
                      <h2>Synthetic output</h2>
                    </div>
                    <fieldset className="segmented" aria-label="Preview format">
                      {(["json", "csv"] as const).map((value) => (
                        <button
                          key={value}
                          type="button"
                          aria-pressed={format === value}
                          onClick={() => setFormat(value)}
                        >
                          {value.toUpperCase()}
                        </button>
                      ))}
                    </fieldset>
                  </div>
                  {result ? (
                    <pre className="output-code">
                      {output.length > PREVIEW_LIMIT && (
                        <span className="preview-note">
                          Preview limited to 20000 characters. Copy and exports
                          include the full result.{"\n\n"}
                        </span>
                      )}
                      {format === "json" ? (
                        <JsonCode text={output.slice(0, PREVIEW_LIMIT)} />
                      ) : (
                        <code>{output.slice(0, PREVIEW_LIMIT)}</code>
                      )}
                    </pre>
                  ) : (
                    <div className="empty-output">
                      <div className="empty-art">
                        <Icon name="spark" />
                      </div>
                      <h3>A fresh start for your data.</h3>
                      <p>
                        Your structure, with a new identity.
                        <br />
                        Choose your generators and hit generate.
                      </p>
                      <span className="empty-hint">
                        <span />
                        100% local. No source values uploaded.
                      </span>
                    </div>
                  )}
                  <div className="panel-footer">
                    <span>
                      {result
                        ? `${new TextEncoder().encode(output).length.toLocaleString()} bytes · ready to export`
                        : "Ready when you are"}
                    </span>
                    <button
                      type="button"
                      className="text-button copy-button"
                      onClick={() => void copy()}
                      disabled={!result}
                    >
                      <Icon name="copy" />
                      Copy output
                    </button>
                  </div>
                </article>
              </section>
              <section
                className="panel field-panel"
                aria-label="Field generators"
              >
                <div className="panel-heading">
                  <div className="panel-title">
                    <Icon name="grid" />
                    <h2>Field generators</h2>
                    <span className="field-count">
                      {analysis.fields.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="text-button"
                    disabled={
                      analysis.fields.length === 0 ||
                      analysis.fields.length > 200
                    }
                    onClick={() => {
                      setSettings(
                        analysis.fields.flatMap(({ path }) => {
                          const generator = suggestGenerator(path);
                          return generator === "auto"
                            ? []
                            : [{ path, generator }];
                        }),
                      );
                      invalidate();
                    }}
                  >
                    <Icon name="spark" />
                    Suggest from keys
                  </button>
                </div>
                <div className="field-intro">
                  A little direction goes a long way. Pick a generator for each
                  field.<span>Suggestions use names, never values.</span>
                </div>
                {analysis.fields.length === 0 ? (
                  <p className="field-empty">
                    Add valid JSON with primitive fields to configure
                    generators.
                  </p>
                ) : analysis.fields.length > 200 ? (
                  <p className="field-empty">
                    More than 200 fields: auto generation remains available;
                    custom mappings are limited to 200.
                  </p>
                ) : (
                  <div className="fields-table">
                    <div className="field-table-heading">
                      <span>FIELD PATH</span>
                      <span>LOCAL TYPE</span>
                      <span>GENERATOR</span>
                    </div>
                    {analysis.fields.map(({ path, types }) => (
                      <div className="field-row" key={JSON.stringify(path)}>
                        <code title={JSON.stringify(path)}>
                          <span className="field-symbol">#</span>
                          {path.length === 0
                            ? "(root value)"
                            : JSON.stringify(path)}
                        </code>
                        <span className="type-badge">{types.join(" / ")}</span>
                        <label className="generator-select">
                          <span className="visually-hidden">
                            Generator for {JSON.stringify(path)}
                          </span>
                          <select
                            value={
                              settings.find(
                                (setting) =>
                                  JSON.stringify(setting.path) ===
                                  JSON.stringify(path),
                              )?.generator ?? "auto"
                            }
                            onChange={(event) => {
                              if (isGeneratorKind(event.target.value))
                                choose(path, event.target.value);
                            }}
                          >
                            {GENERATOR_KINDS.map((kind) => (
                              <option key={kind} value={kind}>
                                {LABELS[kind]}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </section>
              <section
                className="export-bar"
                aria-label="Export generated data"
              >
                <div>
                  <span className="export-icon">
                    <Icon name="download" />
                  </span>
                  <div>
                    <strong>Good to go. Yours to keep.</strong>
                    <p>
                      Export only the generated data. Your source stays put.
                    </p>
                  </div>
                </div>
                <div className="export-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={!result}
                    onClick={() => download("json")}
                  >
                    <Icon name="download" />
                    Export JSON
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={!result}
                    onClick={() => download("csv")}
                  >
                    <Icon name="download" />
                    Export CSV
                  </button>
                </div>
              </section>
              <p className="privacy-note">
                <Icon name="shield" />
                <span>
                  Private by design, not certified anonymization. Keys and
                  structure remain; generated values can coincidentally match
                  originals.
                </span>
              </p>
              <div role="status" className="notice" aria-live="polite">
                {notice && (
                  <>
                    <Icon name="check" />
                    {notice}
                  </>
                )}
              </div>
            </>
          )}
          <footer className="workspace-footer">
            <span>
              randomapi <span className="footer-dot">/</span> A playground for
              possibilities.
            </span>
            <span>
              <span className="status-dot" />
              All systems local
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Application root element is missing.");
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
