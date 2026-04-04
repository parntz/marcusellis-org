import Link from "next/link";
import { Footer } from "../../components/footer";
import { SignInForm } from "../../components/sign-in-form";
import { SiteHeader } from "../../components/site-header";

export const metadata = {
  title: "Sign In",
};

export default function SignInPage() {
  return (
    <main className="page-shell">
      <SiteHeader />
      <article className="page-frame">
        <header className="page-header">
          <p className="page-kicker">Member Access</p>
          <h2 className="page-title">Sign In</h2>
          <p className="page-summary">
            Secure sign-in with credentials, strong passwords, reCAPTCHA, and optional Google login.
          </p>
        </header>
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
      <Footer />
    </main>
  );
}
