import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const publicRoutes = ["/login", "/register", "/verify", "/forgot-password"];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && isPublicRoute) {
    // Redirect logged-in users away from auth pages
    return redirectToDashboard(token.role, request);
  }

  // Protect admin routes
  if (pathname.startsWith("/dashboard") && token?.role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Protect seller routes
  if (pathname.startsWith("/seller-dashboard") && token?.role !== "seller") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Protect bidder routes
  if (pathname.startsWith("/account") && token?.role !== "bidder") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

function redirectToDashboard(role: string, request: NextRequest) {
  if (role === "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (role === "seller") {
    return NextResponse.redirect(new URL("/seller-dashboard", request.url));
  }
  return NextResponse.redirect(new URL("/", request.url)); // default for bidders or others
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/seller-dashboard/:path*",
    "/account/:path*",
    "/login",
    "/register",
    "/verify",
    "/forgot-password",
  ],
};
