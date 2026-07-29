// سؤال النادي.
//
// ثلاث حالات لا رابع لها: مفتوحٌ لم يُجب عنه، ومُجابٌ عنه، ومُغلقٌ فات
// وقته. والفرق بينها ليس لونًا فحسب بل ما يُعرض أصلًا: الصواب لا يظهر في
// الأولى **لأنّ القاعدة لم ترسله**، لا لأنّ هذا المكوّن أخفاه.
//
// والاختيار على خطوتين عمدًا. الإجابة لا رجعة فيها، ولمسةٌ خاطئة على
// شاشةٍ في جيبٍ مهتزّ تحرق المحاولة الوحيدة. فالضغطة الأولى تُعلِّم،
// والثانية — على زرٍّ منفصل مكتوبٍ عليه ما سيحدث — تُرسل.
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Pressable, Text, View } from "react-native";

import type { Question } from "../lib/quiz";
import { submitAnswer } from "../lib/quiz";
import { s, pointsLabel } from "../lib/strings";
import { f, alpha } from "../lib/theme";
import { useTheme } from "../lib/useTheme";
import Card from "./Card";

/** أبجد هوّز — ترقيم الاختيارات كما يُرقَّم في الكتب العربية. */
const ABJAD = ["أ", "ب", "ج", "د", "هـ", "و"];

export default function QuestionCard({
  question,
  onAnswered,
}: {
  question: Question;
  onAnswered: () => void;
}) {
  const { t } = useTheme();
  const [picked, setPicked] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);

  const answered = question.answer !== null;
  const locked = answered || question.expired;

  // الكشف يظهر بهدوء — الوميض المفاجئ يوحي بلعبةٍ لا بدرس
  const reveal = useRef(new Animated.Value(answered ? 1 : 0)).current;
  useEffect(() => {
    if (answered) {
      Animated.timing(reveal, { toValue: 1, duration: 320, useNativeDriver: true }).start();
    }
  }, [answered, reveal]);

  const send = async () => {
    if (!picked || sending) return;
    setSending(true);
    setFailed(false);
    try {
      await submitAnswer(question.id, picked);
      onAnswered();
    } catch {
      setFailed(true);
      setSending(false);
    }
  };

  const correctId = question.options.find((o) => o.is_correct)?.id ?? null;
  const myId = question.answer?.option_id ?? null;
  const won = question.answer?.is_correct ?? false;

  return (
    <Card title={s.quiz.title}>
      <Text
        style={{
          fontFamily: f.displayBold,
          fontSize: 19,
          lineHeight: 36,
          color: t.text,
        }}
      >
        {question.title}
      </Text>

      {question.body ? (
        <Text
          style={{
            fontFamily: f.body,
            fontSize: 14,
            lineHeight: 28,
            color: t.textDim,
            marginTop: 8,
          }}
        >
          {question.body}
        </Text>
      ) : null}

      <View style={{ marginTop: 16, gap: 9 }}>
        {question.options.map((o, i) => {
          const isMine = myId === o.id;
          const isRight = correctId === o.id;
          const isPicked = picked === o.id && !locked;

          // بعد الإجابة: الصواب أخضر دائمًا، وخطؤك أحمر. وإن أصبتَ فهما واحد.
          let border = t.line;
          let bg = "transparent";
          let mark: string | null = null;
          if (locked && isRight) {
            border = t.green;
            bg = alpha(t.green, 0.14);
            mark = "✓";
          } else if (locked && isMine) {
            border = t.red;
            bg = alpha(t.red, 0.14);
            mark = "✕";
          } else if (isPicked) {
            border = t.gold;
            bg = alpha(t.gold, 0.12);
          }

          return (
            <Pressable
              key={o.id}
              disabled={locked || sending}
              onPress={() => setPicked(o.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isPicked || isMine, disabled: locked }}
              accessibilityLabel={`${ABJAD[i] ?? i + 1} — ${o.body}`}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                borderWidth: 1,
                borderColor: border,
                backgroundColor: bg,
                borderRadius: 11,
                paddingVertical: 13,
                paddingHorizontal: 14,
                opacity: pressed && !locked ? 0.7 : 1,
              })}
            >
              <View
                style={{
                  width: 27,
                  height: 27,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: isPicked ? t.gold : alpha(t.gold, 0.38),
                  backgroundColor: isPicked ? t.gold : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontFamily: f.bodyBold,
                    fontSize: 12,
                    color: isPicked ? t.onGold : t.goldSoft,
                  }}
                >
                  {ABJAD[i] ?? String(i + 1)}
                </Text>
              </View>

              <Text
                style={{
                  flex: 1,
                  fontFamily: f.body,
                  fontSize: 15,
                  lineHeight: 28,
                  color: t.text,
                }}
              >
                {o.body}
              </Text>

              {mark ? (
                <Text
                  style={{
                    fontFamily: f.bodyBold,
                    fontSize: 15,
                    color: isRight ? t.green : t.red,
                  }}
                >
                  {mark}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {/* ── ما قبل الإرسال ── */}
      {!locked ? (
        <>
          <Text
            style={{
              fontFamily: f.body,
              fontSize: 12,
              color: t.textFaint,
              marginTop: 13,
              textAlign: "center",
            }}
          >
            {s.quiz.once}
          </Text>

          {failed ? (
            <Text
              style={{
                fontFamily: f.body,
                fontSize: 13,
                color: t.red,
                marginTop: 9,
                textAlign: "center",
              }}
            >
              {s.quiz.failed}
            </Text>
          ) : null}

          <Pressable
            onPress={send}
            disabled={!picked || sending}
            accessibilityRole="button"
            style={({ pressed }) => ({
              marginTop: 12,
              borderRadius: 4,
              paddingVertical: 14,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: picked ? t.gold : alpha(t.gold, 0.16),
              opacity: pressed ? 0.75 : 1,
            })}
          >
            {sending ? (
              <ActivityIndicator color={t.onGold} />
            ) : (
              <Text
                style={{
                  fontFamily: f.bodyBold,
                  fontSize: 15,
                  color: picked ? t.onGold : t.textFaint,
                }}
              >
                {s.quiz.send}
              </Text>
            )}
          </Pressable>
        </>
      ) : null}

      {/* ── ما بعدها ── */}
      {answered ? (
        <Animated.View style={{ opacity: reveal, marginTop: 15 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 9,
              borderRadius: 10,
              paddingVertical: 11,
              paddingHorizontal: 13,
              backgroundColor: alpha(won ? t.green : t.red, 0.13),
            }}
          >
            <Text style={{ fontFamily: f.bodyBold, fontSize: 16, color: won ? t.green : t.red }}>
              {won ? "✓" : "✕"}
            </Text>
            <Text
              style={{
                flex: 1,
                fontFamily: f.bodyBold,
                fontSize: 14,
                color: won ? t.green : t.red,
              }}
            >
              {won ? s.quiz.correct : s.quiz.wrong}
            </Text>
            {won && question.answer ? (
              <Text style={{ fontFamily: f.displayBold, fontSize: 14, color: t.green }}>
                {pointsLabel(question.answer.points)}
              </Text>
            ) : null}
          </View>

          {question.explanation ? (
            <Text
              style={{
                fontFamily: f.body,
                fontSize: 14,
                lineHeight: 30,
                color: t.textDim,
                marginTop: 12,
              }}
            >
              {question.explanation}
            </Text>
          ) : null}
        </Animated.View>
      ) : question.expired ? (
        <Text
          style={{
            fontFamily: f.body,
            fontSize: 13,
            color: t.textFaint,
            marginTop: 14,
            textAlign: "center",
          }}
        >
          {s.quiz.closed}
        </Text>
      ) : null}
    </Card>
  );
}
