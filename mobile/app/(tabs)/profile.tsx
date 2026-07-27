// ملفي — عرضٌ وخروج. التعديل يبقى على الموقع في هذه النسخة.
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Linking from "expo-linking";

import { useSession } from "../../lib/session";
import { supabase } from "../../lib/supabase";
import { s, weekdays } from "../../lib/strings";
import { c, f, alpha } from "../../lib/theme";
import Card from "../../components/Card";
import { enablePush, disablePush, isRegistered, releaseOnSignOut, type PushState } from "../../lib/push";

export default function ProfileScreen() {
  const { session, profile } = useSession();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.ink }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <Text style={{ fontFamily: f.logo, fontSize: 22, lineHeight: 36, color: c.goldLight }}>
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

        <Pressable onPress={() => Linking.openURL("https://club-jil-saad.vercel.app/dashboard/profile")}>
          <Text
            style={{
              fontFamily: f.body,
              fontSize: 13,
              color: alpha(c.parchment, 0.55),
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
            borderColor: alpha(c.red, 0.5),
            borderRadius: 3,
            paddingVertical: 13,
            alignItems: "center",
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Text style={{ fontFamily: f.bodyBold, fontSize: 15, color: c.red }}>
            {s.profile.signOut}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function PushCard() {
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
      <Text style={{ fontFamily: f.body, fontSize: 14, lineHeight: 28, color: alpha(c.parchment, 0.7) }}>
        {s.push.body}
      </Text>

      {state === "denied" ? (
        <Text style={{ fontFamily: f.body, fontSize: 13, lineHeight: 26, color: c.absent, marginTop: 12 }}>
          {s.push.denied}
        </Text>
      ) : state === "unsupported" ? (
        <Text style={{ fontFamily: f.body, fontSize: 13, color: alpha(c.parchment, 0.5), marginTop: 12 }}>
          {s.push.unsupported}
        </Text>
      ) : state === "on" ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.green }} />
          <Text style={{ fontFamily: f.body, fontSize: 14, color: c.green }}>{s.push.on}</Text>
          <Pressable onPress={toggle} style={{ marginStart: "auto" }}>
            <Text style={{ fontFamily: f.body, fontSize: 13, color: alpha(c.parchment, 0.55) }}>
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
              backgroundColor: c.gold,
              borderRadius: 3,
              paddingVertical: 12,
              alignItems: "center",
              opacity: state === "busy" || pressed ? 0.7 : 1,
            })}
          >
            {state === "busy" ? (
              <ActivityIndicator color={c.ink} />
            ) : (
              <Text style={{ fontFamily: f.bodyBold, fontSize: 15, color: c.ink }}>
                {s.push.enable}
              </Text>
            )}
          </Pressable>
          {state === "failed" ? (
            <Text style={{ fontFamily: f.body, fontSize: 13, color: c.red, marginTop: 10 }}>
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
  return (
    <View
      style={{
        paddingVertical: 12,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: alpha(c.inkLine, 0.8),
      }}
    >
      <Text style={{ fontFamily: f.body, fontSize: 12, color: alpha(c.parchment, 0.55) }}>
        {label}
      </Text>
      <Text
        style={{
          fontFamily: f.body,
          fontSize: 15,
          color: c.parchment,
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
