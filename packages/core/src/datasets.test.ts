import { describe, expect, it } from "vitest";
import {
  generateDataset,
  getDataset,
  LOCALES,
  serializeOutput,
} from "./index.js";

describe("linked shop dataset", () => {
  for (const count of [1, 7, 1000]) {
    it(`keeps references, money, stock and dates coherent for ${count} orders`, () => {
      const data = generateDataset("shop", { seed: "shop-test", count });
      expect(data.orders).toHaveLength(count);
      expect(data.users).toHaveLength(Math.ceil(count / 3));
      expect(data.products).toHaveLength(Math.ceil(count / 2));
      for (const collection of [data.users, data.products, data.orders])
        expect(new Set(collection.map(({ id }) => id)).size).toBe(
          collection.length,
        );
      const reserved = new Map<string, number>();
      for (const order of data.orders) {
        const user = data.users.find(({ id }) => id === order.user_id);
        expect(user).toBeDefined();
        if (!user) throw new Error("Missing linked user.");
        expect(user.created_at <= order.created_at).toBe(true);
        expect(
          new Set(order.items.map(({ product_id }) => product_id)).size,
        ).toBe(order.items.length);
        expect(order.items.length).toBeGreaterThan(0);
        expect(order.total_cents).toBe(
          order.items.reduce((sum, item) => sum + item.total_cents, 0),
        );
        for (const item of order.items) {
          const product = data.products.find(
            ({ id }) => id === item.product_id,
          );
          expect(product).toBeDefined();
          if (!product) throw new Error("Missing linked product.");
          expect(product.created_at <= order.created_at).toBe(true);
          expect(item.unit_price_cents).toBe(product?.price_cents);
          expect(order.currency).toBe(product?.currency);
          expect(Number.isInteger(item.quantity)).toBe(true);
          expect(item.quantity).toBeGreaterThan(0);
          expect(item.total_cents).toBe(item.unit_price_cents * item.quantity);
          if (order.status === "pending" || order.status === "paid")
            reserved.set(
              item.product_id,
              (reserved.get(item.product_id) ?? 0) + item.quantity,
            );
        }
        expect(order.paid_at !== null).toBe(
          ["paid", "shipped", "delivered"].includes(order.status),
        );
        expect(order.shipped_at !== null).toBe(
          ["shipped", "delivered"].includes(order.status),
        );
        expect(order.delivered_at !== null).toBe(order.status === "delivered");
        expect(order.cancelled_at !== null).toBe(order.status === "cancelled");
        if (order.paid_at) expect(order.paid_at > order.created_at).toBe(true);
        if (order.shipped_at)
          expect(order.shipped_at > (order.paid_at ?? "")).toBe(true);
        if (order.delivered_at)
          expect(order.delivered_at > (order.shipped_at ?? "")).toBe(true);
        if (order.cancelled_at)
          expect(order.cancelled_at > order.created_at).toBe(true);
      }
      for (const product of data.products) {
        expect(product.stock.reserved).toBe(reserved.get(product.id) ?? 0);
        expect(product.stock.on_hand).toBe(
          product.stock.available + product.stock.reserved,
        );
        expect(product.stock.available).toBeGreaterThanOrEqual(0);
      }
      if (count >= 5)
        expect(new Set(data.orders.map(({ status }) => status)).size).toBe(5);
      for (const format of ["json", "csv", "xml", "jsonl"] as const)
        expect(serializeOutput(data, format).length).toBeGreaterThan(0);
    });
  }
  it("is deterministic, localized and does not share mutable results", () => {
    const options = { seed: "SENTINEL_SEED", count: 8 };
    const original = generateDataset("shop", options);
    expect(generateDataset("shop", options)).toEqual(original);
    expect(
      generateDataset("shop", { ...options, seed: "another" }),
    ).not.toEqual(original);
    expect(JSON.stringify(original)).not.toContain("SENTINEL");
    for (const locale of LOCALES) {
      const localized = generateDataset("shop", { ...options, locale });
      expect(localized.orders).toEqual(original.orders);
      expect(localized.users.map(({ id }) => id)).toEqual(
        original.users.map(({ id }) => id),
      );
      expect(getDataset("shop", locale).template.orders).toHaveLength(1);
      if (locale !== "en") {
        expect(localized.users[0]?.name).not.toBe(original.users[0]?.name);
        expect(localized.products[0]?.title).not.toBe(
          original.products[0]?.title,
        );
      }
    }
    original.orders.length = 0;
    expect(generateDataset("shop", options).orders).toHaveLength(8);
  });
  it("rejects unknown recipes and invalid settings without echoing input", () => {
    expect(() =>
      generateDataset("SENTINEL", { seed: "test", count: 1 }),
    ).toThrow("Unknown dataset ID.");
    for (const count of [
      0,
      -1,
      1.5,
      1001,
      Number.NaN,
      Number.POSITIVE_INFINITY,
    ])
      expect(() => generateDataset("shop", { seed: "test", count })).toThrow(
        "between 1 and 1000",
      );
    for (const seed of ["", "x".repeat(257)])
      expect(() => generateDataset("shop", { seed, count: 1 })).toThrow();
    expect(() => getDataset("unknown")).toThrow("Unknown dataset ID.");
  });
});
