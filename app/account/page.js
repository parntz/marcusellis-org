import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Footer } from "../../components/footer";
import { SiteHeader } from "../../components/site-header";
import { authOptions } from "../../lib/auth-options";

export const metadata = {
  title: "Account",
};

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  return (
    <main className="page-shell">
      <SiteHeader />
      <article className="page-frame">
        <header className="page-header">
          <p className="page-kicker">Member Account</p>
          <h2 className="page-title">Welcome Back</h2>
          <p className="page-summary">You are signed in as {session.user.email}.</p>
        </header>
        <section className="page-content">
          <h3>Account Overview</h3>
          <p>Signed in user: {session.user.name || session.user.email}</p>
          <p>User ID: {session.user.id}</p>
        </section>
      </article>
      <Footer />
    </main>
  );
}
