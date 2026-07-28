// ملفي — عرضٌ وخروج. التعديل يبقى على الموقع في هذه النسخة.
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Linking from "expo-linking";

import { useSession } from "../../lib/session";
import { supabase } from "../../lib/supabase";
import { s, weekdays } from "../../lib/strings";
import { f, alpha } from "../../lib/theme";
import { useTheme } from "../../lib/useTheme";
import type { ThemeName } from "../../lib/theme";
import Card from "../../components/Card";
import { enablePush, disablePush, isRegistered, releaseOnSignOut, type PushState } from "../../lib/push";

export default function ProfileScreen() {
  const { t } = useTheme();
  const { session, profile } = useSession();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <Text style={{ fontFamily: f.logo, fontSize: 22, lineHeight: 36, color: t.goldSoft }}>
          {s.profile.title}
        </Text>

        <Card>
          <Row label={s.profile.name} value={profile?.full_name ?? ""} />
          <Row label={s.profile.email} value={session?.user.email ?? ""} ltr />
          <Row label={s.profile.phone} value={profile?.phone ?? "—"} ltr />
          <Row
            label={s.profile.sessionDay}
            value={profile?.session_day ? (weekdays[profile.session_day] ?? "—") : "—"}
            last
          />
        </Card>

        <PushCard />

        <ThemeCard />

        <Pressable onPress={() => Linking.openURL("https://club-jil-saad.vercel.app/dashboard/profile")}>
          <Text
            style={{
              fontFamily: f.body,
              fontSize: 13,
              color: t.textFaint,
              textAlign: "center",
            }}
          >
            {s.login.onWeb}
          </Text>
        </Pressable>

        <Pressable
          onPress={async () => {
            await releaseOnSignOut();
            await supabase.auth.signOut();
          }}
          style={({ pressed }) => ({
            marginTop: 8,
            borderWidth: 1,
            borderColor: alpha(t.red, 0.5),
            borderRadius: 3,
            paddingVertical: 13,
            alignItems: "center",
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Text style={{ fontFamily: f.bodyBold, fontSize: 15, color: t.red }}>
            {s.profile.signOut}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function ThemeCard() {
  const { t, name, setTheme } = useTheme();
  const options: { key: ThemeName; label: string }[] = [
    { key: "dark", label: s.theme.dark },
    { key: "black", label: s.theme.black },
    { key: "light", label: s.theme.light },
  ];

  return (
    <Card title={s.theme.title}>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {options.map((o) => {
          const active = name === o.key;
          return (
            <Pressable
              key={o.key}
              onPress={() => setTheme(o.key)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => ({
                flex: 1,
                borderWidth: 1,
                borderColor: active ? t.gold : t.line,
                backgroundColor: active ? t.gold : "transparent",
                borderRadius: 8,
                paddingVertical: 11,
                alignItems: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                style={{
                  fontFamily: active ? f.bodyBold : f.body,
                  fontSize: 14,
                  color: active ? t.onGold : t.textDim,
                }}
              >
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {name === "black" ? (
        <Text style={{ fontFamily: f.body, fontSize: 12, lineHeight: 24, color: t.textFaint, marginTop: 12 }}>
          {s.theme.blackHint}
        </Text>
      ) : null}
    </Card>
  );
}

function PushCard() {
  const { t } = useTheme();
  const [state, setState] = useState<PushState>("busy");

  useEffect(() => {
    let alive = true;
    void (async () => {
      const on = await isRegistered();
      if (alive) setState(on ? "on" : "off");
    })();
    return () => {
      alive = false;
    };
  }, []);

  const toggle = useCallback(async () => {
    setState("busy");
    setState(await (state === "on" ? disablePush() : enablePush()));
  }, [state]);

  return (
    <Card title={s.push.title}>
      <Text style={{ fontFamily: f.body, fontSize: 14, lineHeight: 28, color: t.textDim }}>
        {s.push.body}
      </Text>

      {state === "denied" ? (
        <Text style={{ fontFamily: f.body, fontSize: 13, lineHeight: 26, color: t.absent, marginTop: 12 }}>
          {s.push.denied}
        </Text>
      ) : state === "unsupported" ? (
        <Text style={{ fontFamily: f.body, fontSize: 13, color: t.textFaint, marginTop: 12 }}>
          {s.push.unsupported}
        </Text>
      ) : state === "on" ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.green }} />
          <Text style={{ fontFamily: f.body, fontSize: 14, color: t.green }}>{s.push.on}</Text>
          <Pressable onPress={toggle} style={{ marginStart: "auto" }}>
            <Text style={{ fontFamily: f.body, fontSize: 13, color: t.textFaint }}>
              {s.push.disable}
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Pressable
            onPress={toggle}
            disabled={state === "busy"}
            style={({ pressed }) => ({
              marginTop: 16,
              backgroundColor: t.gold,
              borderRadius: 3,
              paddingVertical: 12,
              alignItems: "center",
              opacity: state === "busy" || pressed ? 0.7 : 1,
            })}
          >
            {state === "busy" ? (
              <ActivityIndicator color={t.bg} />
            ) : (
              <Text style={{ fontFamily: f.bodyBold, fontSize: 15, color: t.onGold }}>
                {s.push.enable}
              </Text>
            )}
          </Pressable>
          {state === "failed" ? (
            <Text style={{ fontFamily: f.body, fontSize: 13, color: t.red, marginTop: 10 }}>
              {s.push.failed}
            </Text>
          ) : null}
        </>
      )}
    </Card>
  );
}

function Row({
  label,
  value,
  ltr,
  last,
}: {
  label: string;
  value: string;
  ltr?: boolean;
  last?: boolean;
}) {
  const { t } = useTheme();
  return (
    <View
      style={{
        paddingVertical: 12,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: t.line,
      }}
    >
      <Text style={{ fontFamily: f.body, fontSize: 12, color: t.textFaint }}>
        {label}
      </Text>
      <Text
        style={{
          fontFamily: f.body,
          fontSize: 15,
          color: t.text,
          marginTop: 3,
          writingDirection: ltr ? "ltr" : "rtl",
          textAlign: "right",
        }}
      >
        {value}
      </Text>
    </View>
  );
}
