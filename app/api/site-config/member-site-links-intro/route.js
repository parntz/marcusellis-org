import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth-options";
import {
  getMemberSiteLinksIntroConfig,
  setMemberSiteLinksIntroConfig,
} from "../../../../lib/site-config-member-site-links-intro";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const defaults = { html: String(searchParams.get("defaultHtml") || "") };
  return NextResponse.json(await getMemberSiteLinksIntroConfig(defaults));
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const defaults = { html: String(body?.defaultHtml || "") };
  const config = await setMemberSiteLinksIntroConfig(body, defaults);
  return NextResponse.json(config);
}
