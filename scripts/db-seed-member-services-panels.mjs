#!/usr/bin/env node
/**
 * Inserts default /member-services hub panels when the table is empty.
 * Run after db:init if the main column should start with the standard nine services.
 *
 *   node scripts/db-seed-member-services-panels.mjs --force
 * Replaces all rows with bundled defaults (same copy as nashvillemusicians.org-style hub sections).
 */
import "./load-env.mjs";
import { closeDb, getClient } from "../lib/sqlite.mjs";
import {
  replaceMemberServicesPanelsWithDefaults,
  seedMemberServicesPanelsIfEmpty,
} from "../lib/member-services-panels-seed.mjs";

const force = process.argv.includes("--force");

async function main() {
  const client = getClient();
  if (force) {
    const rs = await client.execute({
      sql: `SELECT COUNT(*) AS c FROM member_services_panels`,
    });
    const n = Number(rs.rows?.[0]?.c ?? 0);
    if (n > 0) {
      console.log(`Replacing ${n} existing panel row(s) with bundled defaults (--force).`);
    }
    const count = await replaceMemberServicesPanelsWithDefaults(client);
    console.log(`Seeded member_services_panels (${count} rows).`);
    await closeDb();
    return;
  }
  const rs = await client.execute({
    sql: `SELECT COUNT(*) AS c FROM member_services_panels`,
  });
  const n = Number(rs.rows?.[0]?.c ?? 0);
  if (n > 0) {
    console.log(`member_services_panels already has ${n} row(s); skip seed. Use --force to replace with defaults.`);
    await closeDb();
    return;
  }
  const inserted = await seedMemberServicesPanelsIfEmpty(client);
  console.log(`Seeded member_services_panels (${inserted} rows).`);
  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
