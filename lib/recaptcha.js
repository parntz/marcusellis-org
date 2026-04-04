const SITEVERIFY_ENDPOINT = "https://www.google.com/recaptcha/api/siteverify";

export async function verifyRecaptchaToken(token, expectedAction = "sign_in") {
  if (process.env.RECAPTCHA_BYPASS === "true") {
    return { ok: true, score: 1 };
  }

  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    return { ok: false, message: "Missing RECAPTCHA_SECRET_KEY." };
  }

  if (!token) {
    return { ok: false, message: "Missing reCAPTCHA token." };
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });

  const response = await fetch(SITEVERIFY_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    return { ok: false, message: "reCAPTCHA verification failed." };
  }

  const result = await response.json();
  const score = Number(result.score || 0);
  const action = String(result.action || "");
  const actionMatches = !expectedAction || action === expectedAction;
  const scorePasses = score >= 0.5 || process.env.RECAPTCHA_ALLOW_LOW_SCORE === "true";

  if (!result.success || !actionMatches || !scorePasses) {
    return { ok: false, message: "Suspicious sign-in attempt blocked by reCAPTCHA." };
  }

  return { ok: true, score };
}
