// عدّاد غير المقروء — يُقرأ في شريط التبويبات.
//
// يُحدَّث في ثلاث لحظات: عند الإقلاع، وكلّما عاد التطبيق إلى الواجهة (فلا
// يبقى الرقم قديمًا بعد قراءة إشعارٍ على الموقع)، وحين يُعلَّم إشعارٌ
// مقروءًا داخل التطبيق نفسه.
//
// والثالثة هي سبب هذا الاشتراك الصغير: الشارة في شريط التبويبات والقائمة
// في شاشة الصندوق مكوّنان متجاوران لا أبَ قريبٌ يجمع حالتهما. وبدونه
// يُضغط الإشعار فيُقرأ، ويبقى الرقم فوق الجرس كما هو حتّى يُغادَر التطبيق
// ويُعاد فتحه — وهو أوّل ما ستلاحظه العين.
import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

import { supabase } from "./supabase";

const listeners = new Set<() => void>();

/** يُنادى بعد أيّ كتابةٍ تغيّر عدد غير المقروء. */
export function refreshUnread(): void {
  for (const l of listeners) l();
}

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

    const onPoke = () => void load();
    listeners.add(onPoke);

    return () => {
      sub.remove();
      listeners.delete(onPoke);
    };
  }, [load]);

  return count;
}
