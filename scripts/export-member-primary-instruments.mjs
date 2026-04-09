import "./load-env.mjs";
import { writeFileSync } from "node:fs";
import { getClient } from "../lib/sqlite.mjs";

const outputPath = process.argv[2] || "/Users/paularntz/Desktop/member_primary_instruments.csv";
const client = getClient();

const result = await client.execute(`
  SELECT first_name, last_name, primary_instruments_json
  FROM member_pages
  ORDER BY last_name COLLATE NOCASE ASC, first_name COLLATE NOCASE ASC
`);

function getFirstPrimaryInstrument(value) {
  try {
    const parsed = JSON.parse(String(value || "[]"));
    if (Array.isArray(parsed) && parsed.length) {
      return String(parsed[0] ?? "").trim();
    }
  } catch {
    // Leave blank if the stored JSON is malformed.
  }
  return "";
}

function escapeCsv(value) {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const lines = ["first_name,last_name,first_primary_instrument"];
for (const row of result.rows) {
  lines.push(
    [row.first_name, row.last_name, getFirstPrimaryInstrument(row.primary_instruments_json)]
      .map(escapeCsv)
      .join(",")
  );
}

writeFileSync(outputPath, `${lines.join("\n")}\n`);
console.log(`${outputPath}\nrows=${result.rows.length}`);

await client.close();
