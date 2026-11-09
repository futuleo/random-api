import { isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const secureWebPreferences = Object.freeze({
  contextIsolation: true,
  sandbox: true,
  nodeIntegration: false,
  webSecurity: true,
  webviewTag: false,
  devTools: false,
  navigateOnDragDrop: false,
  spellcheck: false,
});

export const rendererPolicy = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'none'",
  "worker-src 'none'",
  "object-src 'none'",
  "frame-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join("; ");

export function isRendererAsset(
  url: string,
  rendererDirectory: string,
): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "file:" || parsed.host !== "") return false;
    const path = relative(resolve(rendererDirectory), fileURLToPath(parsed));
    return (
      path !== "" &&
      path !== ".." &&
      !path.startsWith(`..${sep}`) &&
      !isAbsolute(path)
    );
  } catch {
    return false;
  }
}
