import { PageHeaderWithCallout } from "../../components/page-header-with-callout";
import { RegisterForm } from "../../components/register-form";
import { INTERNAL_PAGE_DESCRIPTION } from "../../lib/internal-page-description.js";

export const metadata = {
  title: "Create Account",
};

export default async function RegisterPage() {
  return (
    <article className="page-frame">
      <PageHeaderWithCallout
        route="/register"
        title="Create Account"
        description={INTERNAL_PAGE_DESCRIPTION.REGISTER}
      />
      <section className="auth-layout auth-layout-single">
        <RegisterForm />
      </section>
    </article>
  );
}
