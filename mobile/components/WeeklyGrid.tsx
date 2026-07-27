// شبكة الأسابيع — قلب البرنامج.
//
// الألوان مأخوذة من جدول التتبّع الورقي للنادي نفسه، وهي نفسها في الموقع.
// ومعها رمزٌ داخل كلّ خلية: من لا يميّز الأحمر من الأخضر يقرأ الشبكة
// بالرمز، لا باللون.
//
// والخلية تُضغط. الشبكة وحدها تقول «أتقنتَ» أو «لم تُتقن»، أمّا ما سُمِّع
// وكم خطأً وما قاله المشرف فهو ما يعود إليه العضو فعلًا — وهو موجود في
// الموقع منذ المرحلة الثالثة، فغيابه هنا كان نقصًا لا اختصارًا.
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";

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
  surahs,
}: {
  cycle: Cycle | null;
  sessions: Session[];
  surahs: Record<number, string>;
}) {
  const [open, setOpen] = useState<{ week: number; session: Session | null } | null>(null);

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
          const sess = byWeek.get(w) ?? null;
          const m = meta[sess?.status ?? "pending"];
          const filled = m.bg !== "transparent";
          return (
            <Pressable
              key={w}
              onPress={() => setOpen({ week: w, session: sess })}
              accessibilityRole="button"
              accessibilityLabel={`${s.overview.week} ${w} — ${m.label}`}
              style={({ pressed }) => ({
                width: 46,
                height: 46,
                borderRadius: 8,
                borderWidth: filled ? 0 : 1,
                borderColor: c.inkLine,
                backgroundColor: filled ? m.bg : alpha(c.ink, 0.6),
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.65 : 1,
              })}
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
            </Pressable>
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

      <Detail open={open} surahs={surahs} onClose={() => setOpen(null)} />
    </Card>
  );
}

function Detail({
  open,
  surahs,
  onClose,
}: {
  open: { week: number; session: Session | null } | null;
  surahs: Record<number, string>;
  onClose: () => void;
}) {
  const sess = open?.session ?? null;
  const m = sess ? meta[sess.status] : null;
  const recorded = sess && sess.status !== "pending";

  return (
    <Modal
      visible={open !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* الضغط خارج اللوح يغلقه — ما يتوقّعه كلّ من استعمل تطبيقًا */}
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: c.inkSoft,
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            borderTopWidth: 1,
            borderColor: alpha(c.gold, 0.3),
            paddingHorizontal: 22,
            paddingTop: 10,
            paddingBottom: 34,
            maxHeight: "80%",
          }}
        >
          {/* مقبض السحب — إشارةٌ بصرية أنّ اللوح يُغلق */}
          <View
            style={{
              alignSelf: "center",
              width: 42,
              height: 4,
              borderRadius: 2,
              backgroundColor: alpha(c.parchment, 0.25),
              marginBottom: 16,
            }}
          />

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={{ fontFamily: f.logo, fontSize: 20, lineHeight: 34, color: c.goldLight }}>
              {s.overview.week} {open?.week}
            </Text>
            {m && recorded ? (
              <View
                style={{
                  backgroundColor: m.bg,
                  borderRadius: 4,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}
              >
                <Text style={{ fontFamily: f.bodyBold, fontSize: 11, color: "#fff" }}>
                  {m.label}
                </Text>
              </View>
            ) : null}
          </View>

          {recorded ? (
            <ScrollView style={{ marginTop: 8 }}>
              {sess.surah_number ? (
                <Row
                  label={s.detail.range}
                  value={`${surahs[sess.surah_number] ?? ""}${
                    sess.ayah_from && sess.ayah_to
                      ? ` — ${s.detail.from} ${sess.ayah_from} ${s.detail.to} ${sess.ayah_to}`
                      : ""
                  }`}
                />
              ) : null}
              {sess.mistakes !== null ? (
                <Row label={s.detail.mistakes} value={String(sess.mistakes)} />
              ) : null}
              {sess.scheduled_date ? (
                <Row label={s.detail.date} value={sess.scheduled_date} />
              ) : null}
              {sess.notes ? <Row label={s.detail.notes} value={sess.notes} /> : null}
            </ScrollView>
          ) : (
            <Text
              style={{
                fontFamily: f.body,
                fontSize: 14,
                lineHeight: 28,
                color: alpha(c.parchment, 0.6),
                marginTop: 14,
              }}
            >
              {s.detail.none}
            </Text>
          )}

          <Pressable
            onPress={onClose}
            style={({ pressed }) => ({
              marginTop: 22,
              borderWidth: 1,
              borderColor: alpha(c.gold, 0.4),
              borderRadius: 3,
              paddingVertical: 12,
              alignItems: "center",
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Text style={{ fontFamily: f.bodyBold, fontSize: 15, color: c.gold }}>
              {s.detail.close}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        paddingVertical: 11,
        borderBottomWidth: 1,
        borderBottomColor: alpha(c.inkLine, 0.7),
      }}
    >
      <Text style={{ fontFamily: f.body, fontSize: 12, color: alpha(c.parchment, 0.55) }}>
        {label}
      </Text>
      <Text
        style={{
          fontFamily: f.body,
          fontSize: 15,
          lineHeight: 28,
          color: c.parchment,
          marginTop: 3,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
