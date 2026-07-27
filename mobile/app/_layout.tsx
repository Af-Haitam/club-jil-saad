// جذر التطبيق: الخطوط، ثمّ الجلسة، ثمّ التوجيه.
//
// شاشة الإقلاع تبقى ظاهرة حتى يجتمع الأمران — خطٌّ عربيّ لم يُحمَّل بعد
// يعرض النصّ بخطّ النظام ثمّ يقفز، وهي أوضح علامةٍ على أنّ ما تنظر إليه
// صفحة ويب في إطار.
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { Lalezar_400Regular } from "@expo-google-fonts/lalezar";
import { ReemKufi_400Regular, ReemKufi_600SemiBold } from "@expo-google-fonts/reem-kufi";
import { Tajawal_400Regular, Tajawal_700Bold } from "@expo-google-fonts/tajawal";

import { SessionProvider } from "../lib/session";
import { c } from "../lib/theme";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // المفاتيح هنا هي ما يُكتب في fontFamily لاحقًا (lib/theme.ts).
  const [fontsLoaded, fontError] = useFonts({
    Lalezar: Lalezar_400Regular,
    ReemKufi: ReemKufi_400Regular,
    ReemKufi_600: ReemKufi_600SemiBold,
    Tajawal: Tajawal_400Regular,
    Tajawal_700: Tajawal_700Bold,
  });

  useEffect(() => {
    // خطأ في الخطّ لا يحبس العضو خلف شاشة إقلاعٍ أبدية: يدخل بخطّ النظام.
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SessionProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.ink },
          animation: "fade",
        }}
      />
    </SessionProvider>
  );
}
