import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth-options";
import { isAdminSession } from "../../../lib/authz";
import { createMemberSiteLink, listMemberSiteLinks } from "../../../lib/member-site-links";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const links = await listMemberSiteLinks();
  return NextResponse.json({ links });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  try {
    const link = await createMemberSiteLink(body);
    return NextResponse.json({ link });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Create failed." }, { status: 400 });
  }
}
