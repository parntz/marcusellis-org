import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth-options";
import {
  duplicateSidebarToPage,
  listSidebarBoxesForPage,
  listSidebarSetsByFamily,
  replaceSidebarBoxesForPage,
} from "../../../../lib/site-config-sidebar.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const family = searchParams.get("family");
  const route = searchParams.get("route");

  if (family) {
    const sets = await listSidebarSetsByFamily(family);
    return NextResponse.json({ familyKey: family, sets });
  }

  if (route) {
    const boxes = await listSidebarBoxesForPage(route);
    return NextResponse.json({ pageRoute: route, boxes });
  }

  return NextResponse.json({ error: "Query ?family= or ?route= is required." }, { status: 400 });
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const pageRoute = typeof body.pageRoute === "string" ? body.pageRoute : "";
  const familyKey = typeof body.familyKey === "string" ? body.familyKey : "";
  const boxes = Array.isArray(body.boxes) ? body.boxes : null;

  if (!pageRoute || !familyKey || !boxes?.length) {
    return NextResponse.json(
      { error: "Expected { pageRoute, familyKey, boxes: [{ kind, payload }] }." },
      { status: 400 }
    );
  }

  const normalized = boxes.map((box) => ({
    kind: String(box.kind || ""),
    payload: box.payload && typeof box.payload === "object" ? box.payload : {},
  }));

  const allowed = new Set(["contact", "rate", "bforms", "cta_group"]);
  if (normalized.some((b) => !allowed.has(b.kind))) {
    return NextResponse.json({ error: "Invalid box kind." }, { status: 400 });
  }

  try {
    const saved = await replaceSidebarBoxesForPage(pageRoute, familyKey, normalized);
    return NextResponse.json({ pageRoute, boxes: saved });
  } catch (e) {
    return NextResponse.json({ error: e?.message || "Save failed." }, { status: 400 });
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const fromRoute = typeof body.fromRoute === "string" ? body.fromRoute : "";
  const toRoute = typeof body.toRoute === "string" ? body.toRoute : "";
  const familyKey = typeof body.familyKey === "string" ? body.familyKey : "";

  if (!fromRoute || !toRoute || !familyKey) {
    return NextResponse.json(
      { error: "Expected { fromRoute, toRoute, familyKey }." },
      { status: 400 }
    );
  }

  try {
    await duplicateSidebarToPage(fromRoute, toRoute, familyKey);
    const boxes = await listSidebarBoxesForPage(toRoute);
    return NextResponse.json({ pageRoute: toRoute, boxes });
  } catch (e) {
    return NextResponse.json({ error: e?.message || "Duplicate failed." }, { status: 400 });
  }
}
