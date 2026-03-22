export { default as proxy } from "next-auth/middleware";

export const config = {
  matcher: [
    // Protect all routes EXCEPT: api routes, static files, favicon, login, signup
    "/((?!api|_next/static|_next/image|favicon.ico|login|signup).*)",
  ],
};
