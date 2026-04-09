import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth-options";
import { isAdminSession } from "../../../../lib/authz";
import { getLiveScalesConfig, updateLiveScalesConfig } from "../../../../lib/site-config-live-scales.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return unauthorized();
  }
  try {
    return NextResponse.json(await getLiveScalesConfig());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load live scales content." },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return unauthorized();
  }

  const body = await request.json().catch(() => ({}));
  const hasPatch =
    Object.prototype.hasOwnProperty.call(body || {}, "leadHtml") ||
    Object.prototype.hasOwnProperty.call(body || {}, "downloads") ||
    Object.prototype.hasOwnProperty.call(body || {}, "guide");

  if (!hasPatch) {
    return NextResponse.json({ error: "Expected live scales content updates." }, { status: 400 });
  }

  try {
    return NextResponse.json(await updateLiveScalesConfig(body));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Save failed." },
      { status: 400 }
    );
  }
}
