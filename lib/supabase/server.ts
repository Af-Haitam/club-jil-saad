// عميل Supabase على الخادم — لمكوّنات الخادم، الإجراءات (Server Actions)، ومعالجات المسارات.
// Server-side Supabase client — for Server Components, Server Actions and Route Handlers.
//
// Next.js 16: `cookies()` from `next/headers` is async, so this factory is async too.
// A fresh client must be created per request/render — never cache or share this across
// requests (see the @supabase/ssr docs).

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // `setAll` was called from a Server Component render, where
            // cookies cannot be written. This is expected and safe to
            // ignore as long as `middleware.ts` is refreshing the user's
            // session on every request.
          }
        },
      },
    },
  );
}
