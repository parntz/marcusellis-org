import Link from "next/link";
import { headers } from "next/headers";
import { LocalhostAutoSignIn } from "../../components/localhost-auto-sign-in";
import { PageHeaderWithCallout } from "../../components/page-header-with-callout";
import { SignInForm } from "../../components/sign-in-form";
import { INTERNAL_PAGE_DESCRIPTION } from "../../lib/internal-page-description.js";
import { isLocalhostAuthEnabled, isLocalhostRequestLike } from "../../lib/localhost-auth";

export const metadata = {
  title: "Sign In",
};

export default async function SignInPage() {
  const hasGoogle = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";
  const requestHeaders = await headers();
  const isLocalhost = isLocalhostAuthEnabled() && isLocalhostRequestLike({ headers: requestHeaders });

  return (
    <article className="page-frame">
      <PageHeaderWithCallout route="/sign-in" title="Sign In" description={INTERNAL_PAGE_DESCRIPTION.SIGN_IN} />
      <section className="auth-layout">
        {isLocalhost ? <LocalhostAutoSignIn /> : <SignInForm />}
        <aside className="auth-side">
          <h3>Need an account?</h3>
          <p>
            {hasGoogle
              ? "Register with a strong password or sign in with Google."
              : "Register with a strong password to create your account."}
          </p>
          <Link href="/register" className="btn btn-secondary">
            Create Account
          </Link>
        </aside>
      </section>
    </article>
  );
}
