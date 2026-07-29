// الصندوق — الإعلانات والتذكيرات ورسائل النادي.
import { useCallback, useEffect, useState } from "react";
import { FlatList, Image, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSession } from "../../lib/session";
import { getFeed, markAllRead, markRead, type FeedItem } from "../../lib/queries";
import { refreshUnread } from "../../lib/unread";
import { s } from "../../lib/strings";
import { f, alpha } from "../../lib/theme";
import { useTheme } from "../../lib/useTheme";

export default function InboxScreen() {
  const { t } = useTheme();
  const { session } = useSession();
  const [items, setItems] = useState<FeedItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await getFeed());
      setFailed(false);
    } catch {
      // بلا هذا الالتقاط تبقى القائمة null فيرى العضو شاشةً بيضاء صامتة
      // ولا يعرف أعطبَ التطبيق أم لا إشعار عنده.
      setFailed(true);
      setItems((prev) => prev ?? []);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const anyUnread = (items ?? []).some((n) => n.unread);

  // تفاؤليًّا: الشارة تختفي تحت الإصبع، والكتابة تلحق.
  //
  // فإن لم تُكتب، **يعود الوسم في مكانه فورًا** ويُقال السبب — لا أن
  // يختفي هنا ويعود عند إعادة فتح التطبيق فيبدو التطبيق ناسيًا.
  const markOne = useCallback(async (item: FeedItem) => {
    if (!item.notification_id) return;
    const flip = (unread: boolean) =>
      setItems((prev) => (prev ?? []).map((n) => (n.key === item.key ? { ...n, unread } : n)));

    flip(false);
    try {
      const written = await markRead(item.notification_id);
      if (!written) {
        flip(true);
        setFailed(true);
        return;
      }
      refreshUnread();
    } catch {
      flip(true);
      setFailed(true);
    }
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top"]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingVertical: 14,
        }}
      >
        <Text style={{ fontFamily: f.logo, fontSize: 22, lineHeight: 36, color: t.goldSoft }}>
          {s.inbox.title}
        </Text>
        {anyUnread ? (
          <Pressable
            onPress={async () => {
              if (!session) return;
              // تفاؤليًّا: الشارة تختفي فورًا، والكتابة تلحق.
              setItems((prev) => (prev ?? []).map((n) => ({ ...n, unread: false })));
              await markAllRead(session.user.id);
              refreshUnread();
            }}
          >
            <Text style={{ fontFamily: f.body, fontSize: 13, color: t.textFaint }}>
              {s.inbox.markAll}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* لا يظهر إلّا حين تفشل كتابةٌ فعلًا — والصمت هنا هو ما كان يُربك */}
      {failed && (items?.length ?? 0) > 0 ? (
        <Text
          style={{
            fontFamily: f.body,
            fontSize: 12,
            color: t.absent,
            paddingHorizontal: 20,
            paddingBottom: 8,
          }}
        >
          {s.common.error}
        </Text>
      ) : null}

      <FlatList
        data={items ?? []}
        keyExtractor={(n) => n.key}
        contentContainerStyle={{ padding: 20, paddingTop: 4, gap: 14 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.gold} />
        }
        ListEmptyComponent={
          items === null ? null : (
            <Text
              style={{
                fontFamily: f.body,
                fontSize: 14,
                lineHeight: 28,
                color: failed ? t.absent : t.textFaint,
                textAlign: "center",
                marginTop: 40,
              }}
            >
              {failed ? s.common.error : s.inbox.empty}
            </Text>
          )
        }
        renderItem={({ item }) => <PostCard n={item} onRead={markOne} />}
      />
    </SafeAreaView>
  );
}

function PostCard({ n, onRead }: { n: FeedItem; onRead: (item: FeedItem) => void }) {
  const { t } = useTheme();
  const unread = n.unread;
  return (
    <Pressable
      // ما لا صفَّ إشعارٍ له لا شيء فيه ليُقرأ — فلا يستجيب للّمس أصلًا،
      // ولا يومض وميضةً كاذبة توحي بأنّ شيئًا حدث.
      onPress={unread && n.notification_id ? () => onRead(n) : undefined}
      accessibilityRole={unread && n.notification_id ? "button" : undefined}
      accessibilityLabel={unread ? `${s.inbox.unread} — ${n.title ?? ""}` : undefined}
      style={({ pressed }) => ({
        borderWidth: 1,
        borderColor: unread ? alpha(t.gold, 0.45) : alpha(t.gold, 0.18),
        backgroundColor: t.surface,
        borderRadius: 16,
        overflow: "hidden",
        opacity: pressed && unread ? 0.7 : 1,
      })}
    >
      {n.image_url ? (
        // نسبة 3:2 ثابتة كما في الموقع — مقيسة على صور النادي الحقيقية،
        // ولأنّ الارتفاع الثابت يمنع قفز ما تحت الصورة حين تصل.
        <Image
          source={{ uri: n.image_url }}
          style={{ width: "100%", aspectRatio: 3 / 2 }}
          resizeMode="cover"
        />
      ) : null}
      <View style={{ padding: 18 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text style={{ fontFamily: f.body, fontSize: 11, color: t.goldSoft, letterSpacing: 1 }}>
            {formatDate(n.at)}
          </Text>
          {unread ? (
            <View
              style={{
                backgroundColor: t.gold,
                borderRadius: 3,
                paddingHorizontal: 6,
                paddingVertical: 1,
              }}
            >
              <Text style={{ fontFamily: f.bodyBold, fontSize: 10, color: t.onGold }}>
                {s.inbox.unread}
              </Text>
            </View>
          ) : null}
        </View>
        {n.title ? (
          <Text
            style={{ fontFamily: f.logo, fontSize: 19, lineHeight: 34, color: t.goldSoft, marginTop: 8 }}
          >
            {n.title}
          </Text>
        ) : null}
        {n.body ? (
          <Text
            style={{
              fontFamily: f.body,
              fontSize: 14,
              lineHeight: 28,
              color: t.textDim,
              marginTop: 4,
            }}
          >
            {n.body}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

/** أرقام غربية وشهرٌ عربيّ — نفس صيغة الموقع. */
function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ar-MA-u-nu-latn", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Africa/Casablanca",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}
