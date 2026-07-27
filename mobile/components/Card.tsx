import type { ReactNode } from "react";
import { Text, View } from "react-native";

import { c, f, alpha } from "../lib/theme";

export default function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: alpha(c.gold, 0.2),
        backgroundColor: alpha(c.inkSoft, 0.6),
        borderRadius: 16,
        padding: 20,
      }}
    >
      {title ? (
        <Text
          style={{
            fontFamily: f.display,
            fontSize: 16,
            color: c.gold,
            marginBottom: 12,
          }}
        >
          {title}
        </Text>
      ) : null}
      {children}
    </View>
  );
}
