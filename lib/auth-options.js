import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import {
  findAuthUserById,
  findAuthUserByIdentifier,
  upsertGoogleAuthUser,
  verifyUserPassword,
} from "./auth-users";
import { isLocalhostAuthEnabled, isLocalhostRequestLike } from "./localhost-auth";
import { verifyRecaptchaToken } from "./recaptcha";

const googleAuthEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";
const hasGoogleCredentials = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

const providers = [
  CredentialsProvider({
    id: "localhost-dev",
    name: "Localhost Admin",
    credentials: {},
    async authorize(_credentials, req) {
      if (!isLocalhostAuthEnabled() || !isLocalhostRequestLike(req)) {
        return null;
      }

      return {
        id: "localhost-admin",
        name: "Localhost Admin",
        email: "localhost-admin@localhost",
        role: "admin",
        memberPageId: null,
        memberPageSlug: "",
      };
    },
  }),
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      identifier: { label: "Username or Email", type: "text" },
      password: { label: "Password", type: "password" },
      recaptchaToken: { label: "reCAPTCHA", type: "text" },
    },
    async authorize(credentials) {
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
        role: user.role,
        memberPageId: user.memberPageId,
        memberPageSlug: user.memberPageSlug,
      };
    },
  }),
];

if (googleAuthEnabled && hasGoogleCredentials) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const authOptions = {
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/sign-in" },
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
      user.role = dbUser.role;
      user.memberPageId = dbUser.memberPageId;
      user.memberPageSlug = dbUser.memberPageSlug;
      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (account?.provider === "google") {
        const googleSub = String(profile?.sub || token.sub || "");
        const email = String(profile?.email || user?.email || token.email || "");
        const name = String(profile?.name || user?.name || token.name || "");
        const dbUser = await upsertGoogleAuthUser({ email, name, googleSub });

        if (dbUser) {
          token.userId = String(dbUser.id || "");
          token.sub = String(dbUser.id || token.sub || "");
          token.name = dbUser.username;
          token.email = dbUser.email;
          token.role = dbUser.role;
          token.memberPageId = dbUser.memberPageId;
          token.memberPageSlug = dbUser.memberPageSlug;
          return token;
        }
      }

      if (user) {
        token.userId = String(user.id || token.userId || token.sub || "");
        token.sub = String(user.id || token.sub || "");
        token.name = user.name;
        token.email = user.email;
        token.role = user.role || token.role || "member";
        token.memberPageId = user.memberPageId ?? token.memberPageId ?? null;
        token.memberPageSlug = user.memberPageSlug || token.memberPageSlug || "";
      }

      if (!user && token.userId) {
        const dbUser = await findAuthUserById(token.userId);
        if (dbUser) {
          token.sub = String(dbUser.id || token.sub || "");
          token.userId = String(dbUser.id || token.userId || "");
          token.name = dbUser.username;
          token.email = dbUser.email;
          token.role = dbUser.role;
          token.memberPageId = dbUser.memberPageId;
          token.memberPageSlug = dbUser.memberPageSlug;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.userId || token.sub || "");
        session.user.name = String(token.name || session.user.name || "");
        session.user.email = String(token.email || session.user.email || "");
        session.user.role = String(token.role || "member");
        session.user.memberPageId = token.memberPageId ? String(token.memberPageId) : "";
        session.user.memberPageSlug = String(token.memberPageSlug || "");
      }

      return session;
    },
  },
};
