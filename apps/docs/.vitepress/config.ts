import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getDataset } from "@random-api/core";
import { defineConfig } from "vitepress";
import generatedPages from "../[page].paths";
import { locales, navigation, prefix } from "./content/shared";

const docsRoot = fileURLToPath(new URL("../", import.meta.url));
const searchPages = new Map(
  generatedPages
    .paths()
    .map(({ params, content }) => [
      resolve(docsRoot, `${params.page}.md`),
      content,
    ]),
);

export default defineConfig({
  title: "Random API",
  description:
    "Local synthetic data, documented. Web, desktop, rgen CLI and a keys-only REST API.",
  base: process.env.DOCS_BASE ?? "/",
  srcExclude: ["**/README.md"],
  lastUpdated: false,
  head: [
    ["meta", { name: "theme-color", content: "#11101a" }],
    [
      "link",
      {
        rel: "icon",
        type: "image/svg+xml",
        href: `${process.env.DOCS_BASE ?? "/"}favicon.svg`,
      },
    ],
  ],
  locales: Object.fromEntries(
    locales.map((locale) => {
      const nav = navigation[locale];
      const base = prefix(locale);
      return [
        locale === "en" ? "root" : locale,
        {
          label: nav.language,
          lang: locale,
          link: `${base}/`,
          description: nav.description,
          themeConfig: {
            nav: [
              { text: nav.guide, link: `${base}/getting-started` },
              { text: nav.cli, link: `${base}/cli` },
              { text: nav.scenarios, link: `${base}/scenarios` },
            ],
            sidebar: [
              {
                text: nav.guide,
                items: [
                  { text: nav.start, link: `${base}/getting-started` },
                  { text: nav.web, link: `${base}/web-desktop` },
                  { text: nav.cli, link: `${base}/cli` },
                  { text: nav.generators, link: `${base}/generators` },
                ],
              },
              {
                text: nav.reference,
                items: [
                  { text: nav.scenarios, link: `${base}/scenarios` },
                  {
                    text: getDataset("shop", locale).name,
                    link: `${base}/datasets/shop`,
                  },
                  { text: nav.rest, link: `${base}/rest` },
                  { text: nav.architecture, link: `${base}/architecture` },
                ],
              },
            ],
            outline: { label: nav.onPage, level: [2, 3] },
            docFooter: { prev: nav.previous, next: nav.next },
            sidebarMenuLabel: nav.menu,
            returnToTopLabel: nav.top,
            darkModeSwitchLabel: nav.appearance,
            lightModeSwitchTitle: nav.light,
            darkModeSwitchTitle: nav.dark,
            langMenuLabel: nav.languageMenu,
            skipToContentLabel: nav.skip,
            footer: { message: nav.footer },
          },
        },
      ];
    }),
  ),
  themeConfig: {
    logo: "/favicon.svg",
    siteTitle: "Random API",
    search: {
      provider: "local",
      options: {
        miniSearch: {
          // VitePress 1.x does not read virtual route content when indexing.
          _splitIntoSections(file) {
            const content = searchPages.get(resolve(file));
            if (content === undefined)
              throw new Error(
                "Missing generated documentation search content.",
              );
            return [
              {
                anchor: "",
                text: content,
                titles: [content.match(/^# (.+)$/m)?.[1] ?? "Random API"],
              },
            ];
          },
        },
        locales: Object.fromEntries(
          locales.map((locale) => {
            const nav = navigation[locale];
            return [
              locale === "en" ? "root" : locale,
              {
                translations: {
                  button: {
                    buttonText: nav.search,
                    buttonAriaLabel: nav.search,
                  },
                  modal: {
                    displayDetails: nav.details,
                    resetButtonTitle: nav.reset,
                    backButtonTitle: nav.back,
                    noResultsText: nav.noResults,
                    footer: {
                      selectText: nav.select,
                      selectKeyAriaLabel: nav.select,
                      navigateText: nav.navigate,
                      navigateUpKeyAriaLabel: nav.previous,
                      navigateDownKeyAriaLabel: nav.next,
                      closeText: nav.close,
                      closeKeyAriaLabel: nav.close,
                    },
                  },
                },
              },
            ];
          }),
        ),
      },
    },
  },
});
