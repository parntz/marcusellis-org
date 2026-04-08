import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth-options";
import { isAdminSession } from "../../../../../lib/authz";

export const runtime = "nodejs";

function safeFilename(name) {
  const ext = (name || "").split(".").pop() || "jpg";
  return /^[a-z0-9]+$/i.test(ext) ? ext.toLowerCase() : "jpg";
}

function canUseNetlifyBlobs() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function canWriteLocalUploads() {
  return !process.env.NETLIFY;
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file.arrayBuffer !== "function") {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const mime = typeof file.type === "string" && file.type.startsWith("image/") ? file.type : "image/jpeg";
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 8MB)" }, { status: 413 });
  }

  const ext = safeFilename(file.name);
  const id = `${randomUUID()}.${ext}`;

  if (canUseNetlifyBlobs()) {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore("recording-page-uploads");
    await store.set(id, buf, { metadata: { contentType: mime } });
    return NextResponse.json({ url: `/api/site-config/recording-page/asset/${encodeURIComponent(id)}` });
  }

  if (canWriteLocalUploads()) {
    const dir = path.join(process.cwd(), "public", "uploads", "recording-page");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, id), buf);
    return NextResponse.json({ url: `/uploads/recording-page/${id}` });
  }

  return NextResponse.json(
    {
      error:
        "Recording image uploads require Netlify Blobs. In the Netlify dashboard, enable Blobs for this site so BLOB_READ_WRITE_TOKEN is available, or run the site locally.",
    },
    { status: 503 }
  );
}
