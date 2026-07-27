// حالة الجلسة — مصدر واحد للحقيقة يقرأه كلّ شيء.
//
// الجلسة محفوظة في AsyncStorage، فالعضو يفتح التطبيق فيجده مفتوحًا. وهذا
// أحد أوضح الفروق عن الموقع في القشرة: لا شاشة دخولٍ كلّ مرّة.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "./supabase";

export type Profile = {
  id: string;
  full_name: string;
  role: "admin" | "supervisor" | "member";
  status: "pending" | "active" | "suspended";
  phone: string | null;
  session_day: string | null;
};

type Ctx = {
  session: Session | null;
  profile: Profile | null;
  /** true حتى تُقرأ الجلسة المحفوظة — قبلها لا نعرف أين نوجّه العضو. */
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const SessionContext = createContext<Ctx>({
  session: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

export const useSession = () => useContext(SessionContext);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId: string | undefined) {
    if (!userId) {
      setProfile(null);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, role, status, phone, session_day")
      .eq("id", userId)
      .maybeSingle();
    setProfile((data as Profile) ?? null);
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      setSession(data.session);
      await loadProfile(data.session?.user.id);
      if (alive) setLoading(false);
    })();

    // يلتقط الدخول والخروج وتجديد الرمز — بما فيها ما يحدث في خلفية التطبيق.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      void loadProfile(next?.user.id);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <SessionContext.Provider
      value={{
        session,
        profile,
        loading,
        refreshProfile: () => loadProfile(session?.user.id),
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
