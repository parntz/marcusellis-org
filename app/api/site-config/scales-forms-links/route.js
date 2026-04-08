import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth-options";
import { isAdminSession } from "../../../../lib/authz";
import {
  getScalesFormsLinksConfig,
  setScalesFormsLinksConfig,
} from "../../../../lib/site-config-scales-forms-links";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ items: await getScalesFormsLinksConfig() });
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const items = await setScalesFormsLinksConfig(body?.items ?? body);
  return NextResponse.json({ items });
}
