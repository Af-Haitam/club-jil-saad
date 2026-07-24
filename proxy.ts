// نقطة دخول بروكسي Next.js 16 (بديل convention القديم middleware) —
// تُحدّث جلسة Supabase على كل طلب وتحمي المسارات. المنطق في lib/supabase/middleware.ts.
// Next.js 16 proxy entry point (replaces the deprecated `middleware` convention;
// same Node runtime, only the file/export name changed). Logic lives in
// lib/supabase/middleware.ts.

import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Run on every route except: Next internals (_next/static, _next/image),
    // metadata/static files (favicon.ico, icon.svg, sitemap.xml, robots.txt),
    // anything under /assets/, and the public home page "/" itself.
    "/((?!_next/static|_next/image|favicon\\.ico|icon\\.svg|assets/|sitemap\\.xml|robots\\.txt|$).*)",
  ],
};
