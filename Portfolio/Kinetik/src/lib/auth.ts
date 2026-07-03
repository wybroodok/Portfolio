import NextAuth, { type NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import { db } from "@/lib/db";

// Only register OAuth providers that are actually configured, so a dev running
// without GitHub creds doesn't hit a runtime error on every request.
const providers: NextAuthConfig["providers"] = [
  Credentials({
    credentials: { email: {}, password: {} },
    authorize: async (creds) => {
      const email = String(creds?.email ?? "").toLowerCase();
      if (!email) return null;
      const user = await db.user.findUnique({ where: { email } });
      if (!user) return null;

      // PRODUCTION: verify creds.password against user.hashedPassword (argon2).
      // DEV: seeded users have no password, so we accept email-only sign-in.
      if (process.env.NODE_ENV === "production") {
        // TODO: implement password verification before going live.
        return null;
      }
      return { id: user.id, name: user.name, email: user.email, image: user.image };
    },
  }),
];
if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(GitHub);
}

/**
 * Auth.js (NextAuth v5) config. Exposes `auth()` for use in Server Components,
 * Server Actions and Route Handlers, plus `signIn` / `signOut`.
 *
 * NOTE: password hashing/verification (e.g. argon2) is elided here for brevity;
 * wire it into the Credentials `authorize` callback.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    // With the JWT strategy we carry the user id in the token and expose it on
    // the session, so `session.user.id` is available in Server Components.
    jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
