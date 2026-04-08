import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth-options";
import { isAdminSession } from "../../../../lib/authz";
import { storeGigImageBuffer } from "../../../../lib/gig-image-storage.mjs";

export const runtime = "nodejs";

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

  try {
    const url = await storeGigImageBuffer(buf, {
      mimeType: mime,
      filename: file.name,
    });
    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Gig upload failed.",
      },
      { status: 503 }
    );
  }
}
