import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth-options";
import { canEditMemberPage, isAdminUser } from "../../../../lib/authz";
import { deleteMemberProfile, getMemberProfileBySlug, updateMemberProfile } from "../../../../lib/member-profiles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await params;
  const slug = String(resolvedParams?.slug || "").trim();
  const existing = await getMemberProfileBySlug(slug);
  if (!existing) {
    return NextResponse.json({ error: "Member profile not found." }, { status: 404 });
  }

  if (!canEditMemberPage(session.user, existing)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  try {
    const profile = await updateMemberProfile(existing.id, body);
    return NextResponse.json({ profile });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Save failed." }, { status: 400 });
  }
}

export async function DELETE(_request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await params;
  const slug = String(resolvedParams?.slug || "").trim();
  const existing = await getMemberProfileBySlug(slug);
  if (!existing) {
    return NextResponse.json({ error: "Member profile not found." }, { status: 404 });
  }

  if (!isAdminUser(session.user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await deleteMemberProfile(existing.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Delete failed." }, { status: 400 });
  }
}
