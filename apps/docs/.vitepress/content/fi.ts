import { type GuidePages, snippets } from "./shared";

export const fi: GuidePages = {
  index: `---
layout: home
hero:
  name: Random API
  text: Aito rakenne. Synteettinen data.
  tagline: Käytännön ohjeet paikalliseen testidataan selaimessa, työpöydällä ja komentorivillä.
  actions:
    - theme: brand
      text: Aloita tästä
      link: /fi/getting-started
    - theme: alt
      text: Tutustu 30 skenaarioon
      link: /fi/scenarios
    - theme: alt
      text: Opi rgen
      link: /fi/cli
features:
  - title: Yksi moottori, neljä käyttötapaa
    details: Selain, Electron, rgen ja valinnainen paikallinen REST käyttävät samaa puhdasta core-pakettia.
    link: /fi/architecture
  - title: Toistettavat testiaineistot
    details: Luo 1–1000 objektia, määritä lukuvälit ja vaihtoehdot sekä vie JSON-, CSV-, XML- tai JSONL-tiedosto.
    link: /fi/generators
  - title: Paikallinen alusta asti
    details: Ei lähdedatan lähetyksiä, käyttäjätiliä, API-avaimia, analytiikkaa eikä LLM-integraatiota.
    link: /fi/architecture
---
`,
  "getting-started": `# Aloittaminen

Random API muodostaa JSON-rakenteesta synteettistä testidataa prototyyppeihin, taulukoihin ja toistettaviin testeihin. Se ei ole anonymisointityökalu eikä relaatiotietokannan täyttäjä.

## Valitse käyttötapa

| Käyttöliittymä | Käyttökohde | Tarvitaanko REST-palvelu? |
| --- | --- | --- |
| [Selain / Electron](/fi/web-desktop) | Kenttien visuaalinen tarkastelu ja säätö | Ei |
| [rgen CLI](/fi/cli) | Skriptit, testiaineistot ja CI | Ei |
| [Paikallinen REST](/fi/rest) | Generointi paikallisesta ohjelmasta pelkkien avainpolkujen avulla | Kyllä |
| [Core-paketti](/fi/architecture) | Integrointi tämän monorepon sisällä | Ei |

## Käynnistä lähdekoodista

Käytä Node.js-versiota **24** ja juuren \`package.json\`-tiedostoon lukittua pnpm-versiota (nyt 10.34.9). Suorita projektin juuressa:
${snippets.setup}
Avaa Viten ilmoittama paikallinen osoite. Selainkäyttö ei tarvitse komentoa \`pnpm dev:api\`.

## Ensimmäinen aineisto

1. Valitse käyttäjäskenaario tai liitä pieni JSON-objekti.
2. Tarkista lähde ja kentät vasemmalla. Aseta generaattorit, lukuvälit ja vaihtoehdot.
3. Valitse oikealta määrä. Jokainen generointi käyttää automaattisesti uutta siementä.
4. Tarkista tulos ja kopioi tai vie JSON-, CSV-, XML- tai JSONL-tiedosto.

Tallenna omaa kokeilua varten tämä nimellä \`source.json\`:
${snippets.fixture}
Lisää [generaattorioppaan](/fi/generators) \`fields.json\`, kun haluat täsmälliset asetukset.

## Komentorivikokeilu

[CLI-asennuksen](/fi/cli#asennus) jälkeen:
\`\`\`sh
rgen --scenario users --count 25 --seed demo --locale fi
rgen --input source.json
rgen --input source.json --generate --count 20 --fields fields.json --locale fi
\`\`\`

Komento on **rgen**, tuotenimi **Random API**. Skenaario käynnistää generoinnin; pelkkä \`--input\` tarkastelee avainpolkuja.

## Kielet

Tuetut kielet ovat englanti, suomi, ruotsi, venäjä ja espanja. CLI käyttää valintaa \`--locale en|fi|sv|ru|es\`, core-asetukset kenttää \`locale\`. Skenaariotunnukset, JSON-avaimet ja generaattorien nimet pysyvät samoina. Käännökset eivät tarkoita maakohtaista kelpoisuustarkistusta.

::: warning Ennen jakamista
Avainnimet ja rakenne säilyvät. Avaimissa olevia arkaluonteisia tietoja ei tunnisteta. Kentät luodaan itsenäisesti: loppupäivä voi olla ennen alkupäivää eikä summa välttämättä vastaa rivejä.
:::
`,
  "web-desktop": `# Selain ja työpöytä

Molemmat käyttävät samaa paikallista generointimoottoria. REST-palvelua ei tarvita eikä alkuperäisiä JSON-arvoja lähetetä verkkoon.

Valitse **Kieli**, kun haluat vaihtaa käyttöliittymän, ilmoitusten, skenaarioiden ja tuettujen arvojen kielen. Vaihtoehdot ovat englanti, suomi, ruotsi, venäjä ja espanja. Omat JSON-avaimet ja kenttäasetukset säilyvät. Aiempi tulos tyhjennetään kieltä vaihdettaessa.

## Selainkäyttö

Käynnistä \`pnpm dev\`. Liitä kelvollinen JSON tai valitse tiedosto. Valitse esiasetus tai muokkaa löydettyjen kenttien asetuksia.

**Vasen palsta:** lähde ja kenttäasetukset. **Oikea palsta:** määrä, generointitoiminnot, tulos ja vienti. Kapealla näytöllä järjestys on lähde → kentät → toiminnot → tulos → vienti.

Säädä määrä, lukujen kokonaislukurajat ja enum-vaihtoehdot. Siemen vaihtuu automaattisesti. Tarkista tulos ennen vientiä. Katso [generaattorien täsmälliset asetukset](/fi/generators).

## Rakenne ja määrä

Objekti tai ei-tyhjä objektitaulukko tukee määrää **1–1000**. Objektimalli toistaa rakenteen; taulukkomalli kierrättää lähdeobjekteja. Ilman määrää generointi säilyttää alkuperäisen JSON-rakenteen ja sisäkkäiset taulukot. Tyhjä taulukko, primitiivi tai sekataulukko ei kelpaa määräperusteiseksi malliksi.

Rajoina ovat **100 000 tulosarvoa** ja **syvyys 100**. Sisäkkäinen malli voi saavuttaa arvorajan ennen 1000 objektia.

## Electron

Työpöytäkuori lataa koostetun selainkäyttöliittymän paikallisesti:

\`\`\`sh
pnpm dev:desktop
pnpm package:desktop
pnpm --filter @random-api/desktop package:mac
pnpm --filter @random-api/desktop package:win
pnpm --filter @random-api/desktop package:linux
\`\`\`

::: warning Alustojen tila
macOS-kooste on allekirjoittamaton eikä sitä luvata notarisoiduksi. Älä ohita käyttöjärjestelmän suojausta tarkistamatta lähdettä. Windows- ja Linux-paketointiskriptit ovat olemassa, mutta niiden suoritusta kohdealustoilla ei ole varmennettu.
:::

## Ongelmatilanteet

- Virheellinen JSON: tarkista lainausmerkit ja pilkut. Virhe ei paljasta lähdesisältöä.
- Määrää ei voi käyttää: valitse objekti tai ei-tyhjä taulukko, jossa on vain objekteja.
- Odottamaton arvo: korvaa \`auto\` täsmällisellä generaattorilla.
- Liian suuri tulos: pienennä määrää tai sisäkkäisiä taulukoita.
- CSV:n rakenne: otsikot ovat JSON-polkuja, sisäkkäiset taulukot JSON-soluja.
`,
  cli: `# rgen-komentorivi

\`rgen\` toimii itsenäisesti ja paikallisesti. Se ei käynnistä REST-palvelua eikä ota siihen yhteyttä.

## Asennus

Käytä Node.js-versiota 24. Asenna paikallisesti tehty npm-tarball ja korvaa esimerkkitiedoston nimi oikealla:
${snippets.install}
Paketti sisältää ajonaikaisen core-riippuvuuden; asennettu CLI ei tarvitse monorepoa. Julkista npm-nimeä tai julkaisua **ei ole vahvistettu**. \`npm install -g <package-name>\` on vain paikkamerkki mahdollista tulevaa julkaisua varten.

Lähdekoodityötilassa voit käyttää komentoa \`pnpm cli --scenario users --count 10 --locale fi\`.

## Käyttöesimerkit

\`\`\`sh
rgen --list-scenarios --locale fi
rgen --scenario users --count 25 --seed demo --locale fi
rgen --scenario orders --count 100 --format csv --output orders.csv --locale fi
rgen --input source.json
rgen --input source.json --generate --count 20 --fields fields.json --locale fi
\`\`\`

## Valinnat

| Valinta | Tarkoitus |
| --- | --- |
| \`-i, --input <file>\` | Lue JSON; oletuksena vain avainpolkujen tarkastelu |
| \`--generate\` | Luo synteettiset arvot |
| \`--scenario <id>\` | Käytä esiasetusta, oletusmäärä 10 |
| \`--list-scenarios\` | Luettele tunnukset ja nimet JSON-muodossa; kielivalinta sallitaan |
| \`-n, --count <1-1000>\` | Objektien määrä |
| \`--seed <text>\` | Siemen, oletus \`random-api\` |
| \`--locale en\\|fi\\|sv\\|ru\\|es\` | Generoitujen arvojen ja esiasetusten kieli |
| \`--fields <file>\` | JSON-tiedosto kenttäasetuksille |
| \`--field <path=kind>\` | Toistettava lyhyt asetus ilman lisäparametreja |
| \`--format json\\|csv\\|xml\\|jsonl\` | Vientimuoto, oletus JSON |
| \`-o, --output <file>\` | Luo uusi tiedosto, ei ylikirjoitusta |
| \`-h, --help\`, \`--version\` | Ohje tai versionumero |

Älä yhdistä \`--input\`- ja \`--scenario\`-valintoja. Generoinnin asetukset vaativat \`--generate\`- tai \`--scenario\`-valinnan.

## Kenttäasetukset

Tallenna nimellä \`fields.json\`; lähteen avainten tulee vastata asetuksia:
${snippets.fields}
\`\`\`sh
rgen --input source.json --generate --count 50 --fields fields.json --seed qa --locale fi --output fixture.json
rgen --scenario users --field '["email"]=email'
\`\`\`

\`["profile","name"]\` tarkoittaa sisäkkäistä polkua, \`["profile.name"]\` yhtä pistettä sisältävää avainta. POSIX-kuoret ja PowerShell ymmärtävät yllä olevat lainaukset; Windows Command Promptissa käytä mieluummin \`--fields\`-tiedostoa. Enum ja lukurajat määritetään JSON-tiedostossa. Oma asetus korvaa skenaarion saman polun asetuksen.

## Automaatio

\`\`\`sh
rgen --scenario orders --count 100 --seed regression-v1 --locale fi > orders.json
\`\`\`

Tulos kirjoitetaan stdoutiin tai tiedostoon, virhe stderriin ja paluukoodi on virheessä nollasta poikkeava. Kuoren uudelleenohjaus voi ylikirjoittaa tiedoston; \`--output\` ei. Lukitse versio, kieli, siemen ja asetukset. Tutustu [kaikkiin 30 skenaarioon](/fi/scenarios).
`,
  generators: `# Generaattorit ja vienti

## Kenttäasetukset

Asetuksella on merkkijonosegmenteistä koostuva \`path\` ja \`generator\`. Avaimessa olevaa pistettä ei jaeta automaattisesti. Samat polut, tuntemattomat asetusavaimet ja yli 200 asetusta hylätään.
${snippets.fields}

| Generaattori | Toiminta |
| --- | --- |
| \`auto\` | Paikallisen lähteen rakenteeseen ja tyyppiin perustuva toiminta; ei REST-käyttöön |
| \`email\` | Synteettinen sähköpostiosoite |
| \`name\` | Nimi, jonka tuettuihin arvoihin kieli vaikuttaa |
| \`date\` | Päivämäärä ilman riippuvuutta muista päivistä |
| \`uuid\` | UUID-muotoinen tunniste |
| \`string\` | Synteettinen merkkijono |
| \`number\` | Kokonaisluku; oletusrajat 0 ja 999999 |
| \`boolean\` | Totuusarvo |
| \`enum\` | Valinta määritellystä \`values\`-listasta |

Lukujen \`min\` ja \`max\` ovat sisältyviä kokonaislukurajoja välillä **−1 000 000 000…1 000 000 000**, ja min ≤ max. Enumissa on **1–50 yksilöllistä, ei-tyhjää merkkijonoa**, kukin enintään **256 merkkiä**.

## Toistettavuus ja kieli

Pidä core-versio, siemen, kieli, malli ja järjestetyt asetukset samoina. Tuetut kielikoodit ovat \`en\`, \`fi\`, \`sv\`, \`ru\`, \`es\`. Kieli ei muuta JSON-avaimia eikä generaattoritunnuksia. Itse annettuja enum-vaihtoehtoja ei käännetä automaattisesti.

Kentät ovat riippumattomia: nimet ja sähköpostit eivät välttämättä vastaa toisiaan, summat eivät vastaa rivejä eivätkä päivät ole aikajärjestyksessä. Generointi ei takaa yksilöllisyyttä.

## Core työtilan sisällä

Esimerkki käyttää monorepon sisäistä pakettia, ei luvattua julkista npm-SDK:ta:
${snippets.core}

## Vientimuodot

**JSON** säilyttää sisäkkäiset objektit ja taulukot. Määräperusteinen generointi palauttaa taulukon; ilman määrää lähteen yleinen muoto säilyy.

**CSV** litistää objektit: otsikot ovat JSON-segmenttipolkuja, kuten \`["profile","name"]\`. Sisäkkäiset taulukot ovat JSON-soluja. Erotinmerkit, rivinvaihdot ja lainausmerkit käsitellään CSV-lainauksella.

**JSONL** kirjoittaa yhden JSON-arvon juuritaulukon alkiota kohti. Muu juurityyppi antaa yhden rivin; tyhjä taulukko tyhjän tiedoston.

**XML** säilyttää avaimet ja tyypit elementeillä \`data\`, \`item\` ja \`field name="…"\` sekä \`type\`-attribuutilla. XML 1.0:n virheelliset merkit hylätään. Esikatselun virhe ei poista lähdettä tai tulosta: vaihda muotoa.

Käsittele vientiä epäluotettavana tekstinä taulukkolaskennassa. Synteettiset arvot eivät poista avainten ja rakenteen mahdollisia riskejä.

## Rajat

Enintään 1000 objektia, 100 000 tulosarvoa, syvyys 100 ja 200 erikseen asetettua kenttää. Sisäkkäinen malli voi osua arvorajaan ennen objektirajaa.
`,
  rest: `# Valinnainen paikallinen REST API

Selain, Electron ja CLI eivät tarvitse palvelua. Käynnistä se vain paikallista ohjelmaintegraatiota varten:
${snippets.rest}
Oletusosoite on \`127.0.0.1:3000\`. Portin voi muuttaa \`PORT\`-ympäristömuuttujalla. Juurireitti näyttää API-viitteen.

## Reitit

| Pyyntö | Vastaus |
| --- | --- |
| \`GET /\` | Paikallinen HTML-ohje |
| \`GET /health\` | \`{"status":"ok"}\` |
| \`POST /generate\` | Synteettinen JSON, CSV, XML tai JSONL |

## Pyyntö

Anna ei-tyhjä \`seed\` (enintään 256 merkkiä), \`count\` 1–1000 ja 1–200 kenttäasetusta. \`format\`: \`json\`, \`csv\`, \`xml\` tai \`jsonl\`, oletus JSON. Valinnainen \`locale\` on oletuksena \`en\`. Täsmälliset lukurajat ja enum-vaihtoehdot sallitaan; \`auto\` ei.

Polussa on 1–99 merkkijonosegmenttiä, kukin enintään 256 merkkiä. Ristiriitaiset tai turvattomat polut voivat hylkääntyä coren tarkistuksessa. REST-skeema on tarkoituksella corea suppeampi: tarkista uudet ominaisuudet ajettavan palvelun viitteestä.

::: danger Älä lähetä lähdedokumenttia
Vain avainpolut ja itse määritellyt generointiasetukset sallitaan. Älä lähetä alkuperäistä JSONia, esimerkkiarvoja, pääteltyjä tyyppejä, pituuksia tai lähteestä kerättyjä enum-arvoja.
:::

## Rajat ja virheet

Kuuntelu on vain loopbackissa. Sallitut isäntänimet ovat \`127.0.0.1\`, \`localhost\` ja \`::1\`. Runkoraja on **64 KiB**, ja prosessi hyväksyy **120 pyyntöä minuutissa**, terveystarkistukset mukaan lukien. POST, jossa on selaimen \`Origin\`-otsake, hylätään.

Virheelliset pyynnöt palauttavat 400-luokan virheen ilman lähdesisältöä. Nopeusraja palauttaa **429** ja \`Retry-After\`-otsakkeen; odottamaton virhe antaa yleisen **500**-vastauksen. Lokitus on pois käytöstä ja vastaukset käyttävät \`no-store\`-asetusta.

Todennusta tai CORS-integraatiota ei ole. Älä julkaise palvelua tunnelilla, välityspalvelimella tai lähiverkkoon. Host- ja Origin-tarkistukset eivät ole todennusta.
`,
  architecture: `# Arkkitehtuuri ja tietosuoja

## Työtilan paketit

| Polku | Vastuu |
| --- | --- |
| \`packages/core\` | Puhdas analyysi ja generointi ilman verkkoa, tiedostoja, käyttöliittymää tai ympäristömuuttujia |
| \`apps/web\` | Selaimen paikallinen lähde- ja kenttäeditori |
| \`apps/desktop\` | Electron-kuori, joka käyttää samaa selainkäyttöliittymää |
| \`apps/cli\` | Node.js-komentorivisovitin; toimialalogiikka säilyy coressa |
| \`apps/api\` | Valinnainen, rajattu Fastify-loopback-palvelu |
| \`apps/docs\` | Staattinen VitePress-ohje ja koostamisen aikana luotu skenaarioluettelo |

Kaikki käyttöliittymät käyttävät samaa corea. Skenaariosivut luodaan \`SCENARIOS\`- ja \`getScenario\`-rajapinnoista sekä todellisesta siemennetyllä generaattorilla tuotetusta tuloksesta.

## Tietosuojasopimus

Alkuperäiset JSON-arvot pysyvät laitteessa. Niitä ei saa lähettää lokien, analytiikan, virheraporttien, palvelinrenderöinnin tai palveluntarjoajapyyntöjen mukana. Nykyinen generointi ei käytä LLM:ää, verkkopalvelua, käyttäjätiliä tai API-avainta.

Mahdollinen tuleva palveluntarjoajapyyntö on rakennettava erillisestä **vain avaimet sallivasta listasta**. Vain kenttänimet ja sisäkkäiset polut voidaan lähettää; päätellyt tyypit, esimerkkiarvot, pituudet ja enum-arvot vaativat erillisen tuotepäätöksen.

Avainnimien oletetaan olevan kenttänimiä. Niissä olevia arkaluonteisia tietoja ei tunnisteta. Rakennekin voi paljastaa tietoa. Synteettinen korvaava data ei takaa anonymisointia tai säädöstenmukaisuutta.

API-avaimia ei saa tallentaa repoon eikä selaimen localStorageen. Alustakohtaista avaintallennusta ei ole toteutettu. Mahdollisia LLM-vastauksia tulee käsitellä epäluotettavana konfiguraationa, ei suoritettavana koodina.

## Offline-käyttö ja dokumentaatio

Generointi on paikallista. Dokumentaatio on staattista HTML:ää ja sisältää paikallisen hakuhakemiston; se ei käytä ulkoista hakupalvelua tai verkkofonttia. Sivuston ylläpitäjä voi silti kerätä tavallisia verkkopalvelimen käyttölokeja.

\`\`\`sh
pnpm --filter @random-api/docs dev
pnpm --filter @random-api/docs build
pnpm --filter @random-api/docs preview
\`\`\`

Julkaise hakemisto \`apps/docs/.vitepress/dist\`. Riippuvuuksien asentamisen jälkeen sisällön koostaminen ei tarvitse verkkoa. Alipolulla käytä koostamisessa \`DOCS_BASE=/oma-polku/\` loppukauttaviivalla. Oletus on \`/\`, ja sivut käyttävät tavallisia \`.html\`-osoitteita.

## Tarkistaminen

Suorita juuresta \`pnpm format\` ja \`pnpm check\`. Electronin natiivisavutesti on erikseen \`pnpm test:desktop\`. Onnistunut kooste ei varmista Windowsin tai Linuxin ajonaikaista toimintaa.
`,
};
