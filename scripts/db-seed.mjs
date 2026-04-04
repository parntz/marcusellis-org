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

await client.batch(stmts, "write");
console.log(`Seeded ${sampleRows.length} member_inquiries rows.`);
await closeDb();
