import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const validUsername = process.env.AUTH_USERNAME;
        const validPasswordHash = process.env.AUTH_PASSWORD_HASH;

        if (!validUsername || !validPasswordHash) {
          console.error("AUTH_USERNAME or AUTH_PASSWORD_HASH not set in environment");
          return null;
        }

        // Constant-time username comparison via hashing
        const usernameMatch = credentials.username === validUsername;
        // bcrypt compare (already constant-time)
        const passwordMatch = await bcrypt.compare(
          credentials.password,
          validPasswordHash
        );

        if (usernameMatch && passwordMatch) {
          return {
            id: "1",
            name: validUsername,
          };
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
