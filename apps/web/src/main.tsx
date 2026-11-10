import {
  EXPORT_FORMATS,
  EXPORT_MEDIA_TYPES,
  type ExportFormat,
  type FieldGenerator,
  GENERATOR_KINDS,
  type GeneratorKind,
  generateSimilarObjects,
  generateSyntheticData,
  getScenario,
  inspectLocalFields,
  isGeneratorKind,
  isLocale,
  isObjectTemplate,
  type JsonValue,
  LOCALE_NAMES,
  LOCALES,
  type Locale,
  SCENARIOS,
  type Scenario,
  serializeOutput,
  suggestGenerator,
} from "@random-api/core";
import { StrictMode, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { type MessageKey, translate, translateError } from "./i18n.js";
import { createOutputPreview } from "./preview.js";
import "./style.css";

const DEFAULT_SCENARIO = getScenario("users");
const EXAMPLE = JSON.stringify(DEFAULT_SCENARIO.template, null, 2);

const LABELS: Record<GeneratorKind, MessageKey> = {
  auto: "Auto · preserve type",
  email: "Email address",
  name: "Full name",
  date: "ISO date",
  uuid: "UUID v4",
  string: "Text token",
  number: "Number",
  boolean: "Boolean",
  enum: "Choice from a list",
};
const PREVIEW_LIMIT = 20_000;

function numberDraft(value: string | undefined, fallback: number): number {
  return value === undefined
    ? fallback
    : /^-?\d+$/.test(value)
      ? Number(value)
      : Number.NaN;
}

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
  const [locale, setLocale] = useState<Locale>("en");
  const t = (
    key: MessageKey,
    values?: Readonly<Record<string, string | number>>,
  ) => translate(locale, key, values);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  const scenarios = useMemo(
    () => SCENARIOS.map(({ id }) => getScenario(id, locale)),
    [locale],
  );
  const categories = [
    "All",
    ...new Set(scenarios.map((item) => item.category)),
  ];
  const [input, setInput] = useState(EXAMPLE);
  const [count, setCount] = useState("10");
  const [settings, setSettings] = useState<readonly FieldGenerator[]>(
    DEFAULT_SCENARIO.fields,
  );
  const [fieldDrafts, setFieldDrafts] = useState<
    Record<string, { min?: string; max?: string; values?: string }>
  >({});
  const [selectedScenario, setSelectedScenario] = useState<string | null>(
    DEFAULT_SCENARIO.id,
  );
  const [showScenarios, setShowScenarios] = useState(false);
  const [scenarioQuery, setScenarioQuery] = useState("");
  const [category, setCategory] = useState("All");
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
  const objectTemplate =
    analysis.error === null && isObjectTemplate(analysis.document);
  const filteredScenarios = scenarios.filter(
    (item) =>
      (category === "All" || item.category === category) &&
      `${item.name} ${item.category} ${item.description}`
        .toLowerCase()
        .includes(scenarioQuery.trim().toLowerCase()),
  );

  function invalidate() {
    setResult(null);
    setError(null);
    setNotice("");
  }
  function updateSource(text: string) {
    setInput(text);
    setSettings([]);
    setFieldDrafts({});
    setSelectedScenario(null);
    invalidate();
  }
  function loadScenario(scenario: Scenario) {
    setInput(JSON.stringify(scenario.template, null, 2));
    setSettings(scenario.fields);
    setFieldDrafts({});
    setSelectedScenario(scenario.id);
    setShowScenarios(false);
    invalidate();
  }
  function changeLocale(next: Locale) {
    if (next === locale) return;
    if (selectedScenario !== null) {
      const previous = getScenario(selectedScenario, locale);
      const localized = getScenario(selectedScenario, next);
      setInput(JSON.stringify(localized.template, null, 2));
      setSettings((current) =>
        current.map((setting) => {
          const index = previous.fields.findIndex(
            (field) =>
              JSON.stringify(field.path) === JSON.stringify(setting.path),
          );
          const replacement = localized.fields[index];
          return replacement &&
            JSON.stringify(setting) === JSON.stringify(previous.fields[index])
            ? replacement
            : setting;
        }),
      );
    }
    setLocale(next);
    setCategory("All");
    setScenarioQuery("");
    invalidate();
  }
  function choose(path: readonly string[], generator: GeneratorKind) {
    setSettings((current) => [
      ...current.filter(
        (field) => JSON.stringify(field.path) !== JSON.stringify(path),
      ),
      ...(generator === "auto"
        ? []
        : [
            generator === "enum"
              ? { path, generator, values: ["pending", "active", "disabled"] }
              : { path, generator },
          ]),
    ]);
    setFieldDrafts((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([id]) => id !== JSON.stringify(path)),
      ),
    );
    invalidate();
  }
  function updateFieldDraft(
    path: readonly string[],
    key: "min" | "max" | "values",
    value: string,
  ) {
    const id = JSON.stringify(path);
    setFieldDrafts((current) => ({
      ...current,
      [id]: { ...current[id], [key]: value },
    }));
    invalidate();
  }
  function generate() {
    invalidate();
    if (analysis.error) {
      setError(analysis.error);
      return;
    }
    try {
      const options = {
        seed: crypto.randomUUID(),
        locale,
        fields: settings.map((setting): FieldGenerator => {
          const draft = fieldDrafts[JSON.stringify(setting.path)];
          if (setting.generator === "number")
            return {
              path: setting.path,
              generator: "number",
              min: numberDraft(draft?.min, setting.min ?? 0),
              max: numberDraft(draft?.max, setting.max ?? 999_999),
            };
          if (setting.generator === "enum")
            return {
              path: setting.path,
              generator: "enum",
              values:
                draft?.values === undefined
                  ? setting.values
                  : draft.values.split("\n"),
            };
          return setting;
        }),
      };
      const value = objectTemplate
        ? generateSimilarObjects(analysis.document, {
            ...options,
            count: Number(count),
          })
        : generateSyntheticData(analysis.document, options);
      serializeOutput(value, format);
      setResult({ value });
      setNotice(
        objectTemplate
          ? t("{count} objects generated. Entirely on your device.", {
              count: Number(count),
            })
          : t("Fresh synthetic data. Entirely on your device."),
      );
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Could not generate data.",
      );
    }
  }
  const preview = useMemo(
    () => (result === null ? null : createOutputPreview(result.value, format)),
    [result, format],
  );
  const output = preview?.ok ? preview.text : "";
  const previewError = preview !== null && !preview.ok ? preview.error : null;
  async function copy() {
    if (!preview?.ok) return;
    try {
      await navigator.clipboard.writeText(output);
      setNotice(t("Generated output copied to clipboard."));
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
          type: EXPORT_MEDIA_TYPES[exportFormat],
        }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `synthetic-data.${exportFormat}`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      setNotice(
        t("{format} export prepared.", { format: exportFormat.toUpperCase() }),
      );
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
          aria-label={t("Random API home")}
        >
          <span className="brand-mark">
            <Icon name="grid" />
          </span>
          random<span className="brand-light">api</span>
          <span className="version">LOCAL</span>
        </button>
        <p className="nav-caption">
          {t("Workspace").toLocaleUpperCase(locale)}
        </p>
        <nav aria-label={t("Workspace")}>
          <button
            type="button"
            className={`nav-item ${view === "studio" ? "active" : ""}`}
            onClick={() => setView("studio")}
          >
            <Icon name="grid" />
            {t("Data studio")}
            <span className="nav-count">01</span>
          </button>
          <button
            type="button"
            className={`nav-item ${view === "guide" ? "active" : ""}`}
            onClick={() => setView("guide")}
          >
            <Icon name="terminal" />
            {t("Developer guide")}
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="local-card">
            <span className="status-dot" />
            <span>
              {t("Local engine")}
              <strong>{t("Everything stays here.")}</strong>
            </span>
            <Icon name="shield" />
          </div>
          <p>
            {t("No accounts. No uploads.")}
            <br />
            {t("Just a little controlled randomness.")}
          </p>
          <span className="sidebar-footer">{t("BUILT FOR THE WHAT-IFS.")}</span>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div>
            <span className="breadcrumb">{t("Workspace")}</span>
            <span className="slash">/</span>
            {view === "studio" ? t("Data studio") : t("Developer guide")}
          </div>
          <button
            type="button"
            className={`mobile-nav text-button ${view === "guide" ? "return-to-studio" : ""}`}
            onClick={() => setView(view === "studio" ? "guide" : "studio")}
          >
            {view === "studio"
              ? t("Developer guide")
              : t("Back to data studio")}
          </button>
          <span className="private-badge">
            <Icon name="shield" />
            {t("Private by design")}
          </span>
        </header>
        <main id="studio">
          <div className="page-heading">
            <div>
              <p className="eyebrow">
                <span />
                {t("YOUR DATA, REIMAGINED")}
              </p>
              <h1>
                {t("Real structure.")}
                <br className="mobile-break" />
                <span className="hero-secondary">
                  {" "}
                  {t("Zero real details.")}
                </span>
              </h1>
              <p className="subtitle">
                {t(
                  "Turn your JSON into fresh test data. Keep the shape. Leave the originals behind.",
                )}
              </p>
            </div>
            <span className="workspace-badge">
              {t("LOCAL WORKSPACE")} <span className="status-dot" />
            </span>
          </div>
          <div className="language-bar">
            <label htmlFor="data-language">{t("Language")}</label>
            <select
              id="data-language"
              className="language-select"
              value={locale}
              onChange={(event) => {
                if (isLocale(event.target.value))
                  changeLocale(event.target.value);
              }}
            >
              {LOCALES.map((language) => (
                <option key={language} value={language}>
                  {LOCALE_NAMES[language]}
                </option>
              ))}
            </select>
          </div>
          {view === "guide" ? (
            <section className="guide-grid">
              <article className="panel guide-card full-width">
                <Icon name="code" />
                <h2>{t("Full documentation, powered by VitePress.")}</h2>
                <p>
                  {t(
                    "Guides for every interface, local search and all 30 scenarios with actual settings, examples and rgen commands.",
                  )}
                </p>
                <pre>
                  <code>pnpm dev:docs</code>
                </pre>
                <p>
                  {t(
                    "Open the loopback address printed by the command. Set VITE_DOCS_URL at web build time to link a hosted documentation site.",
                  )}
                </p>
                {typeof import.meta.env.VITE_DOCS_URL === "string" &&
                  /^https?:\/\//.test(import.meta.env.VITE_DOCS_URL) && (
                    <a
                      href={import.meta.env.VITE_DOCS_URL}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t("Open documentation")}
                    </a>
                  )}
              </article>
              <article className="panel guide-card">
                <Icon name="terminal" />
                <h2>{t("A small CLI. A lot of possibilities.")}</h2>
                <p>
                  {t(
                    "Keep stdout clean for pipelines. Set generators by exact key-segment paths.",
                  )}
                </p>
                <pre>
                  <code>{`rgen scenario users --count 100 --locale ${locale}\nrgen scenarios --locale ${locale}\n\nrgen generate --input users.json \\\n  --count 50 --field '["email"]=email' \\\n  --format csv --output synthetic.csv`}</code>
                </pre>
                <p>
                  {t(
                    "Use --fields settings.json for explicit field settings. Output files are never overwritten.",
                  )}
                </p>
              </article>
              <article className="panel guide-card">
                <Icon name="code" />
                <h2>{t("One core. Every surface.")}</h2>
                <p>
                  {t(
                    "Web, CLI and Electron share the same local engine. No backend is needed for your source JSON.",
                  )}
                </p>
                <pre>
                  <code>{`pnpm dev\npnpm dev:desktop\npnpm dev:api\npnpm check`}</code>
                </pre>
                <p>
                  {t(
                    "REST accepts only explicit field paths and generator settings, never source documents.",
                  )}
                </p>
              </article>
              <article className="panel guide-card full-width">
                <Icon name="shield" />
                <h2>{t("Private, not a promise of anonymization.")}</h2>
                <p>
                  {t(
                    "Keys and structure remain. Fields are independent; synthetic names and identifiers may coincide with real data. UUIDs are test fixtures, not secrets. CSV formula-like strings are escaped. No LLM is connected.",
                  )}
                </p>
              </article>
            </section>
          ) : (
            <>
              {showScenarios && (
                <section
                  id="scenario-browser"
                  className="panel scenario-browser"
                  aria-label={t("Scenario library")}
                >
                  <div className="panel-heading">
                    <div className="panel-title">
                      <Icon name="grid" />
                      <h2>{t("Start with a scenario")}</h2>
                      <span className="field-count">{SCENARIOS.length}</span>
                    </div>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => setShowScenarios(false)}
                    >
                      {t("Close library")}
                    </button>
                  </div>
                  <div className="scenario-toolbar">
                    <p>
                      {t(
                        "Ready-made structures for common testing workflows. Choose one, then adjust the fields.",
                      )}
                    </p>
                    <input
                      type="search"
                      aria-label={t("Search scenarios")}
                      placeholder={`${t("Search scenarios")}...`}
                      value={scenarioQuery}
                      onChange={(event) => setScenarioQuery(event.target.value)}
                    />
                  </div>
                  <nav
                    className="scenario-categories"
                    aria-label={t("Scenario categories")}
                  >
                    {categories.map((item) => (
                      <button
                        key={item}
                        type="button"
                        aria-pressed={category === item}
                        onClick={() => setCategory(item)}
                      >
                        {item === "All" ? t("All") : item}
                      </button>
                    ))}
                  </nav>
                  <div className="scenario-grid">
                    {filteredScenarios.map((scenario) => (
                      <button
                        type="button"
                        className="scenario-card"
                        key={scenario.id}
                        aria-pressed={selectedScenario === scenario.id}
                        onClick={() => loadScenario(scenario)}
                      >
                        <span className="scenario-category">
                          {scenario.category}
                          <Icon
                            name={
                              selectedScenario === scenario.id
                                ? "check"
                                : "arrow"
                            }
                          />
                        </span>
                        <strong>{scenario.name}</strong>
                        <span className="scenario-description">
                          {scenario.description}
                        </span>
                        <span className="scenario-field-count">
                          {t("{count} fields · ready to generate", {
                            count: scenario.fields.length,
                          })}
                        </span>
                      </button>
                    ))}
                  </div>
                  {filteredScenarios.length === 0 && (
                    <p className="field-empty">
                      {t("No scenarios match. Try another search or category.")}
                    </p>
                  )}
                </section>
              )}
              {error && (
                <div role="alert" className="alert">
                  <strong>{t("Let's fix that.")}</strong>{" "}
                  {translateError(locale, error)}
                </div>
              )}
              <section className="editor-grid" aria-label={t("JSON workspace")}>
                <div className="source-column">
                  <article className="panel editor-panel">
                    <div className="panel-heading">
                      <div className="panel-title">
                        <span className="step">01</span>
                        <h2>{t("Source JSON")}</h2>
                        <span className="tag">{t("INPUT")}</span>
                      </div>
                      <div className="panel-tools">
                        <button
                          type="button"
                          className="text-button"
                          onClick={() =>
                            loadScenario(getScenario("users", locale))
                          }
                        >
                          {t("Load example")}
                        </button>
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={t("Import JSON file")}
                          onClick={() => upload.current?.click()}
                        >
                          <Icon name="download" />
                        </button>
                        <input
                          ref={upload}
                          className="visually-hidden"
                          type="file"
                          accept=".json,application/json"
                          aria-label={t("Choose local JSON file")}
                          onChange={(event) => {
                            void loadFile(event.target.files?.[0]);
                            event.target.value = "";
                          }}
                        />
                      </div>
                    </div>
                    <div className="scenario-picker">
                      <label htmlFor="scenario">
                        <span>
                          {t("Start with a scenario").toLocaleUpperCase(locale)}
                        </span>
                        <select
                          id="scenario"
                          value={selectedScenario ?? ""}
                          onChange={(event) => {
                            if (event.target.value)
                              loadScenario(
                                getScenario(event.target.value, locale),
                              );
                          }}
                        >
                          <option value="" disabled>
                            {t("Custom JSON")}
                          </option>
                          {categories
                            .filter((item) => item !== "All")
                            .map((group) => (
                              <optgroup key={group} label={group}>
                                {scenarios
                                  .filter(
                                    (scenario) => scenario.category === group,
                                  )
                                  .map((scenario) => (
                                    <option
                                      key={scenario.id}
                                      value={scenario.id}
                                    >
                                      {scenario.name}
                                    </option>
                                  ))}
                              </optgroup>
                            ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        className="text-button"
                        aria-expanded={showScenarios}
                        aria-controls="scenario-browser"
                        onClick={() => setShowScenarios(!showScenarios)}
                      >
                        <Icon name="grid" />
                        {t("Browse {count} scenarios", {
                          count: SCENARIOS.length,
                        })}
                      </button>
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
                        aria-label={t("Your JSON")}
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
                        {analysis.error
                          ? t("Awaiting valid JSON")
                          : t("Valid JSON")}
                      </span>
                      <span>
                        {t("Never leaves your device")} <Icon name="shield" />
                      </span>
                    </div>
                  </article>
                  <section
                    className="panel field-panel"
                    aria-label={t("Field generators")}
                  >
                    <div className="panel-heading">
                      <div className="panel-title">
                        <span className="step">02</span>
                        <h2>{t("Field generators")}</h2>
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
                          setFieldDrafts({});
                          invalidate();
                        }}
                      >
                        <Icon name="spark" />
                        {t("Suggest from keys")}
                      </button>
                    </div>
                    <div className="field-intro">
                      {t("Pick a generator for each field.")}
                      <span>{t("Suggestions use names, never values.")}</span>
                    </div>
                    {analysis.fields.length === 0 ? (
                      <p className="field-empty">
                        {t(
                          "Add valid JSON with primitive fields to configure generators.",
                        )}
                      </p>
                    ) : analysis.fields.length > 200 ? (
                      <p className="field-empty">
                        {t(
                          "More than 200 fields: auto generation remains available; custom mappings are limited to 200.",
                        )}
                      </p>
                    ) : (
                      <div className="fields-table">
                        <div className="field-table-heading">
                          <span>{t("FIELD PATH")}</span>
                          <span>{t("LOCAL TYPE")}</span>
                          <span>{t("GENERATOR")}</span>
                        </div>
                        {analysis.fields.map(({ path, types }) => {
                          const setting = settings.find(
                            (item) =>
                              JSON.stringify(item.path) ===
                              JSON.stringify(path),
                          );
                          const draft = fieldDrafts[JSON.stringify(path)];
                          return (
                            <div
                              className="field-row"
                              key={JSON.stringify(path)}
                            >
                              <code title={JSON.stringify(path)}>
                                <span className="field-symbol">#</span>
                                {path.length === 0
                                  ? t("(root value)")
                                  : JSON.stringify(path)}
                              </code>
                              <span className="type-badge">
                                {types.join(" / ")}
                              </span>
                              <label className="generator-select">
                                <span className="visually-hidden">
                                  {t("Generator for {path}", {
                                    path: JSON.stringify(path),
                                  })}
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
                                      {t(LABELS[kind])}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              {setting?.generator === "number" && (
                                <div className="field-options number-options">
                                  <label>
                                    <span>{t("MINIMUM")}</span>
                                    <input
                                      inputMode="numeric"
                                      aria-label={t("Minimum for {path}", {
                                        path: JSON.stringify(path),
                                      })}
                                      value={
                                        draft?.min ?? String(setting.min ?? 0)
                                      }
                                      onChange={(event) =>
                                        updateFieldDraft(
                                          path,
                                          "min",
                                          event.target.value,
                                        )
                                      }
                                    />
                                  </label>
                                  <span
                                    className="range-separator"
                                    aria-hidden="true"
                                  >
                                    {t("to")}
                                  </span>
                                  <label>
                                    <span>{t("MAXIMUM")}</span>
                                    <input
                                      inputMode="numeric"
                                      aria-label={t("Maximum for {path}", {
                                        path: JSON.stringify(path),
                                      })}
                                      value={
                                        draft?.max ??
                                        String(setting.max ?? 999_999)
                                      }
                                      onChange={(event) =>
                                        updateFieldDraft(
                                          path,
                                          "max",
                                          event.target.value,
                                        )
                                      }
                                    />
                                  </label>
                                  <span className="option-hint">
                                    {t("Inclusive integer range")}
                                  </span>
                                </div>
                              )}
                              {setting?.generator === "enum" && (
                                <label className="field-options enum-options">
                                  <span>{t("ALLOWED VALUES")}</span>
                                  <textarea
                                    aria-label={t("Allowed values for {path}", {
                                      path: JSON.stringify(path),
                                    })}
                                    value={
                                      draft?.values ?? setting.values.join("\n")
                                    }
                                    rows={3}
                                    onChange={(event) =>
                                      updateFieldDraft(
                                        path,
                                        "values",
                                        event.target.value,
                                      )
                                    }
                                    spellCheck={false}
                                  />
                                  <span className="option-hint">
                                    {t(
                                      "One value per line · 1–50 unique choices · never inferred from your source",
                                    )}
                                  </span>
                                </label>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                </div>
                <div className="output-column">
                  <article className="panel editor-panel output-panel">
                    <section
                      className="control-strip"
                      aria-label={t("Generation settings")}
                    >
                      <label className="count-control" htmlFor="object-count">
                        <span>{t("OBJECTS")}</span>
                        <input
                          id="object-count"
                          aria-label={t("Number of objects")}
                          type="number"
                          min={1}
                          max={1000}
                          step={1}
                          value={count}
                          disabled={!objectTemplate}
                          aria-describedby="object-count-note"
                          onChange={(event) => {
                            setCount(event.target.value);
                            invalidate();
                          }}
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
                        {t("Generate data")}
                        <kbd>↵</kbd>
                      </button>
                    </section>
                    <p id="object-count-note" className="count-note">
                      {objectTemplate
                        ? t(
                            "1–1000 objects. Each run is fresh; nested arrays keep their shape.",
                          )
                        : t(
                            "Object count requires an object template. Other JSON keeps its shape.",
                          )}
                    </p>
                    <div className="panel-heading">
                      <div className="panel-title">
                        <span className="step">03</span>
                        <h2>{t("Synthetic output")}</h2>
                      </div>
                      <fieldset
                        className="segmented"
                        aria-label={t("Preview format")}
                      >
                        {EXPORT_FORMATS.map((value) => (
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
                    {previewError ? (
                      <div className="preview-error" role="alert">
                        <strong>
                          {t(
                            "This format cannot represent the generated data.",
                          )}
                        </strong>
                        <p>{translateError(locale, previewError)}</p>
                        <p>
                          {t(
                            "Your source and result are preserved. Choose another format or export JSON.",
                          )}
                        </p>
                      </div>
                    ) : result ? (
                      <pre className="output-code">
                        {output.length > PREVIEW_LIMIT && (
                          <span className="preview-note">
                            {t(
                              "Preview limited to 20000 characters. Copy and exports include the full result.",
                            )}
                            {"\n\n"}
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
                        <h3>{t("A fresh start for your data.")}</h3>
                        <p>
                          {t("Your structure, with a new identity.")}
                          <br />
                          {t("Choose your generators and hit generate.")}
                        </p>
                        <span className="empty-hint">
                          <span />
                          {t("100% local. No source values uploaded.")}
                        </span>
                      </div>
                    )}
                    <div className="panel-footer">
                      <span>
                        {previewError
                          ? t("Preview unavailable; choose another format")
                          : result
                            ? `${Array.isArray(result.value) ? `${t(objectTemplate ? "{count} objects" : "{count} items", { count: result.value.length })} · ` : ""}${t("{bytes} bytes · ready to export", { bytes: new TextEncoder().encode(output).length.toLocaleString(locale) })}`
                            : t("Ready when you are")}
                      </span>
                      <button
                        type="button"
                        className="text-button copy-button"
                        onClick={() => void copy()}
                        disabled={!preview?.ok}
                      >
                        <Icon name="copy" />
                        {t("Copy output")}
                      </button>
                    </div>
                  </article>
                  <section
                    className="export-bar"
                    aria-label={t("Export generated data")}
                  >
                    <div>
                      <span className="export-icon">
                        <Icon name="download" />
                      </span>
                      <div>
                        <strong>{t("Good to go. Yours to keep.")}</strong>
                        <p>
                          {t(
                            "Export only the generated data. Your source stays put.",
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="export-actions">
                      {EXPORT_FORMATS.map((value) => (
                        <button
                          key={value}
                          type="button"
                          className="secondary-button"
                          disabled={!result}
                          onClick={() => download(value)}
                        >
                          <Icon name="download" />
                          {t("Export {format}", {
                            format: value.toUpperCase(),
                          })}
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
              </section>
              <p className="privacy-note">
                <Icon name="shield" />
                <span>
                  {t(
                    "Private by design, not certified anonymization. Keys and nested structure remain; generated values can coincidentally match originals.",
                  )}
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
              randomapi <span className="footer-dot">/</span>{" "}
              {t("A playground for possibilities.")}
            </span>
            <span>
              <span className="status-dot" />
              {t("All systems local")}
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
