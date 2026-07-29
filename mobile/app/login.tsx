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
import { f, alpha } from "../lib/theme";
import { useTheme } from "../lib/useTheme";
import Loading from "../components/Loading";

const SITE = "https://club-jil-saad.vercel.app";

export default function Login() {
  const { t } = useTheme();
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
      style={{ flex: 1, backgroundColor: t.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* كترتيب الموقع: ريشةٌ فوق الاسم.
            وسبب صِغَرها قبلُ أنّها كانت `adaptive-foreground` — صورةُ
            أيقونةٍ بهامشٍ واسع حولها، فالـ٩٦ بكسلًا كانت للصورة لا للريشة.
            هذه حدودٌ ضيّقة، فالرقم هو الريشة نفسها. وأبعادٌ بالأرقام لا
            بالنِّسَب: `width: "72%"` مع `aspectRatio` لم تُحسَب فرجع
            المكوّن إلى مقاس الملفّ الأصليّ — ٢٠٠٠ بكسل عرضًا في شاشة
            الدخول. */}
        <View style={{ alignItems: "center", marginBottom: 30 }}>
          <Image
            source={require("../assets/mark.png")}
            style={{ width: 92, height: 110 }}
            resizeMode="contain"
            accessibilityLabel={s.brand}
          />
          <Text
            style={{
              fontFamily: f.logo,
              fontSize: 30,
              lineHeight: 52,
              color: t.goldSoft,
              marginTop: 10,
            }}
          >
            {s.brand}
          </Text>
        </View>

        <View
          style={{
            borderWidth: 1,
            borderColor: t.line,
            backgroundColor: t.surface,
            borderRadius: 12,
            padding: 24,
          }}
        >
          <Text style={{ fontFamily: f.displayBold, fontSize: 20, color: t.goldSoft }}>
            {s.login.welcome}
          </Text>

          {pendingNotice ? (
            <Text
              style={{
                fontFamily: f.body,
                fontSize: 14,
                lineHeight: 28,
                color: t.absent,
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
              style={{ fontFamily: f.body, fontSize: 14, color: t.red, marginTop: 14 }}
            >
              {error}
            </Text>
          ) : null}

          <Pressable
            onPress={submit}
            disabled={busy}
            style={({ pressed }) => ({
              marginTop: 22,
              backgroundColor: t.gold,
              borderRadius: 3,
              paddingVertical: 14,
              alignItems: "center",
              opacity: busy || pressed ? 0.7 : 1,
            })}
          >
            {busy ? (
              <ActivityIndicator color={t.onGold} />
            ) : (
              <Text style={{ fontFamily: f.bodyBold, fontSize: 16, color: t.onGold }}>
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
              color: t.textFaint,
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
  const { t } = useTheme();
  return (
    <View style={{ marginTop: 18 }}>
      <Text
        style={{
          fontFamily: f.body,
          fontSize: 13,
          color: t.textDim,
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
        placeholderTextColor={t.textFaint}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        autoCapitalize="none"
        autoCorrect={false}
        style={{
          borderWidth: 1,
          borderColor: t.line,
          backgroundColor: t.bg,
          borderRadius: 3,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontFamily: f.body,
          fontSize: 15,
          color: t.text,
          textAlign: "right",
          // البريد وكلمة السرّ لاتينيّان، فيُكتبان من اليسار داخل حقلٍ عربيّ
          writingDirection: "ltr",
        }}
      />
    </View>
  );
}
