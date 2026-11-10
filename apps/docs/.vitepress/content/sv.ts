import { type GuidePages, snippets } from "./shared";

export const sv: GuidePages = {
  index: `---
layout: home
hero:
  name: Random API
  text: Riktig struktur. Syntetiska data.
  tagline: Praktisk dokumentation för lokal generering i webbläsaren, på skrivbordet och i terminalen.
  actions:
    - theme: brand
      text: Kom igång
      link: /sv/getting-started
    - theme: alt
      text: Utforska 30 scenarier
      link: /sv/scenarios
    - theme: alt
      text: Lär dig rgen
      link: /sv/cli
features:
  - title: En motor, fyra gränssnitt
    details: Webbläsare, Electron, rgen och ett valfritt lokalt REST-gränssnitt delar samma rena core-paket.
    link: /sv/architecture
  - title: Reproducerbara testdata
    details: Skapa 1–1000 objekt, ange heltalsintervall och alternativ och exportera till flera format.
    link: /sv/generators
  - title: Lokalt från början
    details: Ingen uppladdning av källdata, inget konto, inga API-nycklar, ingen analysinsamling eller LLM-integration.
    link: /sv/architecture
---
`,
  "getting-started": `# Kom igång

Random API skapar syntetiska testdata från en JSON-struktur. Använd det för prototyper, tabellpaginering, demonstrationer och repeterbara testfall. Det är inte ett anonymiseringsverktyg eller en relationsdatabasseeder.

## Välj gränssnitt

| Gränssnitt | Passar för | Kräver REST-tjänsten? |
| --- | --- | --- |
| [Webb / Electron](/sv/web-desktop) | Visuell granskning och fältinställningar | Nej |
| [rgen CLI](/sv/cli) | Skript, testfiler och CI | Nej |
| [Lokalt REST](/sv/rest) | Generering från lokala program med enbart nyckelsökvägar | Ja |
| [Core-paket](/sv/architecture) | Integration i detta monorepo | Nej |

## Kör från källkod

Använd **Node.js 24** och pnpm-versionen i rotens \`package.json\` (nu 10.34.9). Kör från repots rot:
${snippets.setup}
Öppna adressen som Vite skriver ut. Webbappen behöver inte \`pnpm dev:api\`.

## Första datamängden

1. Välj användarscenariot eller klistra in ett litet JSON-objekt.
2. Granska källa och fält i vänster kolumn. Välj generatorer, intervall och alternativ.
3. Ange antal i höger kolumn och generera. Ett nytt frö väljs automatiskt.
4. Granska resultatet och kopiera eller exportera det.

Spara följande som \`source.json\`:
${snippets.fixture}
Använd \`fields.json\` från [generatorguiden](/sv/generators) för explicita inställningar.

## Terminalen

Efter [installation](/sv/cli#installation):

\`\`\`sh
rgen --scenario users --count 25 --seed demo --locale sv
rgen --input source.json
rgen --input source.json --generate --count 20 --fields fields.json --locale sv
\`\`\`

Kommandot heter **rgen**, produkten **Random API**. Ett scenario aktiverar generering. Enbart \`--input\` granskar nyckelsökvägar.

## Språk

Engelska, finska, svenska, ryska och spanska stöds. CLI använder \`--locale en|fi|sv|ru|es\`, core-inställningar använder \`locale\`. Scenario-ID:n, JSON-nycklar och generatornamn är stabila. Översatta etiketter innebär inte landspecifik validering.

::: warning Innan du delar
Nycklar och struktur bevaras. Känsligt innehåll i nyckelnamn identifieras inte. Fält genereras oberoende: ett slutdatum kan ligga före startdatumet och en totalsumma behöver inte stämma med raderna.
:::
`,
  "web-desktop": `# Webb och skrivbord

Båda använder samma lokala genereringsmotor. Ingen REST-tjänst behövs och ursprungliga JSON-värden laddas inte upp.

Välj **Språk** för att byta språk för gränssnittet, meddelanden, scenarier och stödda genererade värden. Engelska, finska, svenska, ryska och spanska finns. Egna JSON-nycklar och fältinställningar bevaras. Det tidigare resultatet rensas när språket ändras.

## Webbläsarflöde

Starta \`pnpm dev\`, klistra in giltig JSON eller välj en fil. Välj en förinställning eller konfigurera de hittade fälten.

**Vänster kolumn** innehåller källa och fältinställningar. **Höger kolumn** innehåller antal, genereringsknappar, resultat och export. På smala skärmar staplas de i ordningen källa → fält → reglage → resultat → export.

Fröet väljs automatiskt. Ange inkluderande heltalsgränser för tal och explicita alternativ för enum. Granska resultatet före export. Se [generatorreferensen](/sv/generators).

## Form och antal

Ett objekt eller en icke-tom array av objekt stöder **1–1000** objekt. Objektmallar upprepas; arraymallar växlar mellan källobjekten. Utan angivet antal bevaras källans JSON-form, inklusive nästlade arrayer. Primitiva värden, tomma arrayer och blandade arrayer är inte giltiga mallar för objektantal.

Gränserna är **100 000 resultatvärden** och **djup 100**. En stor nästlad mall kan nå värdegränsen innan 1000 objekt.

## Electron

Skrivbordsskalet laddar den byggda webbappen lokalt:

\`\`\`sh
pnpm dev:desktop
pnpm package:desktop
pnpm --filter @random-api/desktop package:mac
pnpm --filter @random-api/desktop package:win
pnpm --filter @random-api/desktop package:linux
\`\`\`

::: warning Plattformarnas status
macOS-bygget är osignerat och utlovas inte vara notariserat. Kringgå inte operativsystemets skydd utan att granska och lita på källan. Paketeringsskript finns för Windows och Linux, men körning på dessa plattformar har inte verifierats.
:::

## Felsökning

- Ogiltig JSON: kontrollera citattecken och kommatecken. Felmeddelanden utelämnar källinnehåll.
- Antal kan inte väljas: använd ett objekt eller en icke-tom array med enbart objekt.
- Oväntade värden: ersätt \`auto\` med en explicit generator.
- För stort resultat: minska antal eller nästlade arrayer.
- CSV ser platt ut: rubriker är JSON-sökvägar och nästlade arrayer lagras som JSON-celler.
`,
  cli: `# Kommandot rgen

\`rgen\` är ett fristående lokalt CLI och behöver ingen REST-server.

## Installation

Använd Node.js 24. Installera en lokalt byggd npm-tarball; ersätt exempelnamnet med den faktiska filen:
${snippets.install}
Paketet inkluderar core-beroendet för körning och behöver inte monorepot efter installation. Ett publikt npm-namn eller en publicering har **inte bekräftats**. \`npm install -g <package-name>\` är endast en platshållare för en eventuell framtida publicering.

I källkodens arbetsyta kan samma argument köras via \`pnpm cli --scenario users --count 10 --locale sv\`.

## Vanliga kommandon

\`\`\`sh
rgen --list-scenarios --locale sv
rgen --scenario users --count 25 --seed demo --locale sv
rgen --scenario orders --count 100 --format csv --output orders.csv --locale sv
rgen --scenario users --count 10 --format xml --output users.xml
rgen --scenario users --count 10 --format jsonl --output users.jsonl
rgen --input source.json
rgen --input source.json --generate --fields fields.json --locale sv
\`\`\`

## Alternativ

| Alternativ | Betydelse |
| --- | --- |
| \`-i, --input <file>\` | Läs JSON; endast granskning om generering inte begärs |
| \`--generate\` | Generera syntetiska värden |
| \`--scenario <id>\` | Förinställning; standardantal 10 |
| \`--list-scenarios\` | Lista ID:n och namn som JSON; kan kombineras med språk |
| \`-n, --count <1-1000>\` | Antal objekt |
| \`--seed <text>\` | Frö, standard \`random-api\` |
| \`--locale en\\|fi\\|sv\\|ru\\|es\` | Språk för genererade värden och förinställningar |
| \`--fields <file>\` | JSON-fil med fältinställningar |
| \`--field <path=kind>\` | Upprepningsbar genväg utan extra parametrar |
| \`--format json\\|csv\\|xml\\|jsonl\` | Exportformat, standard JSON |
| \`-o, --output <file>\` | Skapa en ny fil, skriv aldrig över |
| \`-h, --help\`, \`--version\` | Hjälp eller versionsnummer |

Kombinera inte \`--input\` och \`--scenario\`. Genereringsinställningar kräver \`--generate\` eller \`--scenario\`.

## Fältinställningar

Spara som \`fields.json\` och använd en källa med motsvarande nycklar:
${snippets.fields}
\`\`\`sh
rgen --input source.json --generate --count 50 --fields fields.json --seed qa --locale sv --output fixture.json
rgen --scenario users --field '["email"]=email'
\`\`\`

\`["profile","name"]\` är en nästlad sökväg; \`["profile.name"]\` är en enda nyckel med punkt. Citaten fungerar i POSIX-skal och PowerShell. Använd helst \`--fields\` i Windows Command Prompt. Enum och talintervall anges i JSON-filen. En egen inställning ersätter scenariots inställning på samma sökväg.

## Skript och CI

\`\`\`sh
rgen --scenario orders --count 100 --seed regression-v1 --locale sv > orders.json
\`\`\`

Resultat skrivs till stdout eller vald fil; fel till stderr med en exitkod som inte är noll. Skalets omdirigering kan skriva över filer, till skillnad från \`--output\`. Lås version, frö, språk och inställningar. Hitta fler kommandon i [alla 30 scenarier](/sv/scenarios).
`,
  generators: `# Generatorer och export

## Fältinställningar

Varje inställning innehåller en \`path\` med strängsegment och en \`generator\`. Punkter i nycklar delas inte automatiskt. Dubbla sökvägar, okända egenskaper och fler än 200 inställningar avvisas.
${snippets.fields}

| Generator | Beteende |
| --- | --- |
| \`auto\` | Lokalt beteende utifrån källans form och typ; inte för REST |
| \`email\` | Syntetisk e-postadress |
| \`name\` | Syntetiskt personnamn; språk påverkar stödda värden |
| \`date\` | Datum oberoende av andra datumfält |
| \`uuid\` | UUID-formad identifierare |
| \`string\` | Syntetisk sträng |
| \`number\` | Heltal med inkluderande gränser; standard 0–999999 |
| \`boolean\` | Sant eller falskt |
| \`enum\` | Välj från explicita \`values\` |

\`min\` och \`max\` måste vara ordnade heltal inom **−1 000 000 000 till 1 000 000 000**. Enum kräver **1–50 unika, icke-tomma strängar**, högst **256 tecken** var. Extra inställningar hör bara till respektive generator.

## Reproducerbarhet och språk

Behåll samma core-version, frö, språk, mall och ordnade inställningar. Språk: \`en\`, \`fi\`, \`sv\`, \`ru\`, \`es\`. Språket ändrar inte JSON-nycklar eller generator-ID:n. Egna enum-alternativ översätts inte automatiskt.

Fält genereras oberoende. Namn behöver inte stämma med e-post, totalsummor med rader eller datum med kronologin. Unikhet garanteras inte.

## Core i arbetsytan

Exemplet använder monorepots interna paket, inte ett utlovat publikt npm-SDK:
${snippets.core}

## Exportformat

**JSON** bevarar objekt och arrayer. Generering med antal ger en array; utan antal bevaras källans övergripande form.

**CSV** plattar ut objekt med JSON-segmentsökvägar som rubriker, till exempel \`["profile","name"]\`. Nästlade arrayer är JSON-celler. Avgränsare, radbrytningar och citattecken citeras enligt CSV.

**JSONL** skriver ett JSON-värde per element i rotarrayen. En annan rottyp ger en rad; en tom array ger en tom fil.

**XML** bevarar godtyckliga JSON-nycklar och typer med \`data\`, \`item\` och \`field name="…"\`. Typerna anges med \`type\`: object, array, string, number, boolean, null. Reserverade tecken kodas, ingen DTD används och ogiltiga XML 1.0-tecken avvisas i stället för att ändras.

\`\`\`xml
<data type="array"><item type="object"><field name="id" type="string">demo</field></item></data>
\`\`\`

Behandla exporter som opålitlig text i kalkylprogram. Syntetiska värden tar inte bort risker i ursprungliga nyckelnamn.

## Gränser

1–1000 objekt, högst 100 000 resultatvärden, djup 100 och 200 explicita fältinställningar. Minska antal eller mallens komplexitet om gränserna nås.
`,
  rest: `# Valfritt lokalt REST API

Webb, Electron och CLI fungerar utan tjänsten. Starta den enbart för lokala programintegrationer:
${snippets.rest}
Standardadressen är \`127.0.0.1:3000\`. Ändra port med \`PORT\`. Roten visar en kort API-referens.

## Slutpunkter

| Metod / sökväg | Resultat |
| --- | --- |
| \`GET /\` | Lokal HTML-referens |
| \`GET /health\` | \`{"status":"ok"}\` |
| \`POST /generate\` | Syntetiska data i valt format |

## Förfrågan

Ange ett icke-tomt \`seed\` (högst 256 tecken), \`count\` 1–1000 och 1–200 fältinställningar. \`format\` kan vara \`json\`, \`csv\`, \`xml\` eller \`jsonl\`; standard är JSON. Använd konkreta generatorer, inte \`auto\`.

Sökvägar innehåller 1–99 strängsegment, högst 256 tecken var. Motstridiga och osäkra sökvägar kan avvisas av core. REST-schemat är avsiktligt smalare än core-API:t; kontrollera nya egenskaper i den körande tjänstens referens.

::: danger Skicka aldrig källdokumentet
Skicka bara nyckelsökvägar och explicita genereringsinställningar. Ingen original-JSON, exempelvärden, härledda typer, längder eller enum-alternativ extraherade från källan.
:::

## Lokal säkerhetsgräns

Lyssnaren är begränsad till loopback och värdnamnen \`127.0.0.1\`, \`localhost\`, \`::1\`. Kroppsgränsen är **64 KiB** och processbudgeten **120 förfrågningar per minut**, även hälsokontroller. POST med webbläsarens \`Origin\`-huvud avvisas.

Ogiltiga förfrågningar ger 400-fel utan källinnehåll; hastighetsgränsen ger **429** med \`Retry-After\`. Oväntade fel ger ett generiskt **500**. Loggning är avstängd och svar använder \`no-store\`.

Ingen autentisering eller CORS-integration finns. Exponera inte tjänsten via tunnel, reverse proxy eller delat nätverk. Host- och Origin-kontroller är inte autentisering.
`,
  architecture: `# Arkitektur och integritet

## Paket i arbetsytan

| Sökväg | Ansvar |
| --- | --- |
| \`packages/core\` | Ren analys och generering utan nätverk, filer, UI eller miljövariabler |
| \`apps/web\` | Lokal redigering av källa och fält i webbläsaren |
| \`apps/desktop\` | Electron-skal som återanvänder webbappen |
| \`apps/cli\` | Node.js-adapter, domänlogik i core |
| \`apps/api\` | Valfri begränsad Fastify-adapter på loopback |
| \`apps/docs\` | Statisk VitePress-dokumentation och bygggenererad scenariokatalog |

Alla gränssnitt använder samma core. Scenariosidorna byggs från \`SCENARIOS\`, \`getScenario\` och faktiska fröbaserade genereringsresultat.

## Integritetskontrakt

Ursprungliga JSON-värden stannar på enheten. De får inte skickas genom loggar, analysinsamling, kraschrapporter, serverrendering eller leverantörsförfrågningar. Nuvarande generering använder ingen LLM eller nätleverantör och kräver inget konto eller API-nyckel.

En eventuell framtida leverantör måste använda en explicit **tillåtelselista med enbart nycklar**. Endast fältnamn och nästlade sökvägar får lämna enheten; härledda typer, exempelvärden, längder och enum-värden kräver ett separat produktbeslut.

Nycklar antas vara fältnamn. Känsliga uppgifter i nyckelnamn upptäcks avsiktligt inte. Även strukturen kan röja information. Syntetiska ersättningsvärden garanterar inte anonymisering eller regelefterlevnad.

API-nycklar får aldrig lagras i repot eller webbläsarens localStorage. Plattformsspecifik nyckellagring saknas. Eventuella LLM-svar är opålitlig konfiguration, aldrig körbar kod.

## Offline och dokumentation

Genereringen är lokal. Dokumentationen består av statisk HTML med ett lokalt sökindex, utan extern söktjänst eller fjärrtypsnitt. Webbhotellet kan fortfarande ha vanliga åtkomstloggar.

\`\`\`sh
pnpm --filter @random-api/docs dev
pnpm --filter @random-api/docs build
pnpm --filter @random-api/docs preview
\`\`\`

Publicera \`apps/docs/.vitepress/dist\`. Efter installation av beroenden behöver innehållsbygget ingen nätanslutning. För en undersökväg anger du \`DOCS_BASE=/din-sokvag/\` vid bygget, med avslutande snedstreck. Standard är \`/\`; vanliga \`.html\`-adresser används.

## Verifiering

Kör \`pnpm format\` och \`pnpm check\` i roten. Electron har separat nativt röktest: \`pnpm test:desktop\`. Ett lyckat bygge verifierar inte Windows- eller Linux-körning.
`,
};
