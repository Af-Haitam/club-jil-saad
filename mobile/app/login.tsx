// شاشة الدخول.
//
// التسجيل واسترجاع كلمة المرور يبقيان على الموقع عمدًا: كلاهما يمرّ ببريدٍ
// ورابطٍ ومصادقة، وبناؤهما هنا يضاعف سطح الخطأ مقابل شاشتين تُستعملان
// مرّةً واحدة في العمر.
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Redirect } from "expo-router";
import * as Linking from "expo-linking";

import { supabase } from "../lib/supabase";
import { useSession } from "../lib/session";
import { s } from "../lib/strings";
import { c, f, alpha } from "../lib/theme";
import Loading from "../components/Loading";

const SITE = "https://club-jil-saad.vercel.app";

export default function Login() {
  const { session, profile, loading } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return <Loading />;
  if (session && profile?.status === "active") return <Redirect href="/(tabs)" />;

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (err) {
      // نميّز انقطاع الشبكة عن خطأ البيانات: «بريد خاطئ» في نفقٍ تحت الأرض
      // رسالةٌ كاذبة تدفع العضو إلى تغيير كلمة سرّه بلا سبب.
      const offline = /network|fetch/i.test(err.message);
      setError(offline ? s.login.offline : s.login.failed);
      setBusy(false);
      return;
    }
    // الجلسة تصل عبر onAuthStateChange، والتوجيه يتكفّل به index.
    setBusy(false);
  }

  const pendingNotice = session && profile && profile.status !== "active";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.ink }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <Image
            source={require("../assets/adaptive-foreground.png")}
            style={{ width: 96, height: 96 }}
            resizeMode="contain"
          />
          <Text
            style={{
              fontFamily: f.logo,
              fontSize: 30,
              lineHeight: 48,
              color: c.goldLight,
              marginTop: 4,
            }}
          >
            {s.brand}
          </Text>
        </View>

        <View
          style={{
            borderWidth: 1,
            borderColor: c.inkLine,
            backgroundColor: alpha(c.inkSoft, 0.7),
            borderRadius: 12,
            padding: 24,
          }}
        >
          <Text style={{ fontFamily: f.displayBold, fontSize: 20, color: c.goldLight }}>
            {s.login.welcome}
          </Text>

          {pendingNotice ? (
            <Text
              style={{
                fontFamily: f.body,
                fontSize: 14,
                lineHeight: 28,
                color: c.absent,
                marginTop: 12,
              }}
            >
              {s.login.pending}
            </Text>
          ) : null}

          <Field
            label={s.login.email}
            placeholder={s.login.emailPh}
            value={email}
            onChange={setEmail}
            keyboardType="email-address"
          />
          <Field
            label={s.login.password}
            placeholder={s.login.passwordPh}
            value={password}
            onChange={setPassword}
            secure
          />

          {error ? (
            <Text
              style={{ fontFamily: f.body, fontSize: 14, color: c.red, marginTop: 14 }}
            >
              {error}
            </Text>
          ) : null}

          <Pressable
            onPress={submit}
            disabled={busy}
            style={({ pressed }) => ({
              marginTop: 22,
              backgroundColor: c.gold,
              borderRadius: 3,
              paddingVertical: 14,
              alignItems: "center",
              opacity: busy || pressed ? 0.7 : 1,
            })}
          >
            {busy ? (
              <ActivityIndicator color={c.ink} />
            ) : (
              <Text style={{ fontFamily: f.bodyBold, fontSize: 16, color: c.ink }}>
                {s.login.submit}
              </Text>
            )}
          </Pressable>
        </View>

        <Pressable onPress={() => Linking.openURL(SITE)} style={{ marginTop: 24 }}>
          <Text
            style={{
              fontFamily: f.body,
              fontSize: 13,
              lineHeight: 26,
              color: alpha(c.parchment, 0.55),
              textAlign: "center",
            }}
          >
            {s.login.onWeb}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  secure,
  keyboardType,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  secure?: boolean;
  keyboardType?: "email-address";
}) {
  return (
    <View style={{ marginTop: 18 }}>
      <Text
        style={{
          fontFamily: f.body,
          fontSize: 13,
          color: alpha(c.parchment, 0.7),
          marginBottom: 6,
          textAlign: "right",
        }}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={alpha(c.parchment, 0.35)}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        autoCapitalize="none"
        autoCorrect={false}
        style={{
          borderWidth: 1,
          borderColor: c.inkLine,
          backgroundColor: c.ink,
          borderRadius: 3,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontFamily: f.body,
          fontSize: 15,
          color: c.parchment,
          textAlign: "right",
          // البريد وكلمة السرّ لاتينيّان، فيُكتبان من اليسار داخل حقلٍ عربيّ
          writingDirection: "ltr",
        }}
      />
    </View>
  );
}
