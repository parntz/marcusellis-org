import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth-options";
import { isAdminSession } from "../../../../lib/authz";
import { listAboutUsStaff, replaceAboutUsStaff } from "../../../../lib/about-us-staff.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const staff = await listAboutUsStaff();
    return NextResponse.json({ staff });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load staff." },
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
  const staff = Array.isArray(body.staff) ? body.staff : null;
  if (!staff) {
    return NextResponse.json({ error: "Expected { staff: [...] }." }, { status: 400 });
  }
  try {
    const saved = await replaceAboutUsStaff(staff);
    return NextResponse.json({ ok: true, staff: saved });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Save failed." },
      { status: 400 }
    );
  }
}
