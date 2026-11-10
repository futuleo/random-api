import {
  generateDataset,
  generateSimilarObjects,
  getDataset,
  getScenario,
  SCENARIOS,
} from "@random-api/core";
import { shopGuide } from "./.vitepress/content/datasets";
import { en } from "./.vitepress/content/en";
import { es } from "./.vitepress/content/es";
import { fi } from "./.vitepress/content/fi";
import { ru } from "./.vitepress/content/ru";
import {
  code,
  type GuidePages,
  locales,
  navigation,
  prefix,
} from "./.vitepress/content/shared";
import { sv } from "./.vitepress/content/sv";

const guides: Record<(typeof locales)[number], GuidePages> = {
  en,
  fi,
  sv,
  ru,
  es,
};

export default {
  paths() {
    return locales.flatMap((locale) => {
      const base = prefix(locale);
      const nav = navigation[locale];
      const presets = SCENARIOS.map(({ id }) => getScenario(id, locale));
      const pages: Record<string, string> = { ...guides[locale] };
      const dataset = getDataset("shop", locale);
      const linked = shopGuide[locale];
      const linkedCommands = code(
        "sh",
        `rgen datasets --locale ${locale}
rgen dataset shop --count 30 --locale ${locale} --seed demo
rgen dataset shop --count 30 --locale ${locale} --format xml --output shop.xml`,
      );
      const linkedRest = code(
        "sh",
        `curl http://127.0.0.1:3000/datasets/shop \\
  -H 'Content-Type: application/json' \\
  --data '{"seed":"demo","count":30,"locale":"${locale}","format":"json"}'`,
      );
      pages["datasets/shop"] = `# ${dataset.name}

${linked.intro}

${linked.guarantees}

${linked.studio}

## ${nav.use}
${linkedCommands}

${linked.api}
${linkedRest}

::: warning
${linked.limits}
:::

## ${nav.example}
${code("json", JSON.stringify(generateDataset("shop", { seed: "docs-example", count: 2, locale }), null, 2))}
`;
      pages.cli += `\n\n## ${dataset.name}\n\n${linked.intro}\n\n${linked.guarantees}\n${linkedCommands}\n[${dataset.name}](${base}/datasets/shop)\n`;
      pages.rest += `\n\n## ${dataset.name}\n\n${linked.api}\n${linkedRest}\n[${dataset.name}](${base}/datasets/shop)\n`;
      pages["web-desktop"] +=
        `\n\n## ${dataset.name}\n\n${linked.studio}\n\n[${dataset.name}](${base}/datasets/shop)\n`;
      pages.scenarios = `# ${nav.scenarios}

${nav.catalogIntro}

::: warning
${nav.catalogWarning}
:::

${nav.catalogSource}

| ${nav.scenario} | ${nav.category} | ${nav.purpose} |
| --- | --- | --- |
${presets
  .map(
    (preset) =>
      `| [${preset.name}](${base}/scenarios/${preset.id}) | ${preset.category} | ${preset.description} |`,
  )
  .join("\n")}

## ${dataset.name}

${linked.intro}

[${dataset.name}](${base}/datasets/shop)
`;
      for (const preset of presets) {
        const output = generateSimilarObjects(preset.template, {
          seed: "docs-example",
          count: 2,
          locale,
          fields: preset.fields,
        });
        pages[`scenarios/${preset.id}`] = `# ${preset.name}

${preset.description}

**${nav.category}:** ${preset.category} · ID: \`${preset.id}\`

[${nav.backCatalog}](${base}/scenarios)

::: warning
${nav.catalogWarning}
:::

## ${nav.use}
${code(
  "sh",
  `rgen scenario ${preset.id} --count 25 --locale ${locale} --format json
rgen scenario ${preset.id} --count 25 --locale ${locale} --format xml --output ${preset.id}.xml`,
)}
## ${nav.fields}
${code("json", JSON.stringify(preset.fields, null, 2))}
## ${nav.example}

${nav.deterministic}
${code("json", JSON.stringify(output, null, 2))}
`;
      }
      return Object.entries(pages).map(([slug, content]) => ({
        params: { page: `${base}/${slug}`.replace(/^\//, "") },
        content,
      }));
    });
  },
};
