import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth-options";
import { isAdminSession } from "../../../../lib/authz";
import { listCallouts, listCalloutsForAdmin, replaceCalloutsForLocation } from "../../../../lib/callouts";
import { getCalloutConfig, setCalloutConfig } from "../../../../lib/site-config-callouts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get("location") || "header";
  const session = await getServerSession(authOptions);
  const config = await getCalloutConfig(location);

  if (isAdminSession(session)) {
    return NextResponse.json({ location, config, callouts: await listCalloutsForAdmin(location) });
  }

  return NextResponse.json({ location, config, callouts: await listCallouts(location) });
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const location = typeof body.location === "string" && body.location.trim() ? body.location.trim() : "header";
  const items = Array.isArray(body.items) ? body.items : null;
  const config = body.config && typeof body.config === "object" ? body.config : {};

  if (!items) {
    return NextResponse.json({ error: "Expected { location, items }." }, { status: 400 });
  }

  try {
    const [callouts, savedConfig] = await Promise.all([
      replaceCalloutsForLocation(location, items),
      setCalloutConfig(location, config),
    ]);
    return NextResponse.json({ location, config: savedConfig, callouts });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Save failed." }, { status: 400 });
  }
}
