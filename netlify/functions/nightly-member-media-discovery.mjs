import "../../scripts/load-env.mjs";
import { closeDb } from "../../lib/sqlite.mjs";
import { runMemberMediaDiscovery } from "../../lib/member-media-discovery.mjs";

export const config = {
  schedule: "0 3 * * *",
};

function json(body, init = {}) {
  return new Response(JSON.stringify(body, null, 2), {
    status: init.status || 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers || {}),
    },
  });
}

export default async function nightlyMemberMediaDiscovery() {
  try {
    const result = await runMemberMediaDiscovery({
      scheduleLabel: "nightly",
      memberLimit:
        Math.max(1, Number.parseInt(process.env.MEMBER_MEDIA_DISCOVERY_MEMBER_LIMIT || "25", 10) || 25), // Conservative nightly member cap for Netlify scheduled runs; increase only after confirming runtime/quota headroom.
    });
    return json(result);
  } catch (error) {
    return json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  } finally {
    await closeDb();
  }
}
