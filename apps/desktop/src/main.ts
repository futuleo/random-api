import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  app,
  BrowserWindow,
  dialog,
  Menu,
  nativeTheme,
  session,
} from "electron";
import {
  isRendererAsset,
  rendererPolicy,
  secureWebPreferences,
} from "./security.js";

const smokeTest = process.argv.includes("--smoke-test");
app.enableSandbox();

let window: BrowserWindow | null = null;
let finishing = false;
let smokeTimeout: ReturnType<typeof setTimeout> | undefined;
type SmokeStage =
  | "application startup"
  | "window creation"
  | "local page loading"
  | "security configuration"
  | "renderer process sandbox"
  | "React UI readiness"
  | "renderer Node isolation"
  | "renderer crash"
  | "renderer responsiveness"
  | "unexpected window close";
let smokeStage: SmokeStage = "application startup";

function finishSmoke(success: boolean): void {
  if (finishing) return;
  finishing = true;
  clearTimeout(smokeTimeout);
  const message = success
    ? "Desktop smoke test passed.\n"
    : `Desktop smoke test failed: ${smokeStage}.\n`;
  process[success ? "stdout" : "stderr"].write(message);
  app.exit(success ? 0 : 1);
}

function fail(): void {
  if (smokeTest) {
    finishSmoke(false);
    return;
  }
  if (finishing) return;
  finishing = true;
  dialog.showErrorBox(
    "Random API could not start",
    "The local application could not be loaded. Rebuild or reinstall the desktop application.",
  );
  app.exit(1);
}

function createMenu(): void {
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      ...(process.platform === "darwin" ? [{ role: "appMenu" as const }] : []),
      {
        label: "File",
        submenu: [{ role: process.platform === "darwin" ? "close" : "quit" }],
      },
      {
        label: "Edit",
        submenu: [
          { role: "undo" },
          { role: "redo" },
          { type: "separator" },
          { role: "cut" },
          { role: "copy" },
          { role: "paste" },
          { role: "selectAll" },
        ],
      },
      {
        label: "View",
        submenu: [
          { role: "resetZoom" },
          { role: "zoomIn" },
          { role: "zoomOut" },
          { role: "togglefullscreen" },
        ],
      },
      {
        label: "Window",
        submenu: [{ role: "minimize" }, { role: "zoom" }],
      },
    ]),
  );
}

async function verifyRenderer(currentWindow: BrowserWindow): Promise<void> {
  smokeStage = "security configuration";
  const rendererProcess = app
    .getAppMetrics()
    .find(
      (metric) => metric.pid === currentWindow.webContents.getOSProcessId(),
    );
  if (
    !secureWebPreferences.contextIsolation ||
    !secureWebPreferences.sandbox ||
    secureWebPreferences.nodeIntegration ||
    !secureWebPreferences.webSecurity ||
    secureWebPreferences.webviewTag ||
    app.commandLine.hasSwitch("no-sandbox") ||
    app.commandLine.hasSwitch("disable-web-security")
  ) {
    finishSmoke(false);
    return;
  }
  smokeStage = "renderer process sandbox";
  if (process.platform !== "linux" && rendererProcess?.sandboxed !== true) {
    finishSmoke(false);
    return;
  }
  smokeStage = "React UI readiness";
  // This fixed probe returns static statuses only, never input or page contents.
  const valid: unknown = await currentWindow.webContents.executeJavaScript(`
    new Promise((resolve) => {
      let attempts = 0;
      const check = () => {
        const root = document.getElementById("root");
        const ready = document.title === "Random API"
          && root?.querySelector("main")
          && root.querySelector('textarea[aria-label="Your JSON"]')
          && Array.from(root.querySelectorAll("button")).some(
            (button) => {
              const label = button.cloneNode(true);
              label.querySelectorAll("kbd, svg, [aria-hidden='true']")
                .forEach((decoration) => decoration.remove());
              return label.textContent?.trim() === "Generate data";
            }
          );
        if (ready) {
          resolve(typeof window.require === "undefined"
            && typeof window.process === "undefined" ? "ready" : "node-exposed");
        } else if (++attempts >= 100) {
          resolve("ui-missing");
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    })
  `);
  if (valid === "node-exposed") smokeStage = "renderer Node isolation";
  finishSmoke(valid === "ready");
}

async function createWindow(): Promise<void> {
  smokeStage = "window creation";
  const rendererDirectory = app.isPackaged
    ? join(process.resourcesPath, "web")
    : fileURLToPath(new URL("../../web/dist/", import.meta.url));
  const isolatedSession = session.fromPartition("random-api-local");
  isolatedSession.setPermissionRequestHandler(
    (_contents, _permission, reply) => {
      reply(false);
    },
  );
  isolatedSession.setPermissionCheckHandler(() => false);
  isolatedSession.setDevicePermissionHandler(() => false);
  isolatedSession.webRequest.onBeforeRequest((details, reply) => {
    reply({ cancel: !isRendererAsset(details.url, rendererDirectory) });
  });
  isolatedSession.webRequest.onHeadersReceived((details, reply) => {
    reply({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [rendererPolicy],
      },
    });
  });

  const currentWindow = new BrowserWindow({
    title: "Random API",
    width: 1200,
    height: 860,
    minWidth: 760,
    minHeight: 600,
    backgroundColor: "#0b1020",
    icon: join(app.getAppPath(), "assets", "icon.png"),
    show: false,
    webPreferences: {
      ...secureWebPreferences,
      session: isolatedSession,
    },
  });
  window = currentWindow;
  const contents = currentWindow.webContents;
  contents.setWindowOpenHandler(() => ({ action: "deny" }));
  contents.on("will-navigate", (event) => event.preventDefault());
  contents.on("will-frame-navigate", (event) => event.preventDefault());
  contents.on("will-redirect", (event) => event.preventDefault());
  contents.on("will-attach-webview", (event) => event.preventDefault());
  contents.on("render-process-gone", () => {
    smokeStage = "renderer crash";
    fail();
  });
  contents.on(
    "did-fail-load",
    (_event, _code, _description, _url, isMainFrame) => {
      if (isMainFrame) fail();
    },
  );
  currentWindow.on("unresponsive", () => {
    smokeStage = "renderer responsiveness";
    fail();
  });
  currentWindow.on("closed", () => {
    window = null;
    if (smokeTest && !finishing) {
      smokeStage = "unexpected window close";
      finishSmoke(false);
    }
  });
  smokeStage = "local page loading";
  await currentWindow.loadFile(join(rendererDirectory, "index.html"));
  if (smokeTest) {
    await verifyRenderer(currentWindow);
  } else {
    currentWindow.show();
  }
}

if (smokeTest) {
  smokeTimeout = setTimeout(() => finishSmoke(false), 20_000);
}

app.on("window-all-closed", () => {
  if (!smokeTest && process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
  if (!smokeTest && !finishing && window === null) {
    void createWindow().catch(fail);
  }
});
app
  .whenReady()
  .then(async () => {
    nativeTheme.themeSource = "dark";
    createMenu();
    await createWindow();
  })
  .catch(fail);
