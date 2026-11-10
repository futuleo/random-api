import type { Locale } from "./shared";

export const shopGuide: Record<
  Locale,
  {
    intro: string;
    guarantees: string;
    limits: string;
    studio: string;
    api: string;
  }
> = {
  en: {
    intro:
      "The linked shop is a separate fixed recipe, not an ordinary independent-field scenario. It returns one object with `users`, `products` and `orders` collections.",
    guarantees:
      "`count` means 1–1000 orders (CLI default: 10). Users are one per three orders and products one per two, rounded up. Every reference resolves. IDs and emails are unique within the result. Item prices match products, item totals match quantities, and order totals equal their items. All amounts are integer EUR cents. Entity creation precedes orders; payment, shipment, delivery and cancellation timestamps agree with status. At least five orders cover all five statuses. Pending and paid orders reserve stock; `on_hand` equals `reserved` plus `available`.",
    limits:
      "This is a final synthetic snapshot, not an inventory event ledger, SQL importer or complete commerce simulator. No taxes, shipping fees or discounts are modeled. IDs are deterministic fixture strings, not UUIDs or secrets, and can repeat between separate datasets. Only names and product titles are localized. Generic generation from an imported JSON document does not preserve these relationships.",
    studio:
      "Choose **Linked shop** in the existing preset picker. The count becomes **Orders**; users and products are automatic. The source is a read-only recipe preview, and independent field overrides are hidden to preserve the guarantees. Choose another preset or import JSON to return to custom generation.",
    api: "The loopback-only REST route accepts only `seed`, `count`, optional `locale` and `format`. Source documents and field overrides are rejected. JSON and XML retain the full object; JSONL contains one object line; CSV contains one row with the three arrays as JSON cells, not three separate tables.",
  },
  fi: {
    intro:
      "Yhdistetty verkkokauppa on erillinen kiinteä malli, ei tavallinen riippumattomien kenttien skenaario. Tulos on yksi objekti, jossa ovat kokoelmat `users`, `products` ja `orders`.",
    guarantees:
      "`count` tarkoittaa 1–1000 tilausta (CLI-oletus: 10). Käyttäjiä luodaan yksi kolmea ja tuotteita yksi kahta tilausta kohti ylöspäin pyöristäen. Kaikki viitteet ovat olemassa. Tunnukset ja sähköpostit ovat tuloksen sisällä yksilöllisiä. Rivihinnat vastaavat tuotteita ja määrät rivisummia; tilauksen summa vastaa rivejä. Rahat ovat kokonaislukuisia eurosenttejä. Luonti edeltää tilausta, ja maksu-, lähetys-, toimitus- ja peruutusajat vastaavat tilaa. Viisi tilausta kattaa kaikki viisi tilaa. Odottavat ja maksetut tilaukset varaavat saldoa; `on_hand` on `reserved` ja `available` yhteensä.",
    limits:
      "Tämä on synteettinen lopputilanne, ei varastotapahtumien kirjanpito, SQL-tuonti tai täydellinen kauppasimulaattori. Verot, toimituskulut ja alennukset puuttuvat. Tunnukset ovat toistettavia testimerkkijonoja, eivät UUID-tunnuksia tai salaisuuksia, ja voivat toistua eri tietojoukoissa. Vain nimet ja tuotenimet käännetään. Tuodun JSONin yleinen generointi ei säilytä näitä yhteyksiä.",
    studio:
      "Valitse **Yhdistetty verkkokauppa** esiasetuksista. Määrä tarkoittaa tilauksia; käyttäjät ja tuotteet luodaan automaattisesti. Mallin esikatselu on vain luettavissa eikä kenttiä voi muuttaa. Palaa omaan generointiin valitsemalla toinen esiasetus tai tuomalla JSON.",
    api: "Paikallinen REST-reitti hyväksyy vain `seed`, `count` sekä valinnaiset `locale` ja `format`. Lähdedokumentit ja kenttäasetukset hylätään. JSON ja XML säilyttävät objektin; JSONL sisältää yhden objektirivin; CSV sisältää yhden rivin, jonka kolme kokoelmaa ovat JSON-soluja, ei erillisiä taulukoita.",
  },
  sv: {
    intro:
      "Den sammanhängande butiken är en separat fast modell, inte ett vanligt scenario med oberoende fält. Resultatet är ett objekt med samlingarna `users`, `products` och `orders`.",
    guarantees:
      "`count` betyder 1–1000 beställningar (CLI-standard: 10). En användare skapas per tre beställningar och en produkt per två, avrundat uppåt. Alla referenser finns. ID:n och e-postadresser är unika inom resultatet. Radpriser motsvarar produkter, radsummor motsvarar antal och ordersummor motsvarar raderna. Alla belopp är heltal i eurocent. Skapandet föregår beställningar; betalning, sändning, leverans och annullering följer statusen. Fem beställningar täcker alla fem statusar. Väntande och betalda beställningar reserverar lager; `on_hand` är summan av `reserved` och `available`.",
    limits:
      "Detta är en syntetisk slutbild, inte en lagerhändelselogg, SQL-import eller fullständig handelssimulator. Skatt, frakt och rabatter ingår inte. ID:n är reproducerbara teststrängar, inte UUID:n eller hemligheter, och kan upprepas mellan datamängder. Bara namn och produkttitlar översätts. Generisk generering från importerad JSON bevarar inte dessa samband.",
    studio:
      "Välj **Sammanhängande butik** i den befintliga listan. Antalet betyder beställningar; användare och produkter skapas automatiskt. Källan är en skrivskyddad förhandsvisning och fältändringar döljs för att bevara garantierna. Välj en annan förinställning eller importera JSON för egna fält.",
    api: "Den lokala REST-rutten accepterar bara `seed`, `count` och valfria `locale` och `format`. Källdokument och fältändringar avvisas. JSON och XML behåller hela objektet; JSONL innehåller en objektrad; CSV innehåller en rad med tre arrayer som JSON-celler, inte tre separata tabeller.",
  },
  ru: {
    intro:
      "Связанный магазин — отдельная фиксированная модель, а не обычный сценарий с независимыми полями. Результат — один объект с коллекциями `users`, `products` и `orders`.",
    guarantees:
      "`count` означает 1–1000 заказов (по умолчанию в CLI: 10). На каждые три заказа создаётся пользователь, на каждые два — товар, с округлением вверх. Все ссылки ведут на существующие записи. ID и email уникальны внутри результата. Цены позиций совпадают с товарами, суммы позиций учитывают количество, итог заказа равен сумме позиций. Деньги — целые евроценты. Пользователь и товар созданы раньше заказа; даты оплаты, отправки, доставки и отмены соответствуют статусу. При пяти заказах представлены все пять статусов. Ожидающие и оплаченные заказы резервируют товар; `on_hand` равен сумме `reserved` и `available`.",
    limits:
      "Это синтетический итоговый снимок, не журнал складских движений, SQL-импортёр или полноценный симулятор торговли. Налоги, стоимость доставки и скидки не моделируются. ID — повторяемые тестовые строки, не UUID и не секреты; между наборами они могут повторяться. Переводятся только имена и названия товаров. Обычная генерация из импортированного JSON не сохраняет эти связи.",
    studio:
      "Выберите **Связанный магазин** в существующем списке пресетов. Счётчик станет количеством заказов; пользователи и товары создаются автоматически. Образец модели доступен только для чтения, независимые настройки полей скрыты ради согласованности. Для своих полей выберите другой пресет или импортируйте JSON.",
    api: "Локальный REST-маршрут принимает только `seed`, `count`, необязательные `locale` и `format`. Исходные документы и переопределения полей отклоняются. JSON и XML сохраняют весь объект; JSONL содержит одну строку-объект; CSV содержит одну строку с тремя массивами в JSON-ячейках, а не три отдельные таблицы.",
  },
  es: {
    intro:
      "La tienda relacionada es un modelo fijo separado, no un escenario de campos independientes. Devuelve un objeto con las colecciones `users`, `products` y `orders`.",
    guarantees:
      "`count` significa 1–1000 pedidos (valor predeterminado de CLI: 10). Se crea un usuario por cada tres pedidos y un producto por cada dos, redondeando hacia arriba. Todas las referencias existen. Los ID y correos son únicos dentro del resultado. Los precios coinciden con los productos, los importes de línea con las cantidades y el total con las líneas. Todos los importes son céntimos de euro enteros. La creación precede al pedido y los tiempos de pago, envío, entrega y cancelación corresponden al estado. Cinco pedidos cubren los cinco estados. Los pedidos pendientes y pagados reservan existencias; `on_hand` es la suma de `reserved` y `available`.",
    limits:
      "Es una instantánea sintética final, no un registro de movimientos, importador SQL ni simulador comercial completo. No incluye impuestos, gastos de envío ni descuentos. Los ID son cadenas de prueba reproducibles, no UUID ni secretos, y pueden repetirse entre conjuntos. Solo se traducen nombres y títulos de productos. La generación genérica desde JSON importado no conserva estas relaciones.",
    studio:
      "Elige **Tienda relacionada** en el selector existente. La cantidad pasa a significar pedidos; usuarios y productos son automáticos. La vista del modelo es de solo lectura y los ajustes de campos se ocultan para conservar las garantías. Elige otro ajuste o importa JSON para personalizar campos.",
    api: "La ruta REST local solo acepta `seed`, `count` y los opcionales `locale` y `format`. Rechaza documentos originales y ajustes de campos. JSON y XML conservan el objeto completo; JSONL contiene una línea de objeto; CSV contiene una fila con los tres arrays como celdas JSON, no tres tablas separadas.",
  },
};
