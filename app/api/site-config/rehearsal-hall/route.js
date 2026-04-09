import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth-options";
import { isAdminSession } from "../../../../lib/authz";
import {
  getRehearsalHallHeroConfig,
  setRehearsalHallHeroConfig,
} from "../../../../lib/site-config-rehearsal-hall";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getRehearsalHallHeroConfig());
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const current = await getRehearsalHallHeroConfig();
  const config = await setRehearsalHallHeroConfig({ ...current, ...body });
  return NextResponse.json(config);
}
