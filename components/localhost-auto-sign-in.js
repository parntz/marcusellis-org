"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function LocalhostAutoSignIn() {
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
