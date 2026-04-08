import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth-options";
import { isAdminSession } from "../../../lib/authz";
import { createNewsEventsItem, listNewsEventsItems } from "../../../lib/news-events-items";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const items = await listNewsEventsItems(1000, "/news-and-events");
  return NextResponse.json({ items });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  try {
    const item = await createNewsEventsItem(body);
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Create failed." }, { status: 400 });
  }
}
