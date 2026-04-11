import { PageHeaderWithCallout } from "../../components/page-header-with-callout";
import { ResetPasswordForm } from "../../components/reset-password-form";

export const metadata = {
  title: "Reset Password",
};

export default function ResetPasswordPage() {
  return (
    <article className="page-frame">
      <PageHeaderWithCallout
        route="/sign-in"
        title="Reset Password"
        description="Choose a new password to regain access to your account."
      />
      <section className="auth-layout auth-layout-single">
        <ResetPasswordForm />
      </section>
    </article>
  );
}
