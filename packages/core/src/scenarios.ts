import {
  type FieldGenerator,
  type GeneratorKind,
  type GeneratorSettings,
  parseFieldGenerators,
} from "./fields.js";
import type { JsonValue } from "./generate.js";
import { type Locale, parseLocale } from "./locale.js";
import { generateRecords } from "./records.js";
import { SCENARIO_TEXT, scenarioWord } from "./scenario-locales.js";

export interface Scenario {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly description: string;
  readonly template: JsonValue;
  readonly fields: readonly FieldGenerator[];
}

function scenario(
  id: string,
  name: string,
  category: string,
  description: string,
  definitions: Record<
    string,
    Exclude<GeneratorKind, "auto" | "enum"> | GeneratorSettings
  >,
): Scenario {
  const fields = parseFieldGenerators(
    Object.entries(definitions).map(([path, definition]) => ({
      path: path.split("."),
      ...(typeof definition === "string"
        ? { generator: definition }
        : definition),
    })),
  );
  const records = generateRecords({ seed: `fixture-${id}`, count: 1, fields });
  if (!Array.isArray(records) || records[0] === undefined) {
    throw new Error("Could not construct the scenario template.");
  }
  return { id, name, category, description, template: records[0], fields };
}

export const SCENARIOS: readonly Scenario[] = [
  scenario(
    "users",
    "Users",
    "People",
    "Accounts, signup flows and user tables.",
    {
      id: "uuid",
      name: "name",
      email: "email",
      role: { generator: "enum", values: ["member", "editor", "admin"] },
      active: "boolean",
      created_at: "date",
    },
  ),
  scenario(
    "profiles",
    "Nested profiles",
    "People",
    "Nested objects for profile editors and account pages.",
    {
      id: "uuid",
      "profile.name": "name",
      "profile.email": "email",
      "preferences.notifications": "boolean",
      "preferences.theme": {
        generator: "enum",
        values: ["light", "dark", "system"],
      },
      "metrics.score": { generator: "number", min: 0, max: 100 },
      updated_at: "date",
    },
  ),
  scenario(
    "teams",
    "Teams",
    "People",
    "Team directories, owners and membership counts.",
    {
      id: "uuid",
      label: {
        generator: "enum",
        values: ["Platform", "Design", "Support", "Operations"],
      },
      "owner.name": "name",
      "owner.email": "email",
      member_count: { generator: "number", min: 1, max: 50 },
      created_at: "date",
    },
  ),
  scenario(
    "organizations",
    "Organizations",
    "People",
    "Multi-tenant dashboards and organization settings.",
    {
      id: "uuid",
      company: {
        generator: "enum",
        values: ["Example Labs", "Demo Studio", "Sample Works"],
      },
      contact_email: "email",
      verified: "boolean",
      "billing.contact": "name",
      created_at: "date",
    },
  ),
  scenario(
    "contacts",
    "Contacts",
    "People",
    "Contact lists, CRM cards and address-book search.",
    {
      id: "uuid",
      name: "name",
      email: "email",
      "address.city": {
        generator: "enum",
        values: ["Sampleton", "Demo City", "Example Bay"],
      },
      "address.country": {
        generator: "enum",
        values: ["US", "GB", "DE", "FI"],
      },
      favorite: "boolean",
    },
  ),
  scenario(
    "products",
    "Products",
    "Commerce",
    "Product grids, detail pages and price displays.",
    {
      id: "uuid",
      title: {
        generator: "enum",
        values: [
          "Test notebook",
          "Demo backpack",
          "Sample mug",
          "Fixture lamp",
        ],
      },
      sku: "string",
      price_cents: { generator: "number", min: 99, max: 99_999 },
      category: {
        generator: "enum",
        values: ["office", "home", "electronics"],
      },
      in_stock: "boolean",
      created_at: "date",
    },
  ),
  scenario(
    "orders",
    "Orders",
    "Commerce",
    "Order histories with customer and total details.",
    {
      id: "uuid",
      "customer.name": "name",
      "customer.email": "email",
      total_cents: { generator: "number", min: 0, max: 250_000 },
      status: {
        generator: "enum",
        values: ["pending", "paid", "shipped", "cancelled"],
      },
      currency: { generator: "enum", values: ["USD", "EUR", "GBP"] },
      fulfilled: "boolean",
      placed_at: "date",
    },
  ),
  scenario(
    "cart-items",
    "Cart items",
    "Commerce",
    "Cart rows, quantity controls and checkout summaries.",
    {
      id: "uuid",
      cart_id: "uuid",
      product_id: "uuid",
      quantity: { generator: "number", min: 1, max: 20 },
      unit_price_cents: { generator: "number", min: 99, max: 99_999 },
      saved_for_later: "boolean",
    },
  ),
  scenario(
    "inventory",
    "Inventory",
    "Commerce",
    "Stock tables and warehouse-management views.",
    {
      id: "uuid",
      sku: "string",
      "warehouse.code": "string",
      available: { generator: "number", min: 0, max: 500 },
      reserved: { generator: "number", min: 0, max: 50 },
      last_checked_at: "date",
    },
  ),
  scenario(
    "shipments",
    "Shipments",
    "Commerce",
    "Delivery tracking, recipients and dispatch timelines.",
    {
      id: "uuid",
      order_id: "uuid",
      recipient: "name",
      tracking_reference: "string",
      service: { generator: "enum", values: ["standard", "express", "pickup"] },
      delivered: "boolean",
      dispatched_at: "date",
    },
  ),
  scenario(
    "payments",
    "Payments",
    "Finance",
    "Payment lists and transaction detail screens.",
    {
      id: "uuid",
      payer_email: "email",
      amount_cents: { generator: "number", min: 100, max: 500_000 },
      currency: { generator: "enum", values: ["USD", "EUR", "GBP"] },
      method: {
        generator: "enum",
        values: ["card", "bank_transfer", "wallet"],
      },
      captured: "boolean",
      reference: "string",
      paid_at: "date",
    },
  ),
  scenario(
    "invoices",
    "Invoices",
    "Finance",
    "Billing tables and invoice previews.",
    {
      id: "uuid",
      invoice_number: "string",
      "customer.name": "name",
      "customer.email": "email",
      total_cents: { generator: "number", min: 100, max: 1_000_000 },
      currency: { generator: "enum", values: ["USD", "EUR", "GBP"] },
      paid: "boolean",
      due_at: "date",
    },
  ),
  scenario(
    "subscriptions",
    "Subscriptions",
    "Finance",
    "Recurring billing and subscription-management pages.",
    {
      id: "uuid",
      customer_id: "uuid",
      contact_email: "email",
      monthly_price_cents: { generator: "number", min: 500, max: 50_000 },
      plan: { generator: "enum", values: ["starter", "team", "business"] },
      active: "boolean",
      renews_at: "date",
    },
  ),
  scenario(
    "transactions",
    "Transactions",
    "Finance",
    "Ledger tables, account filters and balance views.",
    {
      id: "uuid",
      account_id: "uuid",
      description: "string",
      amount_cents: { generator: "number", min: -250_000, max: 250_000 },
      currency: { generator: "enum", values: ["USD", "EUR", "GBP"] },
      reconciled: "boolean",
      recorded_at: "date",
    },
  ),
  scenario(
    "refunds",
    "Refunds",
    "Finance",
    "Refund queues and payment support workflows.",
    {
      id: "uuid",
      payment_id: "uuid",
      requester_email: "email",
      amount_cents: { generator: "number", min: 100, max: 250_000 },
      reason: {
        generator: "enum",
        values: ["duplicate", "returned", "customer_request"],
      },
      approved: "boolean",
      requested_at: "date",
    },
  ),
  scenario(
    "projects",
    "Projects",
    "Work",
    "Project portfolios, ownership and progress boards.",
    {
      id: "uuid",
      title: "string",
      "owner.name": "name",
      budget_cents: { generator: "number", min: 10_000, max: 50_000_000 },
      status: {
        generator: "enum",
        values: ["planning", "active", "on_hold", "done"],
      },
      archived: "boolean",
      starts_at: "date",
    },
  ),
  scenario(
    "tasks",
    "Tasks",
    "Work",
    "Task boards, assignee filters and due-date columns.",
    {
      id: "uuid",
      title: "string",
      "assignee.name": "name",
      "assignee.email": "email",
      priority: {
        generator: "enum",
        values: ["low", "normal", "high", "urgent"],
      },
      completed: "boolean",
      due_at: "date",
    },
  ),
  scenario(
    "support-tickets",
    "Support tickets",
    "Work",
    "Support inboxes and customer service queues.",
    {
      id: "uuid",
      subject: "string",
      "requester.name": "name",
      "requester.email": "email",
      category: {
        generator: "enum",
        values: ["billing", "technical", "account"],
      },
      resolved: "boolean",
      opened_at: "date",
    },
  ),
  scenario(
    "appointments",
    "Appointments",
    "Work",
    "Calendars, booking lists and attendee information.",
    {
      id: "uuid",
      title: "string",
      attendee: "name",
      contact_email: "email",
      confirmed: "boolean",
      duration_minutes: { generator: "number", min: 15, max: 120 },
      scheduled_at: "date",
    },
  ),
  scenario(
    "timesheets",
    "Timesheets",
    "Work",
    "Time-entry tables and approval screens.",
    {
      id: "uuid",
      employee: "name",
      project_id: "uuid",
      duration_minutes: { generator: "number", min: 15, max: 480 },
      approved: "boolean",
      logged_at: "date",
    },
  ),
  scenario(
    "posts",
    "Posts",
    "Content",
    "Publishing dashboards and content-feed layouts.",
    {
      id: "uuid",
      title: "string",
      body: "string",
      "author.name": "name",
      published: "boolean",
      category: { generator: "enum", values: ["news", "guides", "updates"] },
      published_at: "date",
    },
  ),
  scenario(
    "comments",
    "Comments",
    "Content",
    "Comment threads and moderation queues.",
    {
      id: "uuid",
      post_id: "uuid",
      "author.name": "name",
      body: "string",
      approved: "boolean",
      created_at: "date",
      channel: { generator: "enum", values: ["web", "mobile", "api"] },
    },
  ),
  scenario(
    "reviews",
    "Reviews",
    "Content",
    "Review lists, customer feedback and moderation.",
    {
      id: "uuid",
      product_id: "uuid",
      reviewer: "name",
      feedback: "string",
      rating: { generator: "number", min: 1, max: 5 },
      verified_purchase: "boolean",
      created_at: "date",
    },
  ),
  scenario(
    "notifications",
    "Notifications",
    "Content",
    "Notification centers and unread badges.",
    {
      id: "uuid",
      recipient_id: "uuid",
      title: "string",
      message: "string",
      channel: { generator: "enum", values: ["in_app", "email", "push"] },
      read: "boolean",
      sent_at: "date",
    },
  ),
  scenario(
    "messages",
    "Messages",
    "Content",
    "Inbox layouts and message preview lists.",
    {
      id: "uuid",
      "sender.name": "name",
      "sender.email": "email",
      subject: "string",
      body: "string",
      unread: "boolean",
      folder: { generator: "enum", values: ["inbox", "archive", "sent"] },
      sent_at: "date",
    },
  ),
  scenario(
    "audit-logs",
    "Audit logs",
    "Systems",
    "Activity feeds, audit tables and event filters.",
    {
      id: "uuid",
      "actor.name": "name",
      "actor.email": "email",
      action: {
        generator: "enum",
        values: ["created", "updated", "deleted", "signed_in"],
      },
      resource_id: "uuid",
      success: "boolean",
      occurred_at: "date",
    },
  ),
  scenario(
    "sessions",
    "User sessions",
    "Systems",
    "Session-management pages and device lists.",
    {
      id: "uuid",
      user_id: "uuid",
      device_label: {
        generator: "enum",
        values: ["Desktop browser", "Mobile browser", "Tablet browser"],
      },
      active: "boolean",
      created_at: "date",
      expires_at: "date",
    },
  ),
  scenario(
    "webhooks",
    "Webhook deliveries",
    "Systems",
    "Delivery histories, retries and integration dashboards.",
    {
      id: "uuid",
      event_id: "uuid",
      event_name: {
        generator: "enum",
        values: ["order.created", "payment.completed", "user.updated"],
      },
      attempt: { generator: "number", min: 1, max: 5 },
      delivered: "boolean",
      delivered_at: "date",
    },
  ),
  scenario(
    "analytics",
    "Analytics events",
    "Systems",
    "Event explorers and analytics table pagination.",
    {
      id: "uuid",
      session_id: "uuid",
      event_name: {
        generator: "enum",
        values: ["page_view", "button_click", "form_submit"],
      },
      "properties.page": {
        generator: "enum",
        values: ["/", "/products", "/checkout", "/account"],
      },
      "properties.duration_ms": { generator: "number", min: 0, max: 300_000 },
      occurred_at: "date",
    },
  ),
  scenario(
    "sensor-readings",
    "Sensor readings",
    "Systems",
    "Telemetry tables and device-monitoring screens.",
    {
      id: "uuid",
      device_id: "uuid",
      "measurement.value": { generator: "number", min: -20, max: 60 },
      "measurement.label": { generator: "enum", values: ["temperature_c"] },
      online: "boolean",
      measured_at: "date",
    },
  ),
];

export function getScenario(id: string, locale: Locale = "en"): Scenario {
  const language = parseLocale(locale);
  const found = SCENARIOS.find((item) => item.id === id);
  if (!found) throw new TypeError("Unknown scenario ID.");
  if (language === "en") return found;
  const text = SCENARIO_TEXT[language][id];
  if (!text) throw new TypeError("Incomplete scenario dictionary.");
  const fields = found.fields.map(
    (field): FieldGenerator => ({
      ...field,
      ...(field.generator === "enum"
        ? { values: field.values.map((value) => scenarioWord(value, language)) }
        : {}),
    }),
  );
  const records = generateRecords({
    seed: `fixture-${id}`,
    count: 1,
    locale: language,
    fields,
  });
  if (!Array.isArray(records) || records[0] === undefined)
    throw new Error("Could not construct the localized scenario template.");
  return {
    ...found,
    name: text[0],
    description: text[1],
    category: scenarioWord(found.category, language),
    fields,
    template: records[0],
  };
}
