// جذر التطبيق: الخطوط والسمة، ثمّ الجلسة، ثمّ التوجيه.
//
// شاشة الإقلاع تبقى ظاهرة حتى تجتمع الثلاثة — خطٌّ عربيّ لم يُحمَّل بعد
// يعرض النصّ بخطّ النظام ثمّ يقفز، وسمةٌ لم تُقرأ بعد تومض بالأصل ثمّ
// تنقلب إلى المختارة. كلاهما أوّل ما يراه العضو.
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { Lalezar_400Regular } from "@expo-google-fonts/lalezar";
import { ReemKufi_400Regular, ReemKufi_600SemiBold } from "@expo-google-fonts/reem-kufi";
import { Tajawal_400Regular, Tajawal_700Bold } from "@expo-google-fonts/tajawal";

import { SessionProvider } from "../lib/session";
import { ThemeProvider, useTheme } from "../lib/useTheme";
import { useNotificationRouting } from "../lib/push";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Shell />
    </ThemeProvider>
  );
}

function Shell() {
  const { t, ready: themeReady } = useTheme();

  // المفاتيح هنا هي ما يُكتب في fontFamily لاحقًا (lib/theme.ts).
  const [fontsLoaded, fontError] = useFonts({
    Lalezar: Lalezar_400Regular,
    ReemKufi: ReemKufi_400Regular,
    ReemKufi_600: ReemKufi_600SemiBold,
    Tajawal: Tajawal_400Regular,
    Tajawal_700: Tajawal_700Bold,
  });

  useNotificationRouting();

  const fontsDone = fontsLoaded || fontError;

  useEffect(() => {
    // خطأ في الخطّ لا يحبس العضو خلف شاشة إقلاعٍ أبدية: يدخل بخطّ النظام.
    if (fontsDone && themeReady) void SplashScreen.hideAsync();
  }, [fontsDone, themeReady]);

  if (!fontsDone || !themeReady) return null;

  return (
    <SessionProvider>
      <StatusBar style={t.statusBar} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: t.bg },
          animation: "fade",
        }}
      />
    </SessionProvider>
  );
}
