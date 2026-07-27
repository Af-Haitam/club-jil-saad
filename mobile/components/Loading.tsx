import { ActivityIndicator, View } from "react-native";

import { c } from "../lib/theme";

export default function Loading() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.ink }}>
      <ActivityIndicator color={c.gold} size="large" />
    </View>
  );
}
