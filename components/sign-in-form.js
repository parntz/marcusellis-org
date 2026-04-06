"use client";

import Link from "next/link";
import Script from "next/script";
import { signIn } from "next-auth/react";
import { useState } from "react";

async function getRecaptchaToken(action) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey || typeof window === "undefined" || !window.grecaptcha) {
    return "";
  }

  return new Promise((resolve) => {
    window.grecaptcha.ready(async () => {
      const token = await window.grecaptcha.execute(siteKey, { action });
      resolve(token);
    });
  });
}

export function SignInForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const hasRecaptcha = Boolean(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY);
  const hasGoogle = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

  const handleCredentialsSignIn = async (event) => {
    event.preventDefault();
    setPending(true);
    setError("");

    try {
      const recaptchaToken = await getRecaptchaToken("sign_in");
      if (!recaptchaToken) {
        setError("reCAPTCHA is not configured. Add NEXT_PUBLIC_RECAPTCHA_SITE_KEY.");
        setPending(false);
        return;
      }

      const result = await signIn("credentials", {
        identifier,
        password,
        recaptchaToken,
        redirect: false,
      });

      if (result?.error) {
        setError("Unable to sign in. Check your credentials or captcha.");
        setPending(false);
        return;
      }

      window.location.href = "/";
    } catch {
      setError("Unable to sign in right now.");
      setPending(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    await signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="auth-card">
      {hasRecaptcha ? (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
          strategy="afterInteractive"
        />
      ) : null}
      <h2>Sign In</h2>
      <p>
        {hasGoogle
          ? "Use your username/email and password, or continue with Google."
          : "Use your username/email and password to sign in."}
      </p>
      <form onSubmit={handleCredentialsSignIn} className="auth-form">
        <label>
          Username or Email
          <input
            type="text"
            autoComplete="username"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {error ? <p className="auth-error">{error}</p> : null}
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {hasGoogle ? (
        <button type="button" className="btn btn-secondary auth-google" onClick={handleGoogleSignIn}>
          Continue with Google
        </button>
      ) : null}
      <p className="auth-helper">
        Need an account? <Link href="/register">Create one</Link>
      </p>
    </div>
  );
}
