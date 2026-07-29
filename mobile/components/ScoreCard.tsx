// نقاطي والمتصدّرون.
//
// الترتيب يُحسب في القاعدة على **كلّ** الأعضاء لا على العشرة الظاهرين،
// فمن كان الحادي عشر يقرأ «11» لا فراغًا. ولوحة المتصدّرين تكشف أسماء
// أعضاءٍ آخرين — وهو الشيء الوحيد في التطبيق كلّه الذي يفعل ذلك، ولذلك
// تمرّ عبر دالّةٍ مُعرِّفة تعيد الاسم والنقاط فقط، لا صفَّ الملفّ كلّه.
import { Text, View } from "react-native";

import type { BoardRow, Score } from "../lib/quiz";
import { s, pointsLabel } from "../lib/strings";
import { f, alpha } from "../lib/theme";
import { useTheme } from "../lib/useTheme";
import Card from "./Card";

export default function ScoreCard({ score, board }: { score: Score; board: BoardRow[] }) {
  const { t } = useTheme();

  return (
    <Card title={s.quiz.scoreTitle}>
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 14 }}>
        <Text style={{ fontFamily: f.displayBold, fontSize: 42, lineHeight: 54, color: t.gold }}>
          {score.points}
        </Text>
        <View style={{ flex: 1, paddingBottom: 9 }}>
          <Text style={{ fontFamily: f.body, fontSize: 13, color: t.textDim }}>
            {pointsLabel(score.points)}
          </Text>
          <Text style={{ fontFamily: f.body, fontSize: 12, color: t.textFaint, marginTop: 2 }}>
            {score.answered === 0
              ? s.quiz.noneYet
              : s.quiz.answeredOf
                  .replace("{n}", String(score.answered))
                  .replace("{c}", String(score.correct))}
          </Text>
        </View>
        {score.position ? (
          <View
            style={{
              alignItems: "center",
              borderWidth: 1,
              borderColor: alpha(t.gold, 0.4),
              borderRadius: 10,
              paddingHorizontal: 13,
              paddingVertical: 7,
            }}
          >
            <Text style={{ fontFamily: f.displayBold, fontSize: 19, color: t.goldSoft }}>
              {score.position}
            </Text>
            <Text style={{ fontFamily: f.body, fontSize: 10, color: t.textFaint }}>
              {s.quiz.rank}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={{ height: 1, backgroundColor: t.line, marginVertical: 16 }} />

      <Text style={{ fontFamily: f.display, fontSize: 14, color: t.gold, marginBottom: 10 }}>
        {s.quiz.board}
      </Text>

      {board.length === 0 ? (
        <Text style={{ fontFamily: f.body, fontSize: 13, lineHeight: 26, color: t.textFaint }}>
          {s.quiz.boardEmpty}
        </Text>
      ) : (
        <View style={{ gap: 2 }}>
          {board.map((r) => (
            <View
              key={r.member_id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 11,
                paddingVertical: 8,
                paddingHorizontal: 9,
                borderRadius: 8,
                // صفّي مميَّزٌ بخلفيةٍ لا بلونِ خطٍّ مختلف: العين تجده فورًا
                // ولو كان في آخر القائمة.
                backgroundColor: r.is_me ? alpha(t.gold, 0.11) : "transparent",
              }}
            >
              <Text
                style={{
                  fontFamily: f.displayBold,
                  fontSize: 13,
                  color: r.position <= 3 ? t.gold : t.textFaint,
                  width: 20,
                  textAlign: "center",
                }}
              >
                {r.position}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  flex: 1,
                  fontFamily: r.is_me ? f.bodyBold : f.body,
                  fontSize: 14,
                  color: r.is_me ? t.goldSoft : t.text,
                }}
              >
                {r.full_name}
              </Text>
              <Text style={{ fontFamily: f.displayBold, fontSize: 14, color: t.textDim }}>
                {r.points}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}
