import { NextResponse } from "next/server";
import { getBaseUrlFromRequest } from "../../../../lib/auth-url.js";
import { createPasswordResetToken } from "../../../../lib/password-reset.js";
import { sendResendEmail } from "../../../../lib/resend-mail.js";

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    if (!email || !validateEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const reset = await createPasswordResetToken(email);
    if (reset?.token && reset.email) {
      const baseUrl = getBaseUrlFromRequest(request);
      const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(reset.token)}`;

      await sendResendEmail({
        to: reset.email,
        subject: "Reset your Nashville Musicians Association password",
        html: `
          <p>A password reset was requested for your account.</p>
          <p><a href="${resetUrl}">Reset your password</a></p>
          <p>This link expires in 1 hour. If you did not request a reset, you can ignore this email.</p>
        `,
        text: `A password reset was requested for your account.\n\nReset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you did not request a reset, you can ignore this email.`,
      });
    }

    return NextResponse.json({
      ok: true,
      message: "If that email address is on file, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password email failed", error);
    return NextResponse.json({ error: "Unable to send a reset email right now." }, { status: 500 });
  }
}
