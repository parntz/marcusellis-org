import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth-options";
import { isAdminSession } from "../../../../lib/authz";
import { getAboutUsIntro, updateAboutUsIntro } from "../../../../lib/about-us-intro.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await getAboutUsIntro();
    return NextResponse.json({ body });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load intro." },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const reqBody = await request.json().catch(() => ({}));
  const body = typeof reqBody.body === "string" ? reqBody.body : null;
  if (body === null) {
    return NextResponse.json({ error: "Expected { body: string }." }, { status: 400 });
  }
  try {
    const saved = await updateAboutUsIntro(body);
    return NextResponse.json({ ok: true, body: saved });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Save failed." },
      { status: 400 }
    );
  }
}
