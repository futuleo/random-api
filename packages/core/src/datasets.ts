import { generateFieldValue } from "./fields.js";
import { type Locale, parseLocale } from "./locale.js";
import { validateRecordCount } from "./objects.js";
import { createSeededRandom } from "./random.js";
import { scenarioWord } from "./scenario-locales.js";

export interface DatasetOptions {
  readonly seed: string;
  readonly count: number;
  readonly locale?: Locale | undefined;
}

type ShopUser = {
  id: string;
  name: string;
  email: string;
  created_at: string;
};
type ShopProduct = {
  id: string;
  title: string;
  sku: string;
  price_cents: number;
  currency: string;
  stock: { on_hand: number; reserved: number; available: number };
  created_at: string;
};
const STATUSES = [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
] as const;
type ShopOrder = {
  id: string;
  user_id: string;
  status: (typeof STATUSES)[number];
  currency: string;
  created_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  items: {
    product_id: string;
    quantity: number;
    unit_price_cents: number;
    total_cents: number;
  }[];
  total_cents: number;
};
export type ShopDataset = {
  users: ShopUser[];
  products: ShopProduct[];
  orders: ShopOrder[];
};

const TEXT: Record<Locale, readonly [string, string]> = {
  en: [
    "Linked shop",
    "Users, products and orders with valid links, totals, stock and timelines.",
  ],
  fi: [
    "Yhdistetty verkkokauppa",
    "Käyttäjät, tuotteet ja tilaukset johdonmukaisilla viitteillä, summilla, saldoilla ja ajoilla.",
  ],
  sv: [
    "Sammanhängande butik",
    "Användare, produkter och beställningar med korrekta referenser, belopp, lager och tider.",
  ],
  ru: [
    "Связанный магазин",
    "Пользователи, товары и заказы с корректными связями, суммами, остатками и датами.",
  ],
  es: [
    "Tienda relacionada",
    "Usuarios, productos y pedidos con referencias, importes, existencias y fechas coherentes.",
  ],
};

export const DATASETS = [
  {
    id: "shop",
    name: TEXT.en[0],
    description: TEXT.en[1],
    category: "Commerce",
  },
] as const;

export function getDataset(id: string, locale: Locale = "en") {
  const language = parseLocale(locale);
  if (id !== "shop") throw new TypeError("Unknown dataset ID.");
  return {
    id,
    name: TEXT[language][0],
    description: TEXT[language][1],
    category: scenarioWord("Commerce", language),
    template: generateDataset(id, {
      seed: "fixture-shop",
      count: 1,
      locale: language,
    }),
  };
}

export function generateDataset(
  id: string,
  options: DatasetOptions,
): ShopDataset {
  if (id !== "shop") throw new TypeError("Unknown dataset ID.");
  const random = createSeededRandom(options?.seed);
  validateRecordCount(options.count);
  const locale = parseLocale(options.locale);
  const integer = (min: number, max: number) =>
    min + Math.floor(random() * (max - min + 1));
  const day = 86_400_000;
  const hour = day / 24;
  const entityDate = () =>
    new Date(Date.UTC(2024, 0, 1) + integer(0, 30) * day).toISOString();
  const users: ShopUser[] = Array.from(
    { length: Math.ceil(options.count / 3) },
    (_, index) => ({
      id: `user_${index + 1}`,
      name: String(generateFieldValue({ generator: "name" }, random, locale)),
      email: `shop-user-${index + 1}@example.test`,
      created_at: entityDate(),
    }),
  );
  const titles = [
    "Test notebook",
    "Demo backpack",
    "Sample mug",
    "Fixture lamp",
  ];
  const products: ShopProduct[] = Array.from(
    { length: Math.ceil(options.count / 2) },
    (_, index) => {
      const title = titles[index % titles.length];
      if (title === undefined)
        throw new Error("Missing shop product dictionary.");
      const available = integer(0, 100);
      return {
        id: `product_${index + 1}`,
        title: `${scenarioWord(title, locale)} ${index + 1}`,
        sku: `SHOP-${index + 1}`,
        price_cents: integer(99, 99_999),
        currency: "EUR",
        stock: { on_hand: available, reserved: 0, available },
        created_at: entityDate(),
      };
    },
  );
  const statusOffset = integer(0, STATUSES.length - 1);
  const orders: ShopOrder[] = Array.from(
    { length: options.count },
    (_, index) => {
      const user = users[integer(0, users.length - 1)];
      const status = STATUSES[(index + statusOffset) % STATUSES.length];
      if (!user || !status)
        throw new Error("Missing shop generation dependencies.");
      const created = Date.UTC(2024, 2, 1) + integer(0, 365) * day;
      const paid = created + integer(1, 24) * hour;
      const shipped = paid + integer(1, 3) * day;
      const delivered = shipped + integer(1, 7) * day;
      const productOffset = integer(0, products.length - 1);
      const items = Array.from(
        { length: integer(1, Math.min(3, products.length)) },
        (_, itemIndex) => {
          const product =
            products[(productOffset + itemIndex) % products.length];
          if (!product) throw new Error("Missing shop product.");
          const quantity = integer(1, 5);
          if (status === "pending" || status === "paid") {
            product.stock.reserved += quantity;
            product.stock.on_hand += quantity;
          }
          return {
            product_id: product.id,
            quantity,
            unit_price_cents: product.price_cents,
            total_cents: product.price_cents * quantity,
          };
        },
      );
      return {
        id: `order_${index + 1}`,
        user_id: user.id,
        status,
        currency: "EUR",
        created_at: new Date(created).toISOString(),
        paid_at: ["paid", "shipped", "delivered"].includes(status)
          ? new Date(paid).toISOString()
          : null,
        shipped_at: ["shipped", "delivered"].includes(status)
          ? new Date(shipped).toISOString()
          : null,
        delivered_at:
          status === "delivered" ? new Date(delivered).toISOString() : null,
        cancelled_at:
          status === "cancelled"
            ? new Date(created + integer(1, 48) * hour).toISOString()
            : null,
        items,
        total_cents: items.reduce((sum, item) => sum + item.total_cents, 0),
      };
    },
  );
  return { users, products, orders };
}
