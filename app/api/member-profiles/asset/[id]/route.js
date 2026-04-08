import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getContentType(id = "") {
  const ext = String(id).split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg"].includes(ext)) return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "gif") return "image/gif";
  if (ext === "webp") return "image/webp";
  if (ext === "svg") return "image/svg+xml";
  if (ext === "mp4") return "video/mp4";
  if (ext === "webm") return "video/webm";
  if (ext === "mov") return "video/quicktime";
  return "application/octet-stream";
}

export async function GET(_request, { params }) {
  const resolvedParams = await params;
  const id = String(resolvedParams?.id || "").trim();
  if (!id || id.includes("/") || id.includes("\\")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const localPath = path.join(process.cwd(), "public", "uploads", "member-profiles", id);
  if (fs.existsSync(localPath)) {
    const body = fs.readFileSync(localPath);
    return new NextResponse(body, {
      headers: {
        "Content-Type": getContentType(id),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore("member-profile-media");
    const blob = await store.get(id, { type: "arrayBuffer", consistency: "strong" });
    if (blob) {
      const meta = await store.getMetadata(id);
      return new NextResponse(Buffer.from(blob), {
        headers: {
          "Content-Type": meta?.contentType || getContentType(id),
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  }

  return new NextResponse("Not found", { status: 404 });
}
