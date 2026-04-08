import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth-options";
import { isAdminSession } from "../../../../lib/authz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function readGoogleMapsApiKey() {
  const value = String(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "").trim();
  return value && value.toLowerCase() !== "undefined" ? value : "";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    { apiKey: readGoogleMapsApiKey() },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
