import { code, type Locale } from "./shared";

const local = code(
  "sh",
  `mkdir -p -m 700 "$HOME/.config/random-api"
(umask 077; set -C; openssl rand -hex 32 > "$HOME/.config/random-api/api-key")
export API_KEY_FILE="$HOME/.config/random-api/api-key"
export RUNTIME_UID="$(id -u)"
export RUNTIME_GID="$(id -g)"
export PUBLIC_API_URL=http://localhost:8080/api/
docker compose -f deploy/compose.yml up -d --build --wait`,
);
const tls = code(
  "sh",
  `export PUBLIC_API_URL=https://your-domain.example/api/
export TLS_CERT_FILE=/absolute/path/to/fullchain.pem
export TLS_KEY_FILE=/absolute/path/to/privkey.pem
docker compose -f deploy/compose.yml -f deploy/compose.tls.yml up -d --build --wait`,
);
const generation = code(
  "sh",
  `curl http://localhost:8080/api/generate \\
  -H "Authorization: Bearer $(cat "$API_KEY_FILE")" \\
  -H 'Content-Type: application/json' \\
  --data '{"seed":"demo","count":2,"locale":"en","fields":[{"path":["email"],"generator":"email"}]}'`,
);
const operations = code(
  "sh",
  `pnpm test:deploy
docker compose -f deploy/compose.yml logs --tail 50
docker compose -f deploy/compose.yml down`,
);
const rotation = code(
  "sh",
  `docker compose -f deploy/compose.yml -f deploy/compose.tls.yml up -d --force-recreate --wait`,
);

export const deployment: Record<
  Locale,
  { title: string; summary: string; page: string }
> = {
  en: {
    title: "Hosting & HTTPS",
    summary:
      "Local mode remains unauthenticated and loopback-only. Explicit public mode requires a server-side key and a private, rate-limited HTTPS gateway. See [hosting and HTTPS](/deployment) for the supplied Docker/Nginx deployment.",
    page: `# Hosting and HTTPS

The deployment serves the studio at \`/\`, five-language documentation at \`/docs/\` and the REST reference at \`/api/\`. The studio links to the reference but still generates locally: source JSON is never uploaded and its production CSP keeps \`connect-src 'none'\`.

## Three private services

\`web\` is Nginx for static files and API forwarding. A separate \`api-nginx\` applies per-client limits before the Fastify \`api\`. Only web publishes a host port; the backend network is internal. Containers use unprivileged users, read-only filesystems, temporary storage, memory bounds and dropped capabilities. This is a small single-host deployment, not a multi-tenant API platform.

## Try it on loopback

Use Docker with Compose **2.24.4 or newer**, OpenSSL and a non-root deployment account. Run from the repository root. Keep the key outside the checkout. The command refuses to overwrite an existing key. UID/GID must match the owner of the mode-0600 secret file; Compose file secrets preserve host file ownership rather than fixing permissions.
${local}
Open \`http://localhost:8080/\`, \`/docs/\` or \`/api/\`. The default bind is \`127.0.0.1:8080\`. Do not change it to a public HTTP listener. Alternatively copy \`deploy/.env.example\` to \`deploy/.env\`, fill in paths and IDs, and pass \`--env-file deploy/.env\` explicitly. The template stores no key value.

## Public HTTPS

Point your domain to the host and obtain a valid certificate/full chain and private key with your certificate manager. Use protected files readable by the configured UID; do not make keys world-readable. Keep the exported API key file and runtime IDs from above, then:
${tls}
Replace the example domain and certificate paths. The override replaces the HTTP published port with **443** and enables TLS 1.2/1.3 and HSTS. Web listens internally on unprivileged ports. Backend ports remain unpublished. Do not pass a key as a Docker build argument or \`VITE_*\` setting. Certificate issuance, firewall rules and automatic renewal remain operator responsibilities; no domain or cloud account is provisioned.

## Call the API

Both \`POST /api/generate\` and \`POST /api/datasets/shop\` require the shared Bearer key. Reference and health are public. This loopback example uses only explicit settings; replace the URL with your HTTPS URL for remote calls.
${generation}
Never send source documents, inferred types, source lengths or original values. Explicit enum choices must also be synthetic. No browser-origin POSTs or CORS are enabled; use a trusted server or terminal client. The shared key is for trusted consumers, not individual user accounts.

## Limits and forwarding

The private gateway limits each client to **30 requests/minute**, burst **10**, and **4 concurrent connections**. A rejected request returns \`429\` and \`Retry-After: 2\`. The backend also caps authenticated generation at **120/minute per instance**; its \`Retry-After\` is 60. Request bodies are at most **64 KiB**, generated values at most 100000, and proxy/body timeouts are bounded.

Web overwrites incoming forwarding headers, so a caller cannot spoof an IP to evade limits. Do not publish the private gateway or join untrusted containers to its network. If another proxy sits in front of web, clients share that proxy's limit unless you deliberately configure narrowly trusted real-IP handling there. Never trust arbitrary caller headers. Logs contain only method, status and byte count; no URL/query, body or credentials.

## Operate and rotate
${operations}
For HTTPS operations include both Compose files. The smoke test uses a local Docker engine, isolated ports, temporary synthetic secrets and a trusted test certificate; it checks actual routing, authentication, limits, privacy and HTTPS, then removes its containers. To rotate credentials or certificates, update protected host files and recreate the stack so file mounts and startup-loaded settings refresh:
${rotation}
Keep renewal/recreation automated on your server. There is no source persistence to back up. Save deployment configuration and secret files securely, not in Git. The API image includes the MIT license; both static sites expose \`LICENSE.txt\`.
`,
  },
  fi: {
    title: "Julkaisu ja HTTPS",
    summary:
      "Paikallinen tila pysyy ilman tunnistautumista loopback-osoitteessa. Julkinen tila vaatii palvelimen avaimen ja yksityisen, rajoitetun HTTPS-yhdyskäytävän. Katso [julkaisu ja HTTPS](/fi/deployment).",
    page: `# Julkaisu ja HTTPS

Studio toimii polussa \`/\`, viisikieliset ohjeet polussa \`/docs/\` ja REST-viite polussa \`/api/\`. Linkki avaa viitteen, ei lähetä JSON-lähdettä palvelimelle. Selain luo datan paikallisesti; tuotannon CSP säilyttää \`connect-src 'none'\`.

## Kolme palvelua

\`web\`-Nginx jakaa staattiset tiedostot ja välittää API-pyynnöt. Erillinen \`api-nginx\` rajoittaa asiakkaita ennen Fastify-palvelua \`api\`. Vain web julkaisee portin, taustaverkko on sisäinen. Kontit käyttävät tavallisia käyttäjiä, vain luettavia tiedostojärjestelmiä, tilapäistä tallennusta ja muistirajoja ilman lisäoikeuksia. Ratkaisu on yhdelle palvelimelle, ei moniasiakasalusta.

## Kokeile paikallisesti

Tarvitset Dockerin, Compose-version **2.24.4 tai uudemman**, OpenSSL:n ja muun kuin root-käyttäjän. Suorita repositorion juuressa. Avain jää repositorion ulkopuolelle; olemassa olevaa avainta ei ylikirjoiteta. UID/GID:n on vastattava mode-0600-avaintiedoston omistajaa: Compose säilyttää tiedostosalausten isäntäoikeudet.
${local}
Avaa \`http://localhost:8080/\`, \`/docs/\` tai \`/api/\`. Oletus on \`127.0.0.1:8080\`; älä avaa HTTP-porttia julkisesti. Voit kopioida \`deploy/.env.example\` tiedostoksi \`deploy/.env\`, täydentää polut ja käyttäjätunnisteet ja antaa \`--env-file deploy/.env\`. Malli ei sisällä avainta.

## Julkinen HTTPS

Ohjaa verkkotunnus palvelimelle ja hanki varmenteen koko ketju sekä yksityinen avain varmennehallinnalla. Tiedostojen on oltava suojattuja ja määritetyn UID:n luettavissa; älä anna avaimille yleistä lukuoikeutta. Säilytä aiemmat avaintiedosto- ja UID/GID-asetukset:
${tls}
Korvaa verkkotunnus ja tiedostopolut. Lisätiedosto korvaa HTTP-portin portilla **443**, ottaa käyttöön TLS 1.2/1.3:n ja HSTS:n; taustaportteja ei julkaista. Älä anna avainta Docker-koostamisparametrina tai \`VITE_*\`-asetuksena. Varmenteet, palomuuri ja automaattinen uusinta ovat ylläpitäjän vastuulla.

## Käytä API:a

\`POST /api/generate\` ja \`POST /api/datasets/shop\` vaativat yhteisen Bearer-avaimen. Viite ja terveystarkistus ovat julkisia. Paikallinen esimerkki lähettää vain asetukset; etäkäytössä vaihda URL HTTPS-osoitteeksi.
${generation}
Älä lähetä alkuperäisiä dokumentteja, arvoja, pääteltyjä tyyppejä tai pituuksia. Myös omien enum-valintojen on oltava synteettisiä. Selaimen Origin-POST-pyynnöt estetään eikä CORS ole käytössä. Yhteinen avain on luotetuille palvelin- ja komentoriviasiakkaille, ei käyttäjätilejä varten.

## Rajat ja välitystiedot

Asiakaskohtainen raja on **30 pyyntöä/minuutti**, hetkellinen purske **10** ja **4 samanaikaista yhteyttä**. Hylkäys on \`429\`, \`Retry-After: 2\`. Palvelin sallii lisäksi yhteensä **120 tunnistettua generointipyyntöä/minuutti** (\`Retry-After: 60\`). Runko on enintään **64 KiB**, tulos 100000 arvoa; aikakatkaisut ovat rajattuja.

Web korvaa asiakkaan välitystunnisteet, joten IP-osoitteen väärentäminen ei kierrä rajoja. Älä julkaise API-yhdyskäytävää tai liitä epäluotettuja kontteja taustaverkkoon. Ulompi välityspalvelin jakaa saman rajan kaikille asiakkaille, ellei webissä määritetä tarkasti luotettuja oikean IP:n lähteitä. Älä luota mielivaltaisiin otsakkeisiin. Lokissa on vain metodi, tila ja tavumäärä, ei URL:ia, runkoa tai avaimia.

## Ylläpito ja vaihto
${operations}
Anna HTTPS:llä molemmat Compose-tiedostot. Testi käyttää paikallista Dockeria, erillisiä portteja ja tilapäisiä synteettisiä avaimia sekä luotettua testivarmennetta. Se poistaa testikontit lopuksi. Päivitä suojatut avain-/varmennetiedostot ja luo palvelut uudelleen, jotta tiedostoliitokset ja käynnistyksessä luetut asetukset päivittyvät:
${rotation}
Automatisoi uusinta palvelimella. Lähdedataa ei tallenneta. Säilytä salaisuudet turvallisesti, ei Gitissä. API-kuva sisältää MIT-lisenssin ja staattiset sivustot tiedoston \`LICENSE.txt\`.
`,
  },
  sv: {
    title: "Drift och HTTPS",
    summary:
      "Lokalt läge är fortfarande utan autentisering och bundet till loopback. Publikt läge kräver en servernyckel och en privat, hastighetsbegränsad HTTPS-gateway. Se [drift och HTTPS](/sv/deployment).",
    page: `# Drift och HTTPS

Studion finns på \`/\`, dokumentation på fem språk på \`/docs/\` och REST-referensen på \`/api/\`. Länken öppnar referensen; käll-JSON skickas aldrig till servern. Webbläsaren genererar lokalt med produktions-CSP \`connect-src 'none'\`.

## Tre tjänster

\`web\` är Nginx för statiska filer och API-vidarebefordran. Separata \`api-nginx\` begränsar klienter före Fastify-tjänsten \`api\`. Bara web publicerar en värdport; backendnätet är internt. Containrar har oprivilegierade användare, skrivskyddade filsystem, tillfällig lagring och minnesgränser utan extra capabilities. Detta är en enkel drift på en värd, inte en flerklientsplattform.

## Prova på loopback

Använd Docker med Compose **2.24.4 eller senare**, OpenSSL och ett konto som inte är root. Kör från repots rot. Nyckeln ligger utanför repot; kommandot skriver inte över en befintlig nyckel. UID/GID måste matcha ägaren till nyckelfilen med mode 0600; Compose bevarar värdfilens behörigheter.
${local}
Öppna \`http://localhost:8080/\`, \`/docs/\` eller \`/api/\`. Standardbindningen är \`127.0.0.1:8080\`; exponera inte HTTP offentligt. Alternativt kopiera \`deploy/.env.example\` till \`deploy/.env\`, fyll i sökvägar och ID:n och ange \`--env-file deploy/.env\`. Mallen innehåller ingen nyckel.

## Publik HTTPS

Peka domänen mot värden och skaffa full certifikatkedja och privat nyckel med din certifikathanterare. Filer ska vara skyddade men läsbara av valt UID; gör inte nycklar läsbara för alla. Behåll tidigare nyckelfil och UID/GID:
${tls}
Byt exempeldomän och sökvägar. Överlagringen ersätter HTTP-porten med **443**, TLS 1.2/1.3 och HSTS. Backendportar förblir opublicerade. Lägg aldrig nyckeln i Docker-byggargument eller \`VITE_*\`. Certifikat, brandvägg och automatisk förnyelse är driftansvariges uppgift.

## Anropa API:t

\`POST /api/generate\` och \`POST /api/datasets/shop\` kräver den gemensamma Bearer-nyckeln. Referens och hälsokontroll är publika. Exemplet använder loopback och endast uttryckliga inställningar; använd din HTTPS-adress för fjärranrop.
${generation}
Skicka aldrig källdokument, originalvärden, härledda typer eller längder. Även egna enum-val måste vara syntetiska. Webbläsarens Origin-POST blockeras och CORS är avstängt. Nyckeln gäller betrodda server-/terminalklienter, inte personliga konton.

## Gränser och proxyhuvuden

Gatewayen tillåter **30 anrop/minut per klient**, burst **10** och **4 samtidiga anslutningar**. Avslag ger \`429\`, \`Retry-After: 2\`. Backend har också **120 autentiserade genereringar/minut per instans**, med \`Retry-After: 60\`. Begäran är högst **64 KiB** och resultatet 100000 värden; tidsgränser är begränsade.

Web skriver över inkommande proxyhuvuden så klienten inte kan förfalska IP för att kringgå gränsen. Publicera inte den privata gatewayen eller anslut obetrodda containrar till nätet. Med en ytterligare proxy framför web delar klienter dess gräns om inte snävt betrodda real-IP-källor konfigureras där. Lita aldrig på godtyckliga klienthuvuden. Loggar innehåller bara metod, status och antal byte, inte URL/fråga, kropp eller nycklar.

## Drift och rotation
${operations}
Ta med båda Compose-filerna för HTTPS. Testet använder lokal Docker, isolerade portar, tillfälliga syntetiska nycklar och ett betrott testcertifikat och tar bort containrarna efteråt. Uppdatera skyddade nyckel-/certifikatfiler och återskapa hela stacken så monteringar och startlästa inställningar uppdateras:
${rotation}
Automatisera förnyelse på värden. Ingen källdata sparas. Förvara hemligheter säkert, inte i Git. API-avbildningen innehåller MIT-licensen och de statiska sajterna \`LICENSE.txt\`.
`,
  },
  ru: {
    title: "Публикация и HTTPS",
    summary:
      "Локальный режим остаётся без авторизации и доступен только на loopback. Публичный режим требует серверного ключа и закрытого шлюза с HTTPS и лимитами. См. [публикацию и HTTPS](/ru/deployment).",
    page: `# Публикация и HTTPS

Studio доступна на \`/\`, общая документация на пяти языках — на \`/docs/\`, справка REST — на \`/api/\`. Ссылка открывает справку, а не отправляет исходный JSON. Генерация в браузере остаётся локальной; production CSP сохраняет \`connect-src 'none'\`.

## Три сервиса

\`web\` — Nginx для статических файлов и проксирования API. Отдельный \`api-nginx\` ограничивает клиентов перед Fastify-сервисом \`api\`. Только web публикует порт хоста; сеть backend внутренняя. Контейнеры работают без root, с read-only файловой системой, временным хранилищем, ограниченной памятью и без дополнительных capabilities. Это простой вариант для одного сервера, не многопользовательская API-платформа.

## Запуск на loopback

Нужны Docker с Compose **2.24.4 или новее**, OpenSSL и непривилегированный пользователь. Команды выполняются из корня репозитория. Ключ хранится вне checkout; существующий файл не перезаписывается. UID/GID должны совпадать с владельцем файла ключа с правами 0600: файловые secrets в Compose сохраняют права хоста, а не исправляют их.
${local}
Откройте \`http://localhost:8080/\`, \`/docs/\` или \`/api/\`. По умолчанию опубликован только \`127.0.0.1:8080\`. Не открывайте этот HTTP-порт наружу. Альтернатива: скопируйте \`deploy/.env.example\` в \`deploy/.env\`, заполните пути и UID/GID и явно передавайте \`--env-file deploy/.env\`. Самого ключа в шаблоне нет.

## Публичный HTTPS

Направьте домен на сервер и получите действующий сертификат с полной цепочкой и закрытым ключом через свой менеджер сертификатов. Файлы должны быть защищены и доступны заданному UID; не делайте ключи общедоступными. Сохраните ранее экспортированные путь к API-ключу и UID/GID:
${tls}
Замените пример домена и пути. Override заменяет опубликованный HTTP-порт на **443**, включает TLS 1.2/1.3 и HSTS. Порты backend остаются закрытыми. Не передавайте ключ через Docker build args или \`VITE_*\`. Выпуск и продление сертификатов, firewall и настройки реального сервера остаются задачей оператора; домен и облачный аккаунт автоматически не создаются.

## Запросы к API

\`POST /api/generate\` и \`POST /api/datasets/shop\` требуют общего Bearer-ключа. Справка и health публичны. Пример для loopback передаёт только явные настройки; для удалённых запросов замените URL на HTTPS.
${generation}
Нельзя отправлять исходные документы, значения, выведенные типы или длины. Собственные enum-варианты тоже должны быть синтетическими. POST с браузерным Origin запрещён; CORS не включён. Ключ предназначен для доверенных серверных и консольных клиентов, а не для персональных аккаунтов.

## Лимиты и прокси-заголовки

Шлюз допускает **30 запросов/минуту на клиента**, burst **10**, **4 одновременных соединения**. При превышении — \`429\`, \`Retry-After: 2\`. Дополнительно backend ограничен **120 авторизованными генерациями/минуту на экземпляр**, с \`Retry-After: 60\`. Тело запроса — максимум **64 KiB**, результат — 100000 значений; таймауты тела и прокси ограничены.

Web заменяет входящие forwarding-заголовки, поэтому подмена IP клиентом не обходит лимит. Не публикуйте API-шлюз и не подключайте недоверенные контейнеры к его сети. Если перед web стоит ещё один прокси, все клиенты делят его лимит, пока вы явно не настроите в web узкий список доверенных источников real IP. Нельзя доверять произвольным заголовкам клиента. В логах только метод, статус и число байтов — без URL/query, тела или ключей.

## Обслуживание и ротация
${operations}
Для HTTPS передавайте оба Compose-файла. Smoke использует локальный Docker, отдельные порты, временные синтетические ключи и доверенный тестовый сертификат; проверяет реальную маршрутизацию, авторизацию, лимиты, приватность и HTTPS, затем удаляет свои контейнеры. Для ротации обновите защищённые файлы ключей/сертификатов и пересоздайте stack, чтобы обновились file mounts и настройки, прочитанные при старте:
${rotation}
Продление и пересоздание нужно автоматизировать на сервере. Исходные документы не сохраняются. Конфигурацию и секреты храните безопасно, не в Git. Образ API содержит MIT-лицензию, оба статических сайта — \`LICENSE.txt\`.
`,
  },
  es: {
    title: "Publicación y HTTPS",
    summary:
      "El modo local sigue sin autenticación y solo en loopback. El modo público exige una clave del servidor y una pasarela privada con HTTPS y límites. Consulta [publicación y HTTPS](/es/deployment).",
    page: `# Publicación y HTTPS

El estudio está en \`/\`, la documentación en cinco idiomas en \`/docs/\` y la referencia REST en \`/api/\`. El enlace abre la referencia; nunca sube el JSON original. El navegador genera localmente y la CSP de producción mantiene \`connect-src 'none'\`.

## Tres servicios

\`web\` es Nginx para archivos estáticos y reenvío a la API. Otro \`api-nginx\` limita clientes antes del servicio Fastify \`api\`. Solo web publica un puerto; la red backend es interna. Los contenedores usan usuarios sin privilegios, sistemas de archivos de solo lectura, almacenamiento temporal y límites de memoria, sin capabilities adicionales. Es un despliegue sencillo en un servidor, no una plataforma multiusuario.

## Probar en loopback

Usa Docker con Compose **2.24.4 o posterior**, OpenSSL y una cuenta que no sea root. Ejecuta desde la raíz del repositorio. La clave queda fuera del checkout; el comando no sobrescribe una existente. UID/GID deben coincidir con el propietario del archivo de clave con modo 0600: los secretos de archivo de Compose conservan los permisos del anfitrión.
${local}
Abre \`http://localhost:8080/\`, \`/docs/\` o \`/api/\`. La escucha predeterminada es \`127.0.0.1:8080\`; no publiques HTTP. También puedes copiar \`deploy/.env.example\` a \`deploy/.env\`, completar rutas e identificadores y pasar \`--env-file deploy/.env\`. La plantilla no contiene una clave.

## HTTPS público

Apunta el dominio al servidor y obtén la cadena completa de un certificado válido y su clave privada con tu gestor de certificados. Protege los archivos y permite su lectura al UID configurado; no hagas las claves legibles para todos. Conserva la ruta de clave API y UID/GID anteriores:
${tls}
Sustituye dominio y rutas. La sobreescritura reemplaza el puerto HTTP por **443**, activa TLS 1.2/1.3 y HSTS y mantiene privados los puertos backend. Nunca pases la clave como argumento de compilación Docker ni como \`VITE_*\`. Certificados, firewall y renovación automática son responsabilidad del operador.

## Llamar a la API

\`POST /api/generate\` y \`POST /api/datasets/shop\` requieren la clave Bearer compartida. Referencia y estado son públicos. El ejemplo local envía solo ajustes explícitos; usa tu dirección HTTPS para llamadas remotas.
${generation}
Nunca envíes documentos fuente, valores originales, tipos inferidos o longitudes. Las opciones enum propias también deben ser sintéticas. Se bloquean los POST con Origin del navegador y no se habilita CORS. La clave es para clientes de servidor/terminal de confianza, no cuentas individuales.

## Límites y cabeceras

La pasarela admite **30 solicitudes/minuto por cliente**, ráfaga **10** y **4 conexiones simultáneas**. El rechazo devuelve \`429\` y \`Retry-After: 2\`. Backend limita además a **120 generaciones autenticadas/minuto por instancia**, con \`Retry-After: 60\`. El cuerpo máximo es **64 KiB** y la salida 100000 valores; los tiempos de espera son limitados.

Web reemplaza las cabeceras de reenvío del cliente para impedir que una IP falsificada evite límites. No publiques la pasarela privada ni unas contenedores no confiables a su red. Si otra pasarela precede a web, todos comparten su límite salvo que configures allí fuentes real-IP específicamente confiables. Nunca confíes en cabeceras arbitrarias. Los registros solo contienen método, estado y bytes, no URL/consulta, cuerpos ni claves.

## Operación y rotación
${operations}
Para HTTPS incluye ambos archivos Compose. La prueba usa Docker local, puertos aislados, claves sintéticas temporales y un certificado de prueba confiable; verifica rutas, autenticación, límites, privacidad y HTTPS y elimina sus contenedores. Actualiza los archivos protegidos y recrea la pila para renovar montajes y ajustes leídos al arrancar:
${rotation}
Automatiza renovación y recreación en el servidor. No se guarda el origen. Protege configuración y secretos fuera de Git. La imagen API incluye la licencia MIT y ambos sitios estáticos \`LICENSE.txt\`.
`,
  },
};
