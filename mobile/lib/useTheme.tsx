// اختيار السمة — محفوظ على الجهاز، ويُقرأ قبل أوّل رسم.
//
// السمة تُقرأ من AsyncStorage قبل إخفاء شاشة الإقلاع، وإلّا ومض التطبيق
// بالسمة الافتراضية ثمّ قفز إلى المختارة — وهي أوّل ما يراه العضو.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { palettes, type Palette, type ThemeName } from "./theme";

const KEY = "club.theme";

type Ctx = {
  name: ThemeName;
  t: Palette;
  setTheme: (n: ThemeName) => void;
  /** false حتى تُقرأ السمة المحفوظة. */
  ready: boolean;
};

const ThemeContext = createContext<Ctx>({
  name: "dark",
  t: palettes.dark,
  setTheme: () => {},
  ready: false,
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState<ThemeName>("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const saved = await AsyncStorage.getItem(KEY);
        if (alive && (saved === "dark" || saved === "black" || saved === "light")) {
          setName(saved);
        }
      } catch {
        // تخزينٌ معطوب لا يمنع فتح التطبيق — نبقى على الأصل.
      }
      if (alive) setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const setTheme = useCallback((next: ThemeName) => {
    setName(next);
    void AsyncStorage.setItem(KEY, next).catch(() => {});
  }, []);

  return (
    <ThemeContext.Provider value={{ name, t: palettes[name], setTheme, ready }}>
      {children}
    </ThemeContext.Provider>
  );
}
