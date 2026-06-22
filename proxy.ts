import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read session cookie set by AuthContext on login
  const userCookie = request.cookies.get("euroziel_user");

  const isLoggedIn = !!userCookie?.value;
  let role: string | null = null;

  if (isLoggedIn) {
    try {
      const parsed = JSON.parse(decodeURIComponent(userCookie!.value));
      role = parsed.role ?? null;
    } catch {
      role = null;
    }
  }

  // Public routes — always accessible
  if (pathname.startsWith("/login") || pathname.startsWith("/redirect")) {
    return NextResponse.next();
  }

  // Root "/" → let page.tsx handle the redirect to /redirect
  if (pathname === "/") {
    return NextResponse.next();
  }

  // Not logged in → redirect to login
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Student trying to access /admin → redirect to student dashboard
  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/student", request.url));
  }

  // Admin trying to access /student → redirect to admin dashboard
  if (pathname.startsWith("/student") && role !== "student") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\..*).*)",
  ],
};
