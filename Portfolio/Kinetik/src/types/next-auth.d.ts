import type { DefaultSession } from "next-auth";

// Make `session.user.id` available and typed across the app.
declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}
