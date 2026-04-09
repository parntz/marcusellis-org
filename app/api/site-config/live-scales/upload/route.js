import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth-options";
import { isAdminSession } from "../../../../../lib/authz";

export const runtime = "nodejs";

function canUseNetlifyBlobs() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function canWriteLocalUploads() {
  return !process.env.NETLIFY;
}

function safePdfFilename(name) {
  const ext = (name || "").split(".").pop() || "pdf";
  return String(ext).toLowerCase() === "pdf" ? "pdf" : "";
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

  const ext = safePdfFilename(file.name);
  const mime = typeof file.type === "string" ? file.type.toLowerCase() : "";
  if (ext !== "pdf" && mime !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF uploads are supported." }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 20MB)" }, { status: 413 });
  }

  const id = `${randomUUID()}.pdf`;

  if (canUseNetlifyBlobs()) {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore("live-scales-uploads");
    await store.set(id, buf, { metadata: { contentType: "application/pdf" } });
    return NextResponse.json({ url: `/api/site-config/live-scales/asset/${encodeURIComponent(id)}` });
  }

  if (canWriteLocalUploads()) {
    const dir = path.join(process.cwd(), "public", "uploads", "live-scales");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, id), buf);
    return NextResponse.json({ url: `/uploads/live-scales/${id}` });
  }

  return NextResponse.json(
    {
      error:
        "Live scales PDF uploads require Netlify Blobs. Enable Blobs for this site so BLOB_READ_WRITE_TOKEN is available, or run the site locally.",
    },
    { status: 503 }
  );
}
