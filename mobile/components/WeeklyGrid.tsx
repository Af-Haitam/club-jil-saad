// شبكة الأسابيع — قلب البرنامج.
//
// الألوان مأخوذة من جدول التتبّع الورقي للنادي نفسه، وهي نفسها في الموقع،
// ولا تتغيّر بتغيّر السمة: الأخضر أخضرُ على الرقّ وعلى الحبر سواء. ومعها
// رمزٌ داخل كلّ خلية: من لا يميّز الأحمر من الأخضر يقرأ الشبكة بالرمز.
//
// والخلية تُضغط. الشبكة وحدها تقول «أتقنتَ» أو «لم تُتقن»، أمّا ما سُمِّع
// وكم خطأً وما قاله المشرف فهو ما يعود إليه العضو فعلًا.
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";

import type { Cycle, Session } from "../lib/queries";
import { s } from "../lib/strings";
import { f, alpha } from "../lib/theme";
import { useTheme } from "../lib/useTheme";
import Card from "./Card";

type Meta = { bg: string; glyph: string; label: string };

function statusMeta(t: ReturnType<typeof useTheme>["t"]): Record<Session["status"], Meta> {
  return {
    green: { bg: t.green, glyph: "✓", label: s.status.green },
    red: { bg: t.red, glyph: "✕", label: s.status.red },
    absent: { bg: t.absent, glyph: "—", label: s.status.absent },
    excused: { bg: t.excused, glyph: "•", label: s.status.excused },
    pending: { bg: "transparent", glyph: "", label: s.status.pending },
  };
}

export default function WeeklyGrid({
  cycle,
  sessions,
  surahs,
}: {
  cycle: Cycle | null;
  sessions: Session[];
  surahs: Record<number, string>;
}) {
  const { t } = useTheme();
  const meta = statusMeta(t);
  const [open, setOpen] = useState<{ week: number; session: Session | null } | null>(null);

  if (!cycle) {
    return (
      <Card title={s.overview.gridTitle}>
        <Text style={{ fontFamily: f.body, fontSize: 14, color: t.textFaint }}>
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
                borderColor: t.line,
                backgroundColor: filled ? m.bg : t.bg,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.65 : 1,
              })}
            >
              <Text
                style={{
                  fontFamily: f.bodyBold,
                  fontSize: 12,
                  color: filled ? "#fff" : t.textFaint,
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
              <Text style={{ fontFamily: f.body, fontSize: 11, color: t.textFaint }}>
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
  const { t } = useTheme();
  const meta = statusMeta(t);
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
            backgroundColor: t.surface,
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            borderTopWidth: 1,
            borderColor: alpha(t.gold, 0.32),
            paddingHorizontal: 22,
            paddingTop: 10,
            paddingBottom: 34,
            maxHeight: "80%",
          }}
        >
          <View
            style={{
              alignSelf: "center",
              width: 42,
              height: 4,
              borderRadius: 2,
              backgroundColor: t.line,
              marginBottom: 16,
            }}
          />

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={{ fontFamily: f.logo, fontSize: 20, lineHeight: 34, color: t.goldSoft }}>
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
              {sess.from_surah ? (
                <Row
                  label={s.detail.range}
                  value={`${surahs[sess.from_surah] ?? ""}${
                    sess.from_ayah && sess.to_ayah
                      ? ` — ${s.detail.from} ${sess.from_ayah} ${s.detail.to} ${sess.to_ayah}`
                      : ""
                  }`}
                />
              ) : null}
              {sess.mistakes_count !== null ? (
                <Row label={s.detail.mistakes} value={String(sess.mistakes_count)} />
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
                color: t.textFaint,
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
              borderColor: alpha(t.gold, 0.45),
              borderRadius: 3,
              paddingVertical: 12,
              alignItems: "center",
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Text style={{ fontFamily: f.bodyBold, fontSize: 15, color: t.gold }}>
              {s.detail.close}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const { t } = useTheme();
  return (
    <View style={{ paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: t.line }}>
      <Text style={{ fontFamily: f.body, fontSize: 12, color: t.textFaint }}>{label}</Text>
      <Text
        style={{ fontFamily: f.body, fontSize: 15, lineHeight: 28, color: t.text, marginTop: 3 }}
      >
        {value}
      </Text>
    </View>
  );
}
