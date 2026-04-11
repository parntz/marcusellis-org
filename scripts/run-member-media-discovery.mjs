#!/usr/bin/env node

import "./load-env.mjs";
import { closeDb } from "../lib/sqlite.mjs";
import { runMemberMediaDiscovery } from "../lib/member-media-discovery.mjs";

function parseArgs(argv = process.argv.slice(2)) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--limit") {
      out.memberLimit = Number.parseInt(argv[++i] || "", 10) || undefined;
    } else if (arg === "--max-results-per-member") {
      out.maxResultsPerMember = Number.parseInt(argv[++i] || "", 10) || undefined;
    } else if (arg === "--query-suffix") {
      out.querySuffix = argv[++i] || "";
    } else if (arg === "--schedule-label") {
      out.scheduleLabel = argv[++i] || "manual";
    }
  }
  return out;
}

async function main() {
  const result = await runMemberMediaDiscovery({
    scheduleLabel: "manual",
    ...parseArgs(),
  });
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
