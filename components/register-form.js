"use client";

import Link from "next/link";
import Script from "next/script";
import { signIn } from "next-auth/react";
import { useMemo, useState } from "react";

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

function passwordChecklist(password) {
  return [
    { label: "At least 12 characters", ok: password.length >= 12 },
    { label: "One uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "One lowercase letter", ok: /[a-z]/.test(password) },
    { label: "One number", ok: /[0-9]/.test(password) },
    { label: "One symbol", ok: /[^A-Za-z0-9]/.test(password) },
  ];
}

export function RegisterForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const hasRecaptcha = Boolean(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY);
  const checks = useMemo(() => passwordChecklist(password), [password]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setPending(true);
    setError("");

    try {
      const recaptchaToken = await getRecaptchaToken("register");
      if (!recaptchaToken) {
        setError("reCAPTCHA is not configured. Add NEXT_PUBLIC_RECAPTCHA_SITE_KEY.");
        setPending(false);
        return;
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          password,
          recaptchaToken,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || "Could not create account.");
        setPending(false);
        return;
      }

      const loginToken = await getRecaptchaToken("sign_in");
      await signIn("credentials", {
        identifier: email,
        password,
        recaptchaToken: loginToken,
        redirect: false,
      });
      window.location.href = "/";
    } catch {
      setError("Unable to register right now.");
      setPending(false);
    }
  };

  return (
    <div className="auth-card">
      {hasRecaptcha ? (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
          strategy="afterInteractive"
        />
      ) : null}
      <h2>Create Account</h2>
      <p>Use a strong password and complete reCAPTCHA to create your account.</p>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Username
          <input
            type="text"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </label>
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        <ul className="password-rules">
          {checks.map((check) => (
            <li key={check.label} className={check.ok ? "ok" : ""}>
              {check.label}
            </li>
          ))}
        </ul>
        {error ? <p className="auth-error">{error}</p> : null}
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Creating..." : "Create Account"}
        </button>
      </form>
      <p className="auth-helper">
        Already have an account? <Link href="/sign-in">Sign in</Link>
      </p>
    </div>
  );
}
