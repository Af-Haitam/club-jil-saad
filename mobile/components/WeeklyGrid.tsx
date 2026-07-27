// شبكة الأسابيع — قلب البرنامج.
//
// الألوان مأخوذة من جدول التتبّع الورقي للنادي نفسه، وهي نفسها في الموقع.
// ومعها رمزٌ داخل كلّ خلية: من لا يميّز الأحمر من الأخضر يقرأ الشبكة
// بالرمز، لا باللون.
import { Text, View } from "react-native";

import type { Cycle, Session } from "../lib/queries";
import { s } from "../lib/strings";
import { c, f, alpha } from "../lib/theme";
import Card from "./Card";

const meta: Record<Session["status"], { bg: string; glyph: string; label: string }> = {
  green: { bg: c.green, glyph: "✓", label: s.status.green },
  red: { bg: c.red, glyph: "✕", label: s.status.red },
  absent: { bg: c.absent, glyph: "—", label: s.status.absent },
  excused: { bg: c.excused, glyph: "•", label: s.status.excused },
  pending: { bg: "transparent", glyph: "", label: s.status.pending },
};

export default function WeeklyGrid({
  cycle,
  sessions,
}: {
  cycle: Cycle | null;
  sessions: Session[];
}) {
  if (!cycle) {
    return (
      <Card title={s.overview.gridTitle}>
        <Text style={{ fontFamily: f.body, fontSize: 14, color: alpha(c.parchment, 0.6) }}>
          {s.overview.noCycle}
        </Text>
      </Card>
    );
  }

  const byWeek = new Map(sessions.map((x) => [x.week_number, x]));
  const weeks = Array.from({ length: cycle.week_count }, (_, i) => i + 1);

  return (
    <Card title={s.overview.gridTitle}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {weeks.map((w) => {
          const sess = byWeek.get(w);
          const m = meta[sess?.status ?? "pending"];
          const filled = m.bg !== "transparent";
          return (
            <View
              key={w}
              accessibilityLabel={`${s.overview.week} ${w} — ${m.label}`}
              style={{
                width: 46,
                height: 46,
                borderRadius: 8,
                borderWidth: filled ? 0 : 1,
                borderColor: c.inkLine,
                backgroundColor: filled ? m.bg : alpha(c.ink, 0.6),
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: f.bodyBold,
                  fontSize: 12,
                  color: filled ? "#fff" : alpha(c.parchment, 0.45),
                }}
              >
                {w}
              </Text>
              {m.glyph ? (
                <Text style={{ fontFamily: f.body, fontSize: 11, color: "#fff" }}>{m.glyph}</Text>
              ) : null}
            </View>
          );
        })}
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 16 }}>
        {(Object.keys(meta) as Session["status"][])
          .filter((k) => k !== "pending")
          .map((k) => (
            <View key={k} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: meta[k].bg }} />
              <Text style={{ fontFamily: f.body, fontSize: 11, color: alpha(c.parchment, 0.6) }}>
                {meta[k].label}
              </Text>
            </View>
          ))}
      </View>
    </Card>
  );
}
