import type { FieldGenerator, GeneratorKind } from "./fields.js";
import type { JsonValue } from "./generate.js";
import { generateRecords } from "./records.js";

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
  definitions: Record<string, Exclude<GeneratorKind, "auto">>,
): Scenario {
  const fields = Object.entries(definitions).map(([path, generator]) => ({
    path: path.split("."),
    generator,
  }));
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
      "metrics.score": "number",
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
      label: "string",
      "owner.name": "name",
      "owner.email": "email",
      member_count: "number",
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
      company: "string",
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
      "address.city": "string",
      "address.country": "string",
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
      title: "string",
      sku: "string",
      price_cents: "number",
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
      total_cents: "number",
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
      quantity: "number",
      unit_price_cents: "number",
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
      available: "number",
      reserved: "number",
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
      amount_cents: "number",
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
      total_cents: "number",
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
      monthly_price_cents: "number",
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
      amount_cents: "number",
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
      amount_cents: "number",
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
      budget_cents: "number",
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
      duration_minutes: "number",
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
      action: "string",
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
      device_label: "string",
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
      event_name: "string",
      attempt: "number",
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
      event_name: "string",
      "properties.page": "string",
      "properties.duration_ms": "number",
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
      "measurement.value": "number",
      "measurement.label": "string",
      online: "boolean",
      measured_at: "date",
    },
  ),
];

export function getScenario(id: string): Scenario {
  const found = SCENARIOS.find((item) => item.id === id);
  if (!found) throw new TypeError("Unknown scenario ID.");
  return found;
}
