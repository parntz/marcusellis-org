import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth-options";
import {
  normalizeSidebarRoute,
  setRouteSidebarConfig,
} from "../../../../../lib/site-config-route-sidebar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeInternalPath(value, fallback) {
  const s = String(value || "").trim();
  if (!s.startsWith("/") || s.startsWith("//")) {
    return fallback;
  }
  return s;
}

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const route = normalizeSidebarRoute(searchParams.get("route") || "/");
  const redirectRaw = searchParams.get("redirect") || route;
  const redirectTo = safeInternalPath(redirectRaw, route);

  await setRouteSidebarConfig(route, { enabled: false });

  return NextResponse.redirect(new URL(redirectTo, request.url), 303);
}
