import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth-options";
import { isAdminSession } from "../../../../../lib/authz";
import { getArtistBandProfileBySlug } from "../../../../../lib/find-artist-directory.mjs";

export const runtime = "nodejs";

function safeFilename(name) {
  const ext = (name || "").split(".").pop() || "bin";
  return /^[a-z0-9]+$/i.test(ext) ? ext.toLowerCase() : "bin";
}

function canUseNetlifyBlobs() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function canWriteLocalUploads() {
  return !process.env.NETLIFY;
}

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await params;
  const slug = String(resolvedParams?.slug || "").trim();
  const profile = await getArtistBandProfileBySlug(slug);
  if (!profile) {
    return NextResponse.json({ error: "Artist profile not found." }, { status: 404 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file.arrayBuffer !== "function") {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const mime = typeof file.type === "string" && /^image\//.test(file.type) ? file.type : "application/octet-stream";
  if (!/^image\//.test(mime)) {
    return NextResponse.json({ error: "Only image uploads are supported." }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > 16 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 16MB)" }, { status: 413 });
  }

  const ext = safeFilename(file.name);
  const id = `${randomUUID()}.${ext}`;

  if (canUseNetlifyBlobs()) {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore("artist-band-profile-media");
    await store.set(id, buf, { metadata: { contentType: mime } });
    return NextResponse.json({
      url: `/api/artist-band-profiles/asset/${encodeURIComponent(id)}`,
      mimeType: mime,
    });
  }

  if (canWriteLocalUploads()) {
    const dir = path.join(process.cwd(), "public", "uploads", "artist-band-profiles");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, id), buf);
    return NextResponse.json({
      url: `/uploads/artist-band-profiles/${id}`,
      mimeType: mime,
    });
  }

  return NextResponse.json(
    {
      error:
        "Artist profile image uploads require Netlify Blobs. Enable Blobs for this site so BLOB_READ_WRITE_TOKEN is available, or run the site locally.",
    },
    { status: 503 }
  );
}
