import { betterFetch } from "@better-fetch/fetch";
import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from 'next-intl/middleware';
import type { Session } from "@/lib/auth";
import { routing } from './i18n/routing';

const protectedRoutes = [
  "/dashboard",
  "/pivot",
  "/arbitrage",
  "/correlation",
  "/seasonal",
  "/cot",
  "/backtest",
  "/profile",
  "/settings",
];

const authRoutes = ["/sign-in", "/sign-up", "/forget-password", "/reset-password"];

// Create the next-intl middleware handler
const handleI18nRouting = createIntlMiddleware(routing);

// Helper to strip locale prefix from pathname for route matching
function getPathnameWithoutLocale(pathname: string): string {
  const localePattern = new RegExp(`^/(${routing.locales.join('|')})(/|$)`);
  return pathname.replace(localePattern, '$2') || '/';
}

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const pathnameWithoutLocale = getPathnameWithoutLocale(pathname);

  // Check if the route is protected (check without locale prefix)
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathnameWithoutLocale === route || pathnameWithoutLocale.startsWith(`${route}/`)
  );

  // Check if the route is an auth route (check without locale prefix)
  const isAuthRoute = authRoutes.some(
    (route) => pathnameWithoutLocale === route || pathnameWithoutLocale.startsWith(`${route}/`)
  );

  // Get session from better-auth
  const { data: session } = await betterFetch<Session>(
    "/api/auth/get-session",
    {
      baseURL: request.nextUrl.origin,
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    }
  );

  // Redirect unauthenticated users from protected routes to sign-in
  if (isProtectedRoute && !session) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect authenticated users from auth routes to dashboard
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Handle i18n routing
  // This sets the locale cookie and handles locale detection
  return handleI18nRouting(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)",
  ],
};
