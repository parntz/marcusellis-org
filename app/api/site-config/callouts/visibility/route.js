import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth-options";
import { isAdminSession } from "../../../../../lib/authz";
import { listCallouts } from "../../../../../lib/callouts";
import { computeHeaderNoticeStripVisible } from "../../../../../lib/callout-strip-visibility.js";
import { getCalloutConfig, setCalloutConfig } from "../../../../../lib/site-config-callouts";
import { getRouteCalloutConfig, setRouteCalloutConfig } from "../../../../../lib/site-config-route-callouts";
import { normalizeSidebarRoute } from "../../../../../lib/normalize-sidebar-route.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function normalizeLocation(value) {
  const location = String(value || "").trim();
  return location || "header";
}

function normalizeRouteParam(value) {
  return normalizeSidebarRoute(value);
}

async function headerStripVisibilityState(route, session) {
  const [config, calloutConfig, headerCallouts] = await Promise.all([
    getRouteCalloutConfig(route, "header"),
    getCalloutConfig("header"),
    listCallouts("header"),
  ]);
  const routeEnabled = config.enabled !== false;
  const stripVisible = computeHeaderNoticeStripVisible({
    route,
    hideCallout: false,
    routeCalloutEnabled: routeEnabled,
    globalCalloutEnabled: calloutConfig.enabled,
    headerCalloutCount: headerCallouts.length,
    isAdmin: isAdminSession(session),
  });
  return { routeEnabled, stripVisible };
}

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const location = normalizeLocation(searchParams.get("location"));
  const route = normalizeRouteParam(searchParams.get("route"));
  const config = await getRouteCalloutConfig(route, location);
  const routeEnabled = config.enabled !== false;

  if (location !== "header") {
    return NextResponse.json({ location, route, enabled: routeEnabled, stripVisible: routeEnabled });
  }

  const { stripVisible } = await headerStripVisibilityState(route, session);
  return NextResponse.json({ location, route, enabled: routeEnabled, stripVisible });
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return unauthorized();
  }

  const body = await request.json().catch(() => ({}));
  const location = normalizeLocation(body?.location);
  const route = normalizeRouteParam(body?.route);
  const nextConfig = await setRouteCalloutConfig(route, location, {
    enabled: body?.enabled !== false,
  });
  const routeEnabled = nextConfig.enabled !== false;

  if (location !== "header") {
    return NextResponse.json({ location, route, enabled: routeEnabled, stripVisible: routeEnabled });
  }

  if (routeEnabled) {
    const calloutConfig = await getCalloutConfig("header");
    if (calloutConfig.enabled === false) {
      await setCalloutConfig("header", { ...calloutConfig, enabled: true });
    }
  }

  const { stripVisible } = await headerStripVisibilityState(route, session);
  return NextResponse.json({ location, route, enabled: routeEnabled, stripVisible });
}
