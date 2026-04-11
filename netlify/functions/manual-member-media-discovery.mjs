import "../../scripts/load-env.mjs";
import { closeDb } from "../../lib/sqlite.mjs";
import { runMemberMediaDiscovery } from "../../lib/member-media-discovery.mjs";

function json(body, init = {}) {
  return new Response(JSON.stringify(body, null, 2), {
    status: init.status || 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers || {}),
    },
  });
}

function isAuthorized(request) {
  const expected = String(process.env.MEMBER_MEDIA_DISCOVERY_MANUAL_TOKEN || "").trim();
  if (!expected) return false;
  const auth = String(request.headers.get("authorization") || "").trim();
  if (auth === `Bearer ${expected}`) return true;
  const url = new URL(request.url);
  return String(url.searchParams.get("token") || "").trim() === expected;
}

export default async function manualMemberMediaDiscovery(request) {
  try {
    if (!isAuthorized(request)) {
      return json(
        {
          ok: false,
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const limit = Number.parseInt(url.searchParams.get("limit") || "", 10) || undefined;
    const maxResultsPerMember =
      Number.parseInt(url.searchParams.get("maxResultsPerMember") || "", 10) || undefined;

    const result = await runMemberMediaDiscovery({
      scheduleLabel: "manual",
      memberLimit: limit,
      maxResultsPerMember,
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
