// عدّاد غير المقروء — يُقرأ في شريط التبويبات ويُحدَّث كلّما عاد التطبيق
// إلى الواجهة، فلا يبقى الرقم قديمًا بعد قراءة إشعارٍ على الموقع.
import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

import { supabase } from "./supabase";

export function useUnread(): number {
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    const { count: n } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .is("read_at", null);
    setCount(n ?? 0);
  }, []);

  useEffect(() => {
    void load();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void load();
    });
    return () => sub.remove();
  }, [load]);

  return count;
}
