import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth-options";
import { isAdminSession } from "../../../../lib/authz";
import {
  getNewUseReuseIntroInnerForAdmin,
  updateNewUseReuseIntro,
} from "../../../../lib/new-use-reuse-intro.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return unauthorized();
  }

  try {
    const data = await getNewUseReuseIntroInnerForAdmin("");
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unable to load New Use / Reuse intro." },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return unauthorized();
  }

  const body = await request.json().catch(() => ({}));
  if (body.introHtml === undefined) {
    return NextResponse.json({ error: "Expected introHtml." }, { status: 400 });
  }

  try {
    const data = await updateNewUseReuseIntro(body.introHtml);
    return NextResponse.json({ ok: true, ...data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Save failed." },
      { status: 400 }
    );
  }
}
