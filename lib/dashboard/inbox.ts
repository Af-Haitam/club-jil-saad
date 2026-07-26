// صندوق إشعارات العضو. سياسة notif_select هي «صفوفك أنت»، فلا حاجة إلى
// شرط user_id في الاستعلام — لكنّنا نضعه صراحةً ليقرأ الكود كما يتصرّف،
// ولئلّا يعتمد صحّة النتيجة على سياسة قد تُعدَّل يومًا.
import { createClient } from "@/lib/supabase/server";
import type { AppNotification } from "@/lib/types/database";

const INBOX_LIMIT = 60;

export async function getInbox(): Promise<AppNotification[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(INBOX_LIMIT);

  return (data ?? []) as AppNotification[];
}

/**
 * عدد غير المقروء — يُقرأ في كل تحميل للقوقعة، فيمرّ على الفهرس الجزئي
 * notifications_unread_idx بلا جلب أيّ صفّ (head: true).
 */
export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  return count ?? 0;
}
