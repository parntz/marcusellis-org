import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth-options";
import { deleteGig, getGigById, updateGig } from "../../../../lib/gigs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseGigId(context) {
  const raw = context.params?.id;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : 0;
}

export async function PUT(request, context) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = parseGigId(context);
  if (!id) {
    return NextResponse.json({ error: "Invalid gig id." }, { status: 400 });
  }

  const existing = await getGigById(id);
  if (!existing) {
    return NextResponse.json({ error: "Gig not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));

  try {
    const gig = await updateGig(id, body);
    return NextResponse.json({ gig });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Update failed." }, { status: 400 });
  }
}

export async function DELETE(_request, context) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = parseGigId(context);
  if (!id) {
    return NextResponse.json({ error: "Invalid gig id." }, { status: 400 });
  }

  const existing = await getGigById(id);
  if (!existing) {
    return NextResponse.json({ error: "Gig not found." }, { status: 404 });
  }

  await deleteGig(id);
  return NextResponse.json({ ok: true });
}
