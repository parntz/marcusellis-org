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
  const requestHeaders = await headers();
  const isLocalhost = isLocalhostAuthEnabled() && isLocalhostRequestLike({ headers: requestHeaders });

  return (
    <article className="page-frame">
      <PageHeaderWithCallout route="/sign-in" title="Sign In" description={INTERNAL_PAGE_DESCRIPTION.SIGN_IN} />
      <section className="auth-layout auth-layout-single">
        {isLocalhost ? <LocalhostAutoSignIn /> : <SignInForm />}
      </section>
    </article>
  );
}
