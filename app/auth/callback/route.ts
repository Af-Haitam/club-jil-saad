// يُبادل رمز تأكيد الرابط (من رابط إعادة تعيين كلمة المرور، إلخ) بجلسة، ثم يوجّه.
// Exchanges the `code` from an email link (password reset, etc.) for a
// session, then redirects. Uses the server client so the session cookies are
// written on this response.

import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // Missing, invalid or expired code (e.g. an old password-reset link). Send
  // the user to login with a flag so «انتهت صلاحية الرابط» shows, rather than
  // a confusing silent redirect or a raw Supabase error.
  return NextResponse.redirect(new URL("/login?error=link_expired", request.url));
}
