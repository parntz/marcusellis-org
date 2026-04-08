import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth-options";
import { isAdminSession } from "../../../lib/authz";
import { createGig, listAllGigs, listUpcomingGigs } from "../../../lib/gigs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope");

  if (scope === "all") {
    if (!isAdminSession(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const gigs = await listAllGigs();
    return NextResponse.json({ gigs });
  }

  const gigs = await listUpcomingGigs();
  return NextResponse.json({ gigs });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  try {
    const gig = await createGig(body);
    return NextResponse.json({ gig });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Create failed." }, { status: 400 });
  }
}
