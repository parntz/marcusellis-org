import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth-options";
import { isAdminSession } from "../../../lib/authz";
import {
  getEditableSitePageBodyForAdmin,
  updateEditableSitePageBody,
} from "../../../lib/site-page-body.js";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return unauthorized();
  }

  const { searchParams } = new URL(req.url);
  const route = searchParams.get("route") || "";

  try {
    const data = await getEditableSitePageBodyForAdmin(route);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unable to load page body." },
      { status: 400 }
    );
  }
}

export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return unauthorized();
  }

  let body = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const route = body?.route || "";
  const bodyHtml = body?.bodyHtml ?? "";

  try {
    const data = await updateEditableSitePageBody(route, bodyHtml);
    return NextResponse.json({ ok: true, ...data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update page body." },
      { status: 400 }
    );
  }
}
