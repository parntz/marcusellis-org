import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth-options";
import {
  deleteNewsEventsItem,
  getNewsEventsItemById,
  updateNewsEventsItem,
} from "../../../../lib/news-events-items";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseNewsEventsItemId(context) {
  const raw = context.params?.id;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : 0;
}

export async function PUT(request, context) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = parseNewsEventsItemId(context);
  if (!id) {
    return NextResponse.json({ error: "Invalid item id." }, { status: 400 });
  }

  const existing = await getNewsEventsItemById(id);
  if (!existing) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));

  try {
    const item = await updateNewsEventsItem(id, body);
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Update failed." }, { status: 400 });
  }
}

export async function DELETE(_request, context) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = parseNewsEventsItemId(context);
  if (!id) {
    return NextResponse.json({ error: "Invalid item id." }, { status: 400 });
  }

  const existing = await getNewsEventsItemById(id);
  if (!existing) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }

  await deleteNewsEventsItem(id);
  return NextResponse.json({ ok: true });
}
