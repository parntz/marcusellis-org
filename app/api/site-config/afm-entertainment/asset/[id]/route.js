import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function guessContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const map = {
    ".avif": "image/avif",
    ".gif": "image/gif",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
  };
  return map[ext] || "application/octet-stream";
}

function isSafeAssetId(id) {
  return typeof id === "string" && id.length > 0 && id.length < 200 && !/[\\/]/.test(id) && !id.includes("..");
}

export async function GET(request, context) {
  const params = await context.params;
  const raw = params?.id;
  const id = typeof raw === "string" ? decodeURIComponent(raw) : "";
  if (!isSafeAssetId(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!process.env.NETLIFY) {
    return NextResponse.redirect(new URL(`/uploads/afm-entertainment/${encodeURIComponent(id)}`, request.url));
  }

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore("afm-entertainment-uploads");
    const result = await store.getWithMetadata(id, { type: "arrayBuffer" });
    if (!result?.data || result.data.byteLength === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const contentType =
      (result.metadata && typeof result.metadata.contentType === "string" && result.metadata.contentType) ||
      guessContentType(id);
    return new NextResponse(result.data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
