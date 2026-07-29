// الأسئلة السابقة.
//
// سؤالٌ أُجيب عنه ينسحب من شاشة المتابعة بعد خمس ثوانٍ — وهذا مكانه بعدها.
// الفائدة في الشرح لا في النقطة، والشرح يُقرأ بعد أسبوعٍ كما يُقرأ بعد
// دقيقة، فلا معنى لأن يضيع بانسحاب البطاقة.
import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { getQuestions, type Question } from "../lib/quiz";
import { s, pointsLabel } from "../lib/strings";
import { f, alpha } from "../lib/theme";
import { useTheme } from "../lib/useTheme";
import Card from "../components/Card";

const ABJAD = ["أ", "ب", "ج", "د", "هـ", "و"];

export default function QuestionsArchive() {
  const { t } = useTheme();
  const [items, setItems] = useState<Question[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const all = await getQuestions();
      // ما أُجيب عنه أو انقضى وقته — أمّا المفتوح الذي لم يُجب عنه فمكانه
      // شاشة المتابعة، ولا يُعرض هنا لئلّا يُجاب عنه من مكانين.
      setItems(all.filter((q) => q.answer !== null || q.expired));
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top"]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          paddingHorizontal: 20,
          paddingVertical: 14,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={s.detail.close}
          hitSlop={12}
        >
          {/* السهم إلى اليمين: الرجوع في واجهةٍ عربية يمضي مع اتّجاه القراءة */}
          <Text style={{ fontFamily: f.body, fontSize: 22, color: t.gold }}>→</Text>
        </Pressable>
        <Text style={{ fontFamily: f.logo, fontSize: 22, lineHeight: 36, color: t.goldSoft }}>
          {s.quiz.archiveTitle}
        </Text>
      </View>

      <FlatList
        data={items ?? []}
        keyExtractor={(q) => q.id}
        contentContainerStyle={{ padding: 20, paddingTop: 4, gap: 14 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
            tintColor={t.gold}
          />
        }
        ListEmptyComponent={
          items === null ? null : (
            <Text
              style={{
                fontFamily: f.body,
                fontSize: 14,
                lineHeight: 28,
                color: t.textFaint,
                textAlign: "center",
                marginTop: 40,
              }}
            >
              {s.quiz.archiveEmpty}
            </Text>
          )
        }
        renderItem={({ item }) => <PastQuestion q={item} />}
      />
    </SafeAreaView>
  );
}

function PastQuestion({ q }: { q: Question }) {
  const { t } = useTheme();
  const mine = q.answer?.option_ids ?? [];
  const won = q.answer?.is_correct ?? false;
  const skipped = q.answer === null;

  return (
    <Card>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 4,
            backgroundColor: alpha(skipped ? t.absent : won ? t.green : t.red, 0.18),
          }}
        >
          <Text
            style={{
              fontFamily: f.bodyBold,
              fontSize: 10,
              color: skipped ? t.absent : won ? t.green : t.red,
            }}
          >
            {skipped ? s.quiz.closed : won ? s.quiz.correct : s.quiz.wrong}
          </Text>
        </View>
        {won && q.answer ? (
          <Text style={{ fontFamily: f.displayBold, fontSize: 12, color: t.green }}>
            {pointsLabel(q.answer.points)}
          </Text>
        ) : null}
      </View>

      <Text
        style={{
          fontFamily: f.displayBold,
          fontSize: 17,
          lineHeight: 32,
          color: t.text,
          marginTop: 10,
        }}
      >
        {q.title}
      </Text>

      <View style={{ marginTop: 12, gap: 6 }}>
        {q.options.map((o, i) => {
          const isMine = mine.includes(o.id);
          const isRight = o.is_correct === true;
          const tone = isRight ? t.green : isMine ? t.red : t.line;
          return (
            <View
              key={o.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                borderWidth: 1,
                borderColor: tone,
                backgroundColor: isRight || isMine ? alpha(tone, 0.1) : "transparent",
                borderRadius: 9,
                paddingVertical: 9,
                paddingHorizontal: 12,
              }}
            >
              <Text style={{ fontFamily: f.bodyBold, fontSize: 11, color: t.goldSoft, width: 14 }}>
                {ABJAD[i] ?? i + 1}
              </Text>
              <Text style={{ flex: 1, fontFamily: f.body, fontSize: 14, lineHeight: 26, color: t.text }}>
                {o.body}
              </Text>
              {isRight ? (
                <Text style={{ color: t.green, fontFamily: f.bodyBold, fontSize: 13 }}>✓</Text>
              ) : isMine ? (
                <Text style={{ color: t.red, fontFamily: f.bodyBold, fontSize: 13 }}>✕</Text>
              ) : null}
            </View>
          );
        })}
      </View>

      {q.explanation ? (
        <Text
          style={{
            fontFamily: f.body,
            fontSize: 14,
            lineHeight: 30,
            color: t.textDim,
            marginTop: 12,
          }}
        >
          {q.explanation}
        </Text>
      ) : null}
    </Card>
  );
}
