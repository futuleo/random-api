import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { serviceLink } from "./src/service-links";

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), "VITE_");
  serviceLink(environment.VITE_API_URL);
  serviceLink(environment.VITE_DOCS_URL);
  return {
    base: "./",
    plugins: [
      react(),
      {
        name: "production-content-security-policy",
        apply: "build",
        transformIndexHtml() {
          return [
            {
              tag: "meta",
              attrs: {
                "http-equiv": "Content-Security-Policy",
                content:
                  "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'",
              },
              injectTo: "head-prepend",
            },
          ];
        },
      },
    ],
  };
});
