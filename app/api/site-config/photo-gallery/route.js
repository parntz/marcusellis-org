import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth-options";
import { isAdminSession } from "../../../../lib/authz";
import {
  getPhotoGalleryPageConfig,
  setPhotoGalleryPageConfig,
} from "../../../../lib/photo-gallery.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getPhotoGalleryPageConfig());
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const current = await getPhotoGalleryPageConfig();
  const config = await setPhotoGalleryPageConfig({ ...current, ...body });
  return NextResponse.json(config);
}
