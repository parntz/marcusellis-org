import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import {
  findAuthUserByIdentifier,
  upsertGoogleAuthUser,
  verifyUserPassword,
} from "./auth-users";
import { verifyRecaptchaToken } from "./recaptcha";

const providers = [
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
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
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
};
