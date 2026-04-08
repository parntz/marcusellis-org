import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { PageHeaderWithCallout } from "../../components/page-header-with-callout";
import { authOptions } from "../../lib/auth-options";
import { isAdminSession } from "../../lib/authz";
import { INTERNAL_PAGE_DESCRIPTION } from "../../lib/internal-page-description.js";

export const metadata = {
  title: "Account",
};

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const isAdmin = isAdminSession(session);

  return (
    <article className="page-frame">
      <PageHeaderWithCallout route="/account" title="Welcome Back" description={INTERNAL_PAGE_DESCRIPTION.ACCOUNT} />
      <section className="page-content">
        <h3>Account Overview</h3>
        <p>Signed in as {session.user.email}</p>
        <p>User ID: {session.user.id}</p>
        <p>Role: {session.user.role || "member"}</p>
        {!isAdmin && session.user.memberPageSlug ? (
          <p>
            Your profile page:{" "}
            <Link href={`/users/${session.user.memberPageSlug}`} className="text-link">
              /users/{session.user.memberPageSlug}
            </Link>
          </p>
        ) : null}
        {!isAdmin && !session.user.memberPageSlug ? (
          <p>This account does not have a member profile assigned yet.</p>
        ) : null}
      </section>
    </article>
  );
}
