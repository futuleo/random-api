export const locales = ["en", "fi", "sv", "ru", "es"] as const;
export type Locale = (typeof locales)[number];
export const prefix = (locale: Locale) => (locale === "en" ? "" : `/${locale}`);

export const navigation = {
  en: {
    language: "English",
    description: "Local synthetic data: web, desktop, CLI and REST.",
    guide: "Guide",
    start: "Getting started",
    web: "Web & desktop",
    cli: "rgen CLI",
    generators: "Generators & exports",
    reference: "Reference",
    scenarios: "30 scenarios",
    rest: "Local REST API",
    architecture: "Architecture & privacy",
    onPage: "On this page",
    previous: "Previous page",
    next: "Next page",
    menu: "Menu",
    top: "Return to top",
    appearance: "Appearance",
    light: "Switch to light theme",
    dark: "Switch to dark theme",
    languageMenu: "Change language",
    skip: "Skip to content",
    footer: "Local by design. Synthetic data is not anonymization.",
    search: "Search docs",
    details: "Display details",
    reset: "Reset search",
    back: "Back",
    noResults: "No results for",
    select: "select",
    navigate: "navigate",
    close: "close",
    fields: "Field settings",
    example: "Generated example",
    use: "Use with rgen",
    core: "Use inside the workspace",
    catalogIntro:
      "Choose a preset for a realistic screen shape, then tune the field settings. Every entry below links to its full settings, a generated example and a copyable CLI command.",
    catalogWarning:
      "Fields are generated independently. Presets do not guarantee relationships, unique business identifiers, coherent totals or chronological ordering.",
    catalogSource:
      "The catalog, settings and examples on this site are generated from the installed core package at build time. They are not a second hand-maintained schema.",
    category: "Category",
    scenario: "Scenario",
    purpose: "Use case",
    backCatalog: "All scenarios",
    deterministic:
      "The example below uses seed `docs-example`, count `2` and this page’s locale. A seed is reproducible with the same core version, template and settings; do not assume identical output across versions or languages.",
  },
  fi: {
    language: "Suomi",
    description:
      "Synteettistä testidataa paikallisesti: selain, työpöytä, CLI ja REST.",
    guide: "Opas",
    start: "Aloittaminen",
    web: "Selain ja työpöytä",
    cli: "rgen-komentorivi",
    generators: "Generaattorit ja vienti",
    reference: "Viite",
    scenarios: "30 skenaariota",
    rest: "Paikallinen REST API",
    architecture: "Arkkitehtuuri ja tietosuoja",
    onPage: "Tällä sivulla",
    previous: "Edellinen sivu",
    next: "Seuraava sivu",
    menu: "Valikko",
    top: "Takaisin alkuun",
    appearance: "Ulkoasu",
    light: "Vaihda vaaleaan teemaan",
    dark: "Vaihda tummaan teemaan",
    languageMenu: "Vaihda kieli",
    skip: "Siirry sisältöön",
    footer: "Paikallinen alusta asti. Synteettinen data ei ole anonymisointia.",
    search: "Hae ohjeista",
    details: "Näytä tiedot",
    reset: "Tyhjennä haku",
    back: "Takaisin",
    noResults: "Ei tuloksia haulle",
    select: "valitse",
    navigate: "siirry",
    close: "sulje",
    fields: "Kenttäasetukset",
    example: "Luotu esimerkki",
    use: "Käyttö rgen-komennolla",
    core: "Käyttö työtilassa",
    catalogIntro:
      "Valitse näkymääsi sopiva esiasetus ja säädä kenttiä. Jokaisesta skenaariosta löydät täydelliset asetukset, luodun esimerkin ja kopioitavan CLI-komennon.",
    catalogWarning:
      "Kentät luodaan toisistaan riippumatta. Esiasetukset eivät takaa viiteyhteyksiä, yksilöllisiä liiketoimintatunnuksia, johdonmukaisia summia tai aikajärjestystä.",
    catalogSource:
      "Luettelo, asetukset ja esimerkit muodostetaan core-paketista sivuston koostamisen aikana. Erillistä skeemakopiota ei ylläpidetä.",
    category: "Ryhmä",
    scenario: "Skenaario",
    purpose: "Käyttökohde",
    backCatalog: "Kaikki skenaariot",
    deterministic:
      "Alla käytetään siementä `docs-example`, määrää `2` ja tämän sivun kieltä. Sama core-versio, malli ja asetukset tuottavat toistettavan tuloksen. Tulos voi muuttua version tai kielen vaihtuessa.",
  },
  sv: {
    language: "Svenska",
    description: "Syntetiska testdata lokalt: webb, skrivbord, CLI och REST.",
    guide: "Guide",
    start: "Kom igång",
    web: "Webb och skrivbord",
    cli: "Kommandot rgen",
    generators: "Generatorer och export",
    reference: "Referens",
    scenarios: "30 scenarier",
    rest: "Lokalt REST API",
    architecture: "Arkitektur och integritet",
    onPage: "På den här sidan",
    previous: "Föregående sida",
    next: "Nästa sida",
    menu: "Meny",
    top: "Tillbaka till toppen",
    appearance: "Utseende",
    light: "Byt till ljust tema",
    dark: "Byt till mörkt tema",
    languageMenu: "Byt språk",
    skip: "Hoppa till innehåll",
    footer: "Lokalt från början. Syntetiska data är inte anonymisering.",
    search: "Sök i dokumentationen",
    details: "Visa detaljer",
    reset: "Rensa sökning",
    back: "Tillbaka",
    noResults: "Inga resultat för",
    select: "välj",
    navigate: "navigera",
    close: "stäng",
    fields: "Fältinställningar",
    example: "Genererat exempel",
    use: "Använd med rgen",
    core: "Använd i arbetsytan",
    catalogIntro:
      "Välj en förinställning för din vy och anpassa sedan fälten. Varje scenario länkar till kompletta inställningar, ett genererat exempel och ett kopierbart CLI-kommando.",
    catalogWarning:
      "Fälten genereras oberoende av varandra. Förinställningarna garanterar inte relationer, unika verksamhets-ID:n, korrekta summor eller kronologisk ordning.",
    catalogSource:
      "Katalog, inställningar och exempel skapas från core-paketet när webbplatsen byggs. Ingen separat schemakopia underhålls.",
    category: "Kategori",
    scenario: "Scenario",
    purpose: "Användning",
    backCatalog: "Alla scenarier",
    deterministic:
      "Exemplet använder fröet `docs-example`, antalet `2` och sidans språk. Samma core-version, mall och inställningar ger reproducerbara resultat. Resultat kan ändras mellan versioner och språk.",
  },
  ru: {
    language: "Русский",
    description:
      "Синтетические данные локально: браузер, приложение, CLI и REST.",
    guide: "Руководство",
    start: "Начало работы",
    web: "Браузер и приложение",
    cli: "Команда rgen",
    generators: "Генераторы и экспорт",
    reference: "Справочник",
    scenarios: "30 сценариев",
    rest: "Локальный REST API",
    architecture: "Архитектура и приватность",
    onPage: "На этой странице",
    previous: "Предыдущая страница",
    next: "Следующая страница",
    menu: "Меню",
    top: "Наверх",
    appearance: "Оформление",
    light: "Светлая тема",
    dark: "Тёмная тема",
    languageMenu: "Выбрать язык",
    skip: "К содержимому",
    footer:
      "Локальная обработка по умолчанию. Синтетические данные — не анонимизация.",
    search: "Поиск по документации",
    details: "Показать подробности",
    reset: "Очистить поиск",
    back: "Назад",
    noResults: "Ничего не найдено для",
    select: "выбрать",
    navigate: "перейти",
    close: "закрыть",
    fields: "Настройки полей",
    example: "Сгенерированный пример",
    use: "Использование в rgen",
    core: "Использование внутри репозитория",
    catalogIntro:
      "Выберите готовую структуру под свой экран, затем настройте поля. Для каждого сценария есть полный набор настроек, сгенерированный пример и команда CLI для копирования.",
    catalogWarning:
      "Поля генерируются независимо. Пресеты не гарантируют связи между сущностями, уникальность бизнес-идентификаторов, согласованные суммы или хронологию.",
    catalogSource:
      "Каталог, настройки и примеры извлекаются из установленного пакета core при сборке сайта. Отдельная копия схем не поддерживается вручную.",
    category: "Категория",
    scenario: "Сценарий",
    purpose: "Для чего",
    backCatalog: "Все сценарии",
    deterministic:
      "Пример ниже использует seed `docs-example`, количество `2` и язык этой страницы. Повторяемость гарантируется при одинаковых версии core, шаблоне и настройках. Между версиями и языками результат может различаться.",
  },
  es: {
    language: "Español",
    description: "Datos sintéticos locales: web, escritorio, CLI y REST.",
    guide: "Guía",
    start: "Primeros pasos",
    web: "Web y escritorio",
    cli: "Comando rgen",
    generators: "Generadores y exportación",
    reference: "Referencia",
    scenarios: "30 escenarios",
    rest: "API REST local",
    architecture: "Arquitectura y privacidad",
    onPage: "En esta página",
    previous: "Página anterior",
    next: "Página siguiente",
    menu: "Menú",
    top: "Volver arriba",
    appearance: "Apariencia",
    light: "Cambiar a tema claro",
    dark: "Cambiar a tema oscuro",
    languageMenu: "Cambiar idioma",
    skip: "Saltar al contenido",
    footer: "Local desde el diseño. Los datos sintéticos no son anonimización.",
    search: "Buscar documentación",
    details: "Mostrar detalles",
    reset: "Restablecer búsqueda",
    back: "Volver",
    noResults: "Sin resultados para",
    select: "seleccionar",
    navigate: "navegar",
    close: "cerrar",
    fields: "Configuración de campos",
    example: "Ejemplo generado",
    use: "Uso con rgen",
    core: "Uso dentro del repositorio",
    catalogIntro:
      "Elige un ajuste para la estructura de tu pantalla y personaliza los campos. Cada escenario incluye su configuración completa, un ejemplo generado y un comando CLI para copiar.",
    catalogWarning:
      "Los campos se generan de forma independiente. Los ajustes no garantizan relaciones, identificadores de negocio únicos, totales coherentes ni orden cronológico.",
    catalogSource:
      "El catálogo, la configuración y los ejemplos se obtienen del paquete core instalado durante la compilación. No se mantiene una segunda copia manual de los esquemas.",
    category: "Categoría",
    scenario: "Escenario",
    purpose: "Uso",
    backCatalog: "Todos los escenarios",
    deterministic:
      "El ejemplo usa la semilla `docs-example`, la cantidad `2` y el idioma de esta página. La misma versión de core, plantilla y configuración produce resultados reproducibles. No supongas resultados idénticos entre versiones o idiomas.",
  },
} as const;

export type GuidePages = Record<
  | "index"
  | "getting-started"
  | "web-desktop"
  | "cli"
  | "generators"
  | "rest"
  | "architecture",
  string
>;

export const code = (language: string, value: string) =>
  `\n\`\`\`${language}\n${value.trim()}\n\`\`\`\n`;

export const snippets = {
  setup: code("sh", "pnpm install --frozen-lockfile\npnpm dev"),
  install: code(
    "sh",
    "pnpm package:cli\nnpm install -g ./apps/cli/randomapi-studio-0.1.0.tgz\nrgen --help\nrgen --version",
  ),
  cli: code(
    "sh",
    `rgen --list-scenarios --locale en
rgen --scenario users --count 25 --locale en --seed demo
rgen --scenario orders --count 100 --format csv --output orders.csv
rgen --input source.json
rgen --input source.json --generate --count 20 --seed demo --locale en
rgen --input source.json --generate --fields fields.json --format csv --output synthetic.csv`,
  ),
  fields: code(
    "json",
    `[
  { "path": ["email"], "generator": "email" },
  { "path": ["age"], "generator": "number", "min": 18, "max": 80 },
  { "path": ["status"], "generator": "enum", "values": ["draft", "active", "archived"] },
  { "path": ["profile", "name"], "generator": "name" }
]`,
  ),
  fixture: code(
    "json",
    `{
  "email": "example@example.test",
  "age": 20,
  "status": "draft",
  "profile": { "name": "Example Person" }
}`,
  ),
  rest: code(
    "sh",
    `pnpm dev:api
# In another terminal:
curl http://127.0.0.1:3000/health
curl http://127.0.0.1:3000/generate \\
  -H 'Content-Type: application/json' \\
  --data '{"seed":"demo","count":2,"fields":[{"path":["email"],"generator":"email"}]}'`,
  ),
  core: code(
    "ts",
    `import {
  getScenario,
  generateSimilarObjects,
  generateRecords,
  serializeOutput,
} from "@random-api/core";

const scenario = getScenario("users", "fi");
if (!scenario) throw new Error("Unknown scenario");
const rows = generateSimilarObjects(scenario.template, {
  seed: "demo",
  count: 10,
  locale: "fi",
  fields: scenario.fields,
});
const csv = serializeOutput(rows, "csv");

const customRows = generateRecords({
  seed: "demo",
  count: 2,
  locale: "en",
  fields: [
    { path: ["score"], generator: "number", min: 0, max: 100 },
    { path: ["status"], generator: "enum", values: ["new", "done"] },
  ],
});`,
  ),
};
