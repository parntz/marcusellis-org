import { NextResponse } from "next/server";
import { createAuthUser, findAuthUserByIdentifier, validatePassword } from "../../../../lib/auth-users";
import { verifyRecaptchaToken } from "../../../../lib/recaptcha";

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const username = String(body?.username || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    const recaptchaToken = String(body?.recaptchaToken || "");

    if (!username || !email || !password) {
      return NextResponse.json({ error: "Username, email, and password are required." }, { status: 400 });
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return NextResponse.json({ error: passwordCheck.message }, { status: 400 });
    }

    const captcha = await verifyRecaptchaToken(recaptchaToken, "register");
    if (!captcha.ok) {
      return NextResponse.json({ error: captcha.message }, { status: 400 });
    }

    const existingByUsername = await findAuthUserByIdentifier(username);
    const existingByEmail = await findAuthUserByIdentifier(email);
    if (existingByUsername || existingByEmail) {
      return NextResponse.json({ error: "User already exists. Try signing in." }, { status: 409 });
    }

    const user = await createAuthUser({ username, email, password });
    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to register right now." }, { status: 500 });
  }
}
