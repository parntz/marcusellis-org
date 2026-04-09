import "./load-env.mjs";
import { closeDb, getClient } from "../lib/sqlite.mjs";

const client = getClient();

const sampleRows = [
  {
    name: "Session Guitarist",
    email: "session.player@example.com",
    topic: "Membership",
    message: "Interested in joining and learning more about contract support.",
  },
  {
    name: "Touring Drummer",
    email: "tour.drummer@example.com",
    topic: "Benefits",
    message: "Looking for details on member benefits and rehearsal space access.",
  },
];

const stmts = sampleRows.map((row) => ({
  sql: `
    INSERT INTO member_inquiries (name, email, topic, message)
    VALUES (?, ?, ?, ?)
  `,
  args: [row.name, row.email, row.topic, row.message],
}));

const callouts = [
  {
    slug: "free-parking",
    title: "Free Parking for Members",
    body: "Free parking at 20+ Metropolis lots. Tap for map and details.",
    cta_label: "Free Parking Map",
    cta_href: "/_downloaded/file/parkingmappng--asset",
    display_order: 1,
  },
  {
    slug: "travel-tips",
    title: "Flying Soon?",
    body: "Travel tips for musicians: how to carry on your instrument.",
    cta_label: "Travel Tips PDF",
    cta_href: "/_downloaded/sites/default/files/Media%20Root/Travel%20Tips%20for%20Musicians2023.pdf",
    display_order: 2,
  },
];

const calloutStmts = callouts.map((row) => ({
  sql: `
    INSERT INTO site_callouts (slug, title, body, cta_label, cta_href, location, display_order, is_active)
    VALUES (?, ?, ?, ?, ?, 'header', ?, 1)
    ON CONFLICT(slug) DO UPDATE SET
      title=excluded.title,
      body=excluded.body,
      cta_label=excluded.cta_label,
      cta_href=excluded.cta_href,
      display_order=excluded.display_order,
      is_active=1,
      updated_at=datetime('now');
  `,
  args: [row.slug, row.title, row.body, row.cta_label, row.cta_href, row.display_order],
}));

await client.batch([...stmts, ...calloutStmts], "write");
console.log(`Seeded ${sampleRows.length} member_inquiries rows and ${callouts.length} site_callouts rows.`);
await closeDb();
