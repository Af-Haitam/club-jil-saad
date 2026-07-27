// الصندوق — الإعلانات والتذكيرات ورسائل النادي.
import { useCallback, useEffect, useState } from "react";
import { FlatList, Image, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSession } from "../../lib/session";
import { getInbox, markAllRead, type Notice } from "../../lib/queries";
import { s } from "../../lib/strings";
import { c, f, alpha } from "../../lib/theme";

export default function InboxScreen() {
  const { session } = useSession();
  const [items, setItems] = useState<Notice[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setItems(await getInbox());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const anyUnread = (items ?? []).some((n) => !n.read_at);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.ink }} edges={["top"]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingVertical: 14,
        }}
      >
        <Text style={{ fontFamily: f.logo, fontSize: 22, lineHeight: 36, color: c.goldLight }}>
          {s.inbox.title}
        </Text>
        {anyUnread ? (
          <Pressable
            onPress={async () => {
              if (!session) return;
              // تفاؤليًّا: الشارة تختفي فورًا، والكتابة تلحق.
              setItems((prev) =>
                (prev ?? []).map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })),
              );
              await markAllRead(session.user.id);
            }}
          >
            <Text style={{ fontFamily: f.body, fontSize: 13, color: alpha(c.parchment, 0.6) }}>
              {s.inbox.markAll}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={items ?? []}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: 20, paddingTop: 4, gap: 14 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.gold} />
        }
        ListEmptyComponent={
          items === null ? null : (
            <Text
              style={{
                fontFamily: f.body,
                fontSize: 14,
                lineHeight: 28,
                color: alpha(c.parchment, 0.55),
                textAlign: "center",
                marginTop: 40,
              }}
            >
              {s.inbox.empty}
            </Text>
          )
        }
        renderItem={({ item }) => <PostCard n={item} />}
      />
    </SafeAreaView>
  );
}

function PostCard({ n }: { n: Notice }) {
  const unread = !n.read_at;
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: unread ? alpha(c.gold, 0.45) : alpha(c.gold, 0.18),
        backgroundColor: alpha(c.inkSoft, 0.6),
        borderRadius: 16,
        overflow: "hidden",
      }}
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
          <Text style={{ fontFamily: f.body, fontSize: 11, color: c.goldLight, letterSpacing: 1 }}>
            {formatDate(n.created_at)}
          </Text>
          {unread ? (
            <View
              style={{
                backgroundColor: c.gold,
                borderRadius: 3,
                paddingHorizontal: 6,
                paddingVertical: 1,
              }}
            >
              <Text style={{ fontFamily: f.bodyBold, fontSize: 10, color: c.ink }}>
                {s.inbox.unread}
              </Text>
            </View>
          ) : null}
        </View>
        {n.title ? (
          <Text
            style={{ fontFamily: f.logo, fontSize: 19, lineHeight: 34, color: c.goldLight, marginTop: 8 }}
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
              color: alpha(c.parchment, 0.8),
              marginTop: 4,
            }}
          >
            {n.body}
          </Text>
        ) : null}
      </View>
    </View>
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
