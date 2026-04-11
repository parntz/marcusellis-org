"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import { signIn } from "next-auth/react";
import { Suspense, useState } from "react";
import { ModalLightbox } from "./modal-lightbox";

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

function SignInFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [resetPending, setResetPending] = useState(false);
  const [pending, setPending] = useState(false);
  const hasRecaptcha = Boolean(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY);
  const hasGoogle = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";
  const callbackUrl = searchParams?.get("callbackUrl") || "/";

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
        callbackUrl,
      });

      if (result?.error) {
        setError("Unable to sign in. Check your credentials or captcha.");
        setPending(false);
        return;
      }

      router.push(result?.url || callbackUrl);
      router.refresh();
    } catch {
      setError("Unable to sign in right now.");
      setPending(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    await signIn("google", { callbackUrl });
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    setResetError("");
    setResetSuccess("");
    setResetPending(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setResetError(data?.error || "Unable to send a reset email.");
        setResetPending(false);
        return;
      }

      setResetSuccess(data?.message || "If that email exists, a reset link has been sent.");
      setResetPending(false);
    } catch {
      setResetError("Unable to send a reset email right now.");
      setResetPending(false);
    }
  };

  return (
    <>
      <div className="auth-card auth-card--narrow">
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
          <button
            type="button"
            className="auth-inline-link"
            onClick={() => {
              setResetOpen(true);
              setResetError("");
              setResetSuccess("");
            }}
          >
            Forgot password?
          </button>
        </p>
      </div>

      <ModalLightbox open={resetOpen} onClose={() => setResetOpen(false)}>
        <div className="auth-reset-modal" role="dialog" aria-modal="true" aria-label="Forgot password">
          <div className="auth-reset-modal__header">
            <p className="recording-sidebar-modal__eyebrow">Account Access</p>
            <h3>Reset your password</h3>
            <p>Enter your email address and we&apos;ll send you a reset link.</p>
          </div>
          <form className="auth-form" onSubmit={handleForgotPassword}>
            <label>
              Email Address
              <input
                type="email"
                autoComplete="email"
                value={resetEmail}
                onChange={(event) => setResetEmail(event.target.value)}
                required
              />
            </label>
            {resetError ? <p className="auth-error">{resetError}</p> : null}
            {resetSuccess ? <p className="auth-success">{resetSuccess}</p> : null}
            <div className="auth-reset-modal__actions">
              <button type="submit" className="btn btn-primary" disabled={resetPending}>
                {resetPending ? "Sending..." : "Send Reset Link"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setResetOpen(false)}>
                Close
              </button>
            </div>
          </form>
        </div>
      </ModalLightbox>
    </>
  );
}

export function SignInForm() {
  return (
    <Suspense
      fallback={
        <div className="auth-card">
          <h2>Sign In</h2>
          <p>Loading sign-in form...</p>
        </div>
      }
    >
      <SignInFormContent />
    </Suspense>
  );
}
