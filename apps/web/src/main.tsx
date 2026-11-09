import {
  extractKeyPaths,
  generateSyntheticData,
  type KeyPath,
} from "@random-api/core";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

function App() {
  const [input, setInput] = useState("");
  const [paths, setPaths] = useState<KeyPath[] | null>(null);
  const [seed, setSeed] = useState("random-api");
  const [generated, setGenerated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function processInput(action: "inspect" | "generate") {
    setPaths(null);
    setGenerated(null);
    setError(null);
    let document: unknown;
    try {
      document = JSON.parse(input);
    } catch {
      setError("Invalid JSON. Check your input and try again.");
      return;
    }
    try {
      if (action === "inspect") {
        setPaths(extractKeyPaths(document));
      } else {
        setGenerated(
          JSON.stringify(generateSyntheticData(document, { seed }), null, 2),
        );
      }
    } catch {
      setError(
        action === "generate"
          ? "Could not generate data. Use a non-empty seed and JSON within 100 levels and 100000 values."
          : "Could not inspect this JSON. Try a less deeply nested document.",
      );
    }
  }

  function download() {
    if (generated === null) return;
    const url = URL.createObjectURL(
      new Blob([`${generated}\n`], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "synthetic-data.json";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return (
    <main>
      <p className="eyebrow">LOCAL-FIRST DATA TOOLS</p>
      <h1>Random API</h1>
      <p>
        Inspect JSON keys or generate synthetic values locally. The same seed
        and structure produce the same output. LLM providers are not connected.
      </p>
      <label htmlFor="source">Your JSON</label>
      <textarea
        id="source"
        value={input}
        onChange={(event) => {
          setInput(event.target.value);
          setPaths(null);
          setGenerated(null);
          setError(null);
        }}
        placeholder={'{"name": "Example", "address": {"city": "Example"}}'}
        spellCheck={false}
      />
      <label htmlFor="seed">Generation seed</label>
      <input
        id="seed"
        value={seed}
        onChange={(event) => {
          setSeed(event.target.value);
          setGenerated(null);
          setError(null);
        }}
        spellCheck={false}
        aria-describedby="generation-note"
      />
      <p id="generation-note" className="privacy">
        Generation preserves keys, nesting, array lengths and primitive types.
        Strings and numbers are generic synthetic values, not realistic field
        formats. Nulls remain null. This is not certified anonymization.
      </p>
      <div className="actions">
        <button type="button" onClick={() => processInput("inspect")}>
          Inspect keys
        </button>
        <button type="button" onClick={() => processInput("generate")}>
          Generate data
        </button>
      </div>
      <p className="privacy">
        No input is uploaded or saved. Future LLM requests may contain key names
        and their nesting paths only, never original values.
      </p>
      {error && <p role="alert">{error}</p>}
      {paths !== null && (
        <section aria-live="polite">
          <h2>Key paths</h2>
          <pre>{JSON.stringify(paths, null, 2)}</pre>
        </section>
      )}
      {generated !== null && (
        <section aria-live="polite">
          <h2>Synthetic JSON</h2>
          <button type="button" onClick={download}>
            Download JSON
          </button>
          <pre>{generated}</pre>
        </section>
      )}
    </main>
  );
}

const root = document.getElementById("root");
if (!root) {
  throw new Error("Application root element is missing.");
}
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
