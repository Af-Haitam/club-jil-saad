// شريط التبويبات الأصيل — نفس ترتيب الموقع وأيقوناته، لكنّه هنا شريط
// النظام نفسه: يحمل حافّة الأمان السفلية ويتحرّك بحركة أندرويد.
import { Redirect, Tabs } from "expo-router";
import { Text, View, type ColorValue } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { s } from "../../lib/strings";
import { f } from "../../lib/theme";
import { useTheme } from "../../lib/useTheme";
import { useUnread } from "../../lib/unread";
import { useSession } from "../../lib/session";
import { usePushOwnership } from "../../lib/push";

export default function TabsLayout() {
  const { t } = useTheme();
  const { session, loading } = useSession();
  const unread = useUnread();

  // الرمز يتبع من دخل: بدونه يبقى الجهاز مسجَّلًا باسم آخر من فعّل
  // التنبيهات عليه، فيستقبل إشعاراته الخاصّة ولو دخل غيره.
  usePushOwnership(session?.user.id);

  // تسجيل الخروج يُفرِغ الجلسة، لكنّ العضو يكون واقفًا على «ملفي» — ولا شيء
  // كان ينقله. فيبقى داخل التطبيق بلا جلسة، يرى شاشاتٍ فارغة ولا يفهم لماذا.
  // الحارس هنا لا في زرّ الخروج وحده: أيّ انتهاءٍ للجلسة (انتهاء الرمز مثلًا)
  // يعيده إلى الدخول.
  if (!loading && !session) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.gold,
        tabBarInactiveTintColor: t.textFaint,
        tabBarStyle: {
          backgroundColor: t.bg,
          borderTopColor: t.line,
          borderTopWidth: 1,
          height: 62,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontFamily: f.body, fontSize: 11 },
        sceneStyle: { backgroundColor: t.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: s.tabs.overview, tabBarIcon: ({ color }) => <GridIcon color={color} /> }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: s.tabs.inbox,
          tabBarIcon: ({ color }) => <BellIcon color={color} badge={unread} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: s.tabs.profile, tabBarIcon: ({ color }) => <PersonIcon color={color} /> }}
      />
    </Tabs>
  );
}

const SZ = 24;

function GridIcon({ color }: { color: ColorValue }) {
  return (
    <Svg width={SZ} height={SZ} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6}>
      <Rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <Rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <Rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <Rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </Svg>
  );
}

function BellIcon({ color, badge }: { color: ColorValue; badge: number }) {
  const { t } = useTheme();
  return (
    <View>
      <Svg
        width={SZ}
        height={SZ}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Path d="M18 8.5a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16s-2-1.5-2-6.5" />
        <Path d="M13.7 19a2 2 0 0 1-3.4 0" />
      </Svg>
      {badge > 0 ? (
        <View
          style={{
            position: "absolute",
            top: -3,
            left: -6,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: t.gold,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 3,
          }}
        >
          <Text style={{ fontFamily: f.bodyBold, fontSize: 10, color: t.onGold }}>
            {badge > 9 ? "9+" : badge}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function PersonIcon({ color }: { color: ColorValue }) {
  return (
    <Svg
      width={SZ}
      height={SZ}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Circle cx="12" cy="8" r="4" />
      <Path d="M4.5 20c0-3.6 3.4-6 7.5-6s7.5 2.4 7.5 6" />
    </Svg>
  );
}

