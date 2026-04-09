import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../../lib/auth-options";
import { isAdminSession } from "../../../../../../lib/authz";
import {
  getPhotoGalleryItemById,
  updatePhotoGalleryItemById,
} from "../../../../../../lib/photo-gallery.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request, context) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const params = await context.params;
    return NextResponse.json(await getPhotoGalleryItemById(params?.id));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load gallery item." },
      { status: 400 }
    );
  }
}

export async function PUT(request, context) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const params = await context.params;
    const item = await updatePhotoGalleryItemById(params?.id, body);
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save gallery item." },
      { status: 400 }
    );
  }
}
