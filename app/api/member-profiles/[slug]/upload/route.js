import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth-options";
import { canEditMemberPage } from "../../../../../lib/authz";
import { getMemberProfileBySlug } from "../../../../../lib/member-profiles";

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

function normalizeMediaType(mime) {
  return typeof mime === "string" && mime.startsWith("video/") ? "video" : "image";
}

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await params;
  const slug = String(resolvedParams?.slug || "").trim();
  const profile = await getMemberProfileBySlug(slug);
  if (!profile) {
    return NextResponse.json({ error: "Member profile not found." }, { status: 404 });
  }

  if (!canEditMemberPage(session.user, profile)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file.arrayBuffer !== "function") {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const mime = typeof file.type === "string" && /^(image|video)\//.test(file.type) ? file.type : "application/octet-stream";
  const mediaType = normalizeMediaType(mime);
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > 64 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 64MB)" }, { status: 413 });
  }

  const ext = safeFilename(file.name);
  const id = `${randomUUID()}.${ext}`;

  if (canUseNetlifyBlobs()) {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore("member-profile-media");
    await store.set(id, buf, { metadata: { contentType: mime } });
    return NextResponse.json({
      url: `/api/member-profiles/asset/${encodeURIComponent(id)}`,
      mediaType,
      mimeType: mime,
    });
  }

  if (canWriteLocalUploads()) {
    const dir = path.join(process.cwd(), "public", "uploads", "member-profiles");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, id), buf);
    return NextResponse.json({
      url: `/uploads/member-profiles/${id}`,
      mediaType,
      mimeType: mime,
    });
  }

  return NextResponse.json(
    {
      error:
        "Member media uploads require Netlify Blobs. In the Netlify dashboard, enable Blobs for this site so BLOB_READ_WRITE_TOKEN is available, or run the site locally.",
    },
    { status: 503 }
  );
}
