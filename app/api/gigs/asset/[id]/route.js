import path from "path";
import { NextResponse } from "next/server";
import { getGigUploadsStore } from "../../../../../lib/gig-image-storage.mjs";

export const runtime = "nodejs";

function guessContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const map = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".avif": "image/avif",
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

  const store = await getGigUploadsStore();
  if (store) {
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

  return NextResponse.redirect(new URL(`/uploads/gigs/${encodeURIComponent(id)}`, request.url));
}
