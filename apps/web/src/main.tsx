import { extractKeyPaths, type KeyPath } from "@random-api/core";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

function App() {
  const [input, setInput] = useState("");
  const [paths, setPaths] = useState<KeyPath[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function inspect() {
    let document: unknown;
    try {
      document = JSON.parse(input);
    } catch {
      setPaths(null);
      setError("Invalid JSON. Check your input and try again.");
      return;
    }
    setPaths(extractKeyPaths(document));
    setError(null);
  }

  return (
    <main>
      <p className="eyebrow">LOCAL-FIRST DATA TOOLS</p>
      <h1>Random API</h1>
      <p>
        The foundation for synthetic data generation. Inspect JSON keys locally;
        generation and LLM providers are not connected yet.
      </p>
      <label htmlFor="source">Your JSON</label>
      <textarea
        id="source"
        value={input}
        onChange={(event) => {
          setInput(event.target.value);
          setPaths(null);
          setError(null);
        }}
        placeholder={'{"name": "Example", "address": {"city": "Example"}}'}
        spellCheck={false}
      />
      <button type="button" onClick={inspect}>
        Inspect keys
      </button>
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
