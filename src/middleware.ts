import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;
  const isAuthPage = nextUrl.pathname.startsWith("/login") ||
                     nextUrl.pathname.startsWith("/register");
  const isAdminPage = nextUrl.pathname.startsWith("/admin");
  const isDashboard = nextUrl.pathname.startsWith("/dashboard") ||
                      nextUrl.pathname.startsWith("/animales") ||
                      nextUrl.pathname.startsWith("/potreros") ||
                      nextUrl.pathname.startsWith("/croquis") ||
                      nextUrl.pathname.startsWith("/cultivos") ||
                      nextUrl.pathname.startsWith("/tareas") ||
                      nextUrl.pathname.startsWith("/reportes") ||
                      nextUrl.pathname.startsWith("/configuracion") ||
                      nextUrl.pathname.startsWith("/peones") ||
                      nextUrl.pathname.startsWith("/inventario") ||
                      nextUrl.pathname.startsWith("/lotes") ||
                      nextUrl.pathname.startsWith("/calendario");

  if (isAdminPage) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", nextUrl));
    if ((session?.user as any)?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
  }

  if (isDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)",
  ],
};

