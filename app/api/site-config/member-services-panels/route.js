import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth-options";
import { isAdminSession } from "../../../../lib/authz";
import {
  listMemberServicesPanels,
  replaceMemberServicesPanels,
} from "../../../../lib/member-services-panels.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const panels = await listMemberServicesPanels();
    return NextResponse.json({ panels });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unable to load panels." },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const panels = Array.isArray(body.panels) ? body.panels : null;

  if (!panels) {
    return NextResponse.json({ error: "Expected { panels: [...] }." }, { status: 400 });
  }

  try {
    const saved = await replaceMemberServicesPanels(panels);
    return NextResponse.json({ ok: true, panels: saved });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Save failed." },
      { status: 400 }
    );
  }
}
