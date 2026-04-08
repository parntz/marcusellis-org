import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth-options";
import { isAdminSession } from "../../../../lib/authz";
import {
  getRouteSidebarConfig,
  normalizeSidebarRoute,
  setRouteSidebarConfig,
} from "../../../../lib/site-config-route-sidebar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const route = normalizeSidebarRoute(searchParams.get("route") || "/");
  return NextResponse.json(await getRouteSidebarConfig(route));
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return unauthorized();
  }

  const body = await request.json().catch(() => ({}));
  const route = normalizeSidebarRoute(body?.route || "/");
  return NextResponse.json(
    await setRouteSidebarConfig(route, {
      enabled: body?.enabled !== false,
    })
  );
}
