/**
 * Next.js Middleware for subdomain-based routing
 * Routes traffic to different portals based on subdomain:
 * - admin.* -> Admin portal
 * - *.timetally.* -> Client portal (employee/manager login)
 * - root domain -> Marketing/landing page
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get("host") || "";

  console.log("[Middleware] Request:", {
    hostname,
    pathname: url.pathname,
    url: request.url,
  });

  // Extract subdomain from hostname
  // Examples:
  // - admin.timetally.local:3000 -> subdomain = 'admin'
  // - testclient.timetally.local:3000 -> subdomain = 'testclient'
  // - localhost:3000 -> subdomain = null
  // - timetally.com -> subdomain = null
  const hostParts = hostname.split(".");
  let subdomain: string | null = null;

  // For local development (*.timetally.local)
  if (hostname.includes(".timetally.local")) {
    subdomain = hostParts[0] ?? null;
  }
  // For production (*.timetally.com)
  else if (hostname.includes(".timetally.com")) {
    subdomain = hostParts[0] ?? null;
    // Ignore 'www' subdomain
    if (subdomain === "www") {
      subdomain = null;
    }
  }
  // For localhost or direct IP access
  else {
    subdomain = null;
  }

  console.log("[Middleware] Detected subdomain:", subdomain);

  // Store subdomain in header for use in app
  const headers = new Headers(request.headers);
  headers.set("x-subdomain", subdomain ?? "");

  // ============================================
  // ROUTING LOGIC
  // ============================================

  // Route 1: Admin portal (admin.*)
  if (subdomain === "admin") {
    // Don't rewrite API routes or Next.js internal routes
    if (url.pathname.startsWith("/api") || url.pathname.startsWith("/_next")) {
      return NextResponse.next({ headers });
    }
    // Admin portal routes start with /admin
    if (!url.pathname.startsWith("/admin")) {
      url.pathname = `/admin${url.pathname}`;
      console.log("[Middleware] Rewriting to admin portal:", url.pathname);
      return NextResponse.rewrite(url, { headers });
    }
    return NextResponse.next({ headers });
  }

  // Route 2: Client portal (any other subdomain)
  if (subdomain && subdomain !== "www") {
    // Don't rewrite API routes or Next.js internal routes
    if (url.pathname.startsWith("/api") || url.pathname.startsWith("/_next")) {
      return NextResponse.next({ headers });
    }
    // Client portal routes start with /client
    if (!url.pathname.startsWith("/client")) {
      url.pathname = `/client${url.pathname}`;
      console.log("[Middleware] Rewriting to client portal:", url.pathname);
      return NextResponse.rewrite(url, { headers });
    }
    return NextResponse.next({ headers });
  }

  // Route 3: Root domain (marketing/landing page)
  // No rewrite needed, serve from root
  console.log("[Middleware] Serving root domain");
  return NextResponse.next({ headers });
}

/**
 * Configure which routes should run through middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
