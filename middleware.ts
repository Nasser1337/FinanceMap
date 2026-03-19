export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    /*
     * Protect everything except:
     * - /login
     * - /api/auth (NextAuth endpoints)
     * - /_next (Next.js internals)
     * - /logo.png, /favicon.ico (static assets)
     */
    "/((?!login|api/auth|_next|logo\\.png|favicon\\.ico).*)",
  ],
};
