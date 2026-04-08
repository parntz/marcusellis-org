import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth-options";
import { isAdminSession } from "../../../../lib/authz";
import {
  deleteMemberSiteLink,
  getMemberSiteLinkById,
  updateMemberSiteLink,
} from "../../../../lib/member-site-links";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function parseMemberSiteLinkId(context) {
  const params = await context.params;
  const raw = params?.id;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : 0;
}

export async function PUT(request, context) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = await parseMemberSiteLinkId(context);
  if (!id) {
    return NextResponse.json({ error: "Invalid link id." }, { status: 400 });
  }

  const existing = await getMemberSiteLinkById(id);
  if (!existing) {
    return NextResponse.json({ error: "Link not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));

  try {
    const link = await updateMemberSiteLink(id, body);
    return NextResponse.json({ link });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Update failed." }, { status: 400 });
  }
}

export async function DELETE(_request, context) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = await parseMemberSiteLinkId(context);
  if (!id) {
    return NextResponse.json({ error: "Invalid link id." }, { status: 400 });
  }

  const existing = await getMemberSiteLinkById(id);
  if (!existing) {
    return NextResponse.json({ error: "Link not found." }, { status: 404 });
  }

  await deleteMemberSiteLink(id);
  return NextResponse.json({ ok: true });
}
