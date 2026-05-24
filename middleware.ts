import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Proteksi untuk role Manajemen
    if (path.startsWith("/manajemen") && token?.role !== "MANAJEMEN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Proteksi untuk role Teknisi (Asumsi halaman teknisi ada di /teknisi)
    if (path.startsWith("/teknisi") && token?.role !== "TEKNISI") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  },
  {
    callbacks: {
      // Middleware hanya berjalan jika token ada
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  // Semua halaman diproteksi kecuali api, _next/static, login, dan asset public
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|login|public).*)",
  ],
};
