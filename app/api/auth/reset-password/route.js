import { NextResponse } from "next/server";
import { consumePasswordResetToken } from "../../../../../lib/password-reset.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const token = String(body?.token || "").trim();
    const password = String(body?.password || "");

    if (!token || !password) {
      return NextResponse.json({ error: "Reset token and password are required." }, { status: 400 });
    }

    const result = await consumePasswordResetToken(token, password);
    if (!result.ok) {
      return NextResponse.json({ error: result.error || "Unable to reset password." }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to reset password right now." }, { status: 500 });
  }
}
