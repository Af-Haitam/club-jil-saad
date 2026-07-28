import type { ReactNode } from "react";
import { Text, View } from "react-native";

import { f, alpha } from "../lib/theme";
import { useTheme } from "../lib/useTheme";

export default function Card({ title, children }: { title?: string; children: ReactNode }) {
  const { t } = useTheme();
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: alpha(t.gold, 0.22),
        backgroundColor: t.surface,
        borderRadius: 16,
        padding: 20,
      }}
    >
      {title ? (
        <Text style={{ fontFamily: f.display, fontSize: 16, color: t.gold, marginBottom: 12 }}>
          {title}
        </Text>
      ) : null}
      {children}
    </View>
  );
}
