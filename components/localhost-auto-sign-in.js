"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function LocalhostAutoSignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/";

  useEffect(() => {
    void signIn("localhost-dev", { callbackUrl });
  }, [callbackUrl]);

  return (
    <div className="auth-card">
      <h2>Signing In</h2>
      <p>Signing you in as a local admin.</p>
    </div>
  );
}

export function LocalhostAutoSignIn() {
  return (
    <Suspense
      fallback={
        <div className="auth-card">
          <h2>Signing In</h2>
          <p>Preparing your local admin session.</p>
        </div>
      }
    >
      <LocalhostAutoSignInContent />
    </Suspense>
  );
}
