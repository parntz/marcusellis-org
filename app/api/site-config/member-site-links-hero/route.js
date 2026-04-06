import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth-options";
import {
  getMemberSiteLinksHeroConfig,
  setMemberSiteLinksHeroConfig,
} from "../../../../lib/site-config-member-site-links-hero";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getMemberSiteLinksHeroConfig());
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const config = await setMemberSiteLinksHeroConfig(body);
  return NextResponse.json(config);
}
