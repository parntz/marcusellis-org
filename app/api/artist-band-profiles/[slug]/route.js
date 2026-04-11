import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth-options";
import { isAdminSession } from "../../../../lib/authz";
import { getArtistBandProfileBySlug, updateArtistBandProfileBySlug } from "../../../../lib/find-artist-directory.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await params;
  const slug = String(resolvedParams?.slug || "").trim();
  const existing = await getArtistBandProfileBySlug(slug);
  if (!existing) {
    return NextResponse.json({ error: "Artist profile not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));

  try {
    const profile = await updateArtistBandProfileBySlug(existing.slug, body);
    return NextResponse.json({ profile });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Save failed." }, { status: 400 });
  }
}
