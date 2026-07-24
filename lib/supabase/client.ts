// عميل Supabase في المتصفح — لمكوّنات العميل ("use client").
// Browser-side Supabase client — for Client Components.
//
// Cookie storage is handled automatically by @supabase/ssr (falls back to
// document.cookie), so no custom cookie methods are needed here.

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
