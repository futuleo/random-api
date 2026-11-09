import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import {
  isRendererAsset,
  rendererPolicy,
  secureWebPreferences,
} from "./security.js";

const rendererDirectory = resolve("apps/web/dist");
const assetUrl = (path: string) =>
  pathToFileURL(resolve(rendererDirectory, path)).href;

describe("desktop renderer isolation", () => {
  it("uses an immutable sandbox without a preload or Node access", () => {
    expect(secureWebPreferences).toEqual({
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
      webviewTag: false,
      devTools: false,
      navigateOnDragDrop: false,
      spellcheck: false,
    });
    expect(Object.isFrozen(secureWebPreferences)).toBe(true);
    expect(secureWebPreferences).not.toHaveProperty("preload");
  });

  it("allows only assets inside the built renderer directory", () => {
    expect(isRendererAsset(assetUrl("index.html"), rendererDirectory)).toBe(
      true,
    );
    expect(
      isRendererAsset(assetUrl("assets/index.js"), rendererDirectory),
    ).toBe(true);
    expect(
      isRendererAsset(`${assetUrl("index.html")}#section`, rendererDirectory),
    ).toBe(true);
    for (const url of [
      assetUrl("../private.json"),
      assetUrl("../dist-elsewhere/index.html"),
      assetUrl("."),
      `${pathToFileURL(rendererDirectory).href}/%2e%2e/private.json`,
      "file://untrusted-host/share/index.html",
      "https://example.com/",
      "http://127.0.0.1:5173/",
      "javascript:alert(1)",
      "data:text/html,untrusted",
      "not a URL",
    ]) {
      expect(isRendererAsset(url, rendererDirectory)).toBe(false);
    }
  });

  it("forbids network connections, frames, workers, and inline scripts", () => {
    expect(rendererPolicy).toContain("connect-src 'none'");
    expect(rendererPolicy).toContain("frame-src 'none'");
    expect(rendererPolicy).toContain("worker-src 'none'");
    expect(rendererPolicy).toContain("script-src 'self'");
    expect(rendererPolicy).not.toContain("'unsafe-inline'");
    expect(rendererPolicy).not.toContain("'unsafe-eval'");
  });
});
