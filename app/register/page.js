import { Footer } from "../../components/footer";
import { RegisterForm } from "../../components/register-form";
import { SiteHeader } from "../../components/site-header";

export const metadata = {
  title: "Create Account",
};

export default function RegisterPage() {
  return (
    <main className="page-shell">
      <SiteHeader />
      <article className="page-frame">
        <header className="page-header">
          <p className="page-kicker">Membership Login</p>
          <h2 className="page-title">Create Account</h2>
          <p className="page-summary">
            Choose a strong password to protect your account. reCAPTCHA is required before account
            creation.
          </p>
        </header>
        <section className="auth-layout auth-layout-single">
          <RegisterForm />
        </section>
      </article>
      <Footer />
    </main>
  );
}
