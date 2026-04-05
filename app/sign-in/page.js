import Link from "next/link";
import { PageHeaderWithCallout } from "../../components/page-header-with-callout";
import { SignInForm } from "../../components/sign-in-form";
import { INTERNAL_PAGE_DESCRIPTION } from "../../lib/internal-page-description.js";

export const metadata = {
  title: "Sign In",
};

export default async function SignInPage() {
  return (
    <article className="page-frame">
      <PageHeaderWithCallout route="/sign-in" title="Sign In" description={INTERNAL_PAGE_DESCRIPTION.SIGN_IN} />
      <section className="auth-layout">
        <SignInForm />
        <aside className="auth-side">
          <h3>Need an account?</h3>
          <p>Register with a strong password or sign in with Google.</p>
          <Link href="/register" className="btn btn-secondary">
            Create Account
          </Link>
        </aside>
      </section>
    </article>
  );
}
