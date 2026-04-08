import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth-options";
import { isAdminSession } from "../../../../../lib/authz";
import { getCalloutConfig, setCalloutConfig } from "../../../../../lib/site-config-callouts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function normalizeLocation(value) {
  const location = String(value || "").trim();
  return location || "header";
}

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const location = normalizeLocation(searchParams.get("location"));
  const config = await getCalloutConfig(location);
  return NextResponse.json({ location, enabled: config.enabled !== false });
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return unauthorized();
  }

  const body = await request.json().catch(() => ({}));
  const location = normalizeLocation(body?.location);
  const currentConfig = await getCalloutConfig(location);
  const nextConfig = await setCalloutConfig(location, {
    ...currentConfig,
    enabled: body?.enabled !== false,
  });

  return NextResponse.json({ location, enabled: nextConfig.enabled !== false });
}
