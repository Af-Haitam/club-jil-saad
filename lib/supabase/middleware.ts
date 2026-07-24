// يُحدّث جلسة Supabase على كل طلب، ثم يطبّق حماية المسارات (دخول/انتظار الموافقة).
// Refreshes the Supabase auth session on every request, then applies route
// protection. Called from `middleware.ts` at the web root.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that require an authenticated user.
const PROTECTED_PREFIXES = ["/dashboard", "/pending"];
// Routes an already-authenticated user should not see (they belong signed out).
const AUTH_ONLY_PREFIXES = ["/login", "/register"];

// Matches `prefix` itself or any of its sub-paths, without accidentally
// matching an unrelated route that merely starts with the same characters
// (e.g. a hypothetical `/dashboardish` should not count as `/dashboard`).
function pathIsUnder(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          // Write the refreshed cookies back onto the request so any code
          // reading `request.cookies` later in this function sees them,
          // then rebuild the response from that request so it carries them
          // to the browser too.
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
          // Cache-Control etc. — prevents a CDN/reverse proxy from caching
          // a response that carries one user's session cookie.
          Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
        },
      },
    },
  );

  // Do not add logic between createServerClient and getUser(). A mistake
  // here can cause hard-to-debug random sign-outs.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathIsUnder(pathname, prefix));
  const isAuthOnly = AUTH_ONLY_PREFIXES.some((prefix) => pathIsUnder(pathname, prefix));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return withRefreshedCookies(NextResponse.redirect(url), response);
  }

  if (user && isAuthOnly) {
    const url = request.nextUrl.clone();
    url.pathname = "/pending";
    return withRefreshedCookies(NextResponse.redirect(url), response);
  }

  return response;
}

// Building a new NextResponse (e.g. a redirect) elsewhere in this function
// would otherwise drop the session-refresh cookies set via `setAll` above.
// This copies them onto whichever response we actually return.
function withRefreshedCookies(target: NextResponse, refreshed: NextResponse): NextResponse {
  refreshed.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });
  return target;
}
