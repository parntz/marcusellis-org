"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function ResetPasswordFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = String(searchParams?.get("token") || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("This reset link is missing a token.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data?.error || "Unable to reset password.");
        setPending(false);
        return;
      }

      setSuccess("Password updated. You can sign in now.");
      setPassword("");
      setConfirmPassword("");
      setPending(false);
      router.refresh();
    } catch {
      setError("Unable to reset password right now.");
      setPending(false);
    }
  };

  return (
    <div className="auth-card auth-card--narrow">
      <h2>Reset Password</h2>
      <p>Choose a new password for your account.</p>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          New Password
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        <label>
          Confirm Password
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </label>
        {error ? <p className="auth-error">{error}</p> : null}
        {success ? <p className="auth-success">{success}</p> : null}
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving..." : "Reset Password"}
        </button>
      </form>
      <p className="auth-helper">
        <Link href="/sign-in">Back to sign in</Link>
      </p>
    </div>
  );
}

export function ResetPasswordForm() {
  return (
    <Suspense
      fallback={
        <div className="auth-card auth-card--narrow">
          <h2>Reset Password</h2>
          <p>Loading reset form...</p>
        </div>
      }
    >
      <ResetPasswordFormContent />
    </Suspense>
  );
}
