import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth-options";
import { isAdminSession } from "../../../lib/authz";
import {
  getEditablePageHeader,
  normalizeHeaderRoute,
  updateEditablePageHeader,
} from "../../../lib/page-header-editor";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return unauthorized();
  }

  const { searchParams } = new URL(req.url);
  const route = normalizeHeaderRoute(searchParams.get("route") || "/");
  const seedTitle = String(searchParams.get("title") || "");
  const seedDescription = String(searchParams.get("description") || "");
  const editable = await getEditablePageHeader(route, {
    seedTitle,
    seedDescription,
    autoCreateOverride: true,
  });

  return NextResponse.json({
    found: true,
    ...editable,
  });
}

export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return unauthorized();
  }

  let body = null;
  try {
    body = await req.json();
  } catch (_err) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const route = normalizeHeaderRoute(body?.route || "/");
  const title = String(body?.title || "");
  const description = String(body?.description || "");

  let updated = null;
  try {
    updated = await updateEditablePageHeader({ route, title, description });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update page header" },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, ...updated });
}
