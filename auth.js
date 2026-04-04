import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import {
  findAuthUserByIdentifier,
  upsertGoogleAuthUser,
  verifyUserPassword,
} from "./lib/auth-users";
import { verifyRecaptchaToken } from "./lib/recaptcha";

const providers = [
  Credentials({
    name: "Credentials",
    credentials: {
      identifier: {},
      password: {},
      recaptchaToken: {},
    },
    authorize: async (credentials) => {
      const identifier = String(credentials?.identifier || "").trim();
      const password = String(credentials?.password || "");
      const recaptchaToken = String(credentials?.recaptchaToken || "");

      if (!identifier || !password) {
        return null;
      }

      const captcha = await verifyRecaptchaToken(recaptchaToken, "sign_in");
      if (!captcha.ok) {
        return null;
      }

      const user = await findAuthUserByIdentifier(identifier);
      if (!user || !verifyUserPassword(user, password)) {
        return null;
      }

      return {
        id: String(user.id),
        name: user.username,
        email: user.email,
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
  },
  providers,
  callbacks: {
    async signIn({ account, profile, user }) {
      if (account?.provider !== "google") {
        return true;
      }

      const googleSub = String(profile?.sub || "");
      const email = String(profile?.email || user?.email || "");
      const name = String(profile?.name || user?.name || "");

      const dbUser = await upsertGoogleAuthUser({ email, name, googleSub });
      if (!dbUser) {
        return false;
      }

      user.id = dbUser.id;
      user.name = dbUser.username;
      user.email = dbUser.email;
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.name = user.name;
        token.email = user.email;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.userId || "");
        session.user.name = String(token.name || session.user.name || "");
        session.user.email = String(token.email || session.user.email || "");
      }

      return session;
    },
  },
});
