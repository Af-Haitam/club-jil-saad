// المتابعة — موضع الحفظ، شبكة الأسابيع، والاختبار القادم.
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSession } from "../../lib/session";
import { getOverview, type Overview } from "../../lib/queries";
import { s } from "../../lib/strings";
import { f, alpha } from "../../lib/theme";
import { useTheme } from "../../lib/useTheme";
import Loading from "../../components/Loading";
import Card from "../../components/Card";
import WeeklyGrid from "../../components/WeeklyGrid";

export default function OverviewScreen() {
  const { t } = useTheme();
  const { session, profile } = useSession();
  const [data, setData] = useState<Overview | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    try {
      setData(await getOverview(session.user.id));
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [session]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  if (!data && !failed) return <Loading />;

  const firstName = (profile?.full_name ?? "").trim().split(/\s+/)[0];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 32, gap: 16 }}
        refreshControl={
          // السحب للتحديث — إيماءة يعرفها كلّ من استعمل تطبيقًا
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.gold} />
        }
      >
        <Text style={{ fontFamily: f.body, fontSize: 18, color: t.text }}>
          {s.overview.greeting}{" "}
          <Text style={{ fontFamily: f.bodyBold, color: t.goldSoft }}>{firstName}</Text>
        </Text>

        {failed ? (
          <Card>
            <Text style={{ fontFamily: f.body, fontSize: 14, color: t.absent }}>
              {s.common.error}
            </Text>
          </Card>
        ) : null}

        {data ? (
          <>
            <Position data={data} />
            <WeeklyGrid cycle={data.cycle} sessions={data.sessions} surahs={data.surahs} />
            <ExamCard data={data} />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Position({ data }: { data: Overview }) {
  const { t } = useTheme();
  const p = data.progress;
  const has = p && p.surah_number;
  return (
    <Card title={s.overview.positionTitle}>
      {has ? (
        <>
          <Text style={{ fontFamily: f.body, fontSize: 14, color: t.textDim }}>
            {s.overview.positionAt}
          </Text>
          <Text
            style={{ fontFamily: f.displayBold, fontSize: 22, color: t.goldSoft, marginTop: 4 }}
          >
            {data.surahs[p.surah_number as number] ?? ""}
            {p.ayah_number ? ` — ${s.overview.ayah} ${p.ayah_number}` : ""}
          </Text>
          <View style={{ flexDirection: "row", gap: 28, marginTop: 16 }}>
            <Stat label={s.overview.juz} value={p.juz_count ?? 0} />
            <Stat label={s.overview.pages} value={p.pages_count ?? 0} />
          </View>
        </>
      ) : (
        <Text
          style={{ fontFamily: f.body, fontSize: 14, lineHeight: 28, color: t.textFaint }}
        >
          {s.overview.positionNone}
        </Text>
      )}
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  const { t } = useTheme();
  return (
    <View>
      <Text style={{ fontFamily: f.displayBold, fontSize: 24, color: t.gold }}>{value}</Text>
      <Text style={{ fontFamily: f.body, fontSize: 12, color: t.textFaint }}>
        {label}
      </Text>
    </View>
  );
}

function ExamCard({ data }: { data: Overview }) {
  const { t } = useTheme();
  const e = data.exam;
  if (!e || !e.exam_date) {
    return (
      <Card title={s.overview.examTitle}>
        <Text style={{ fontFamily: f.body, fontSize: 14, color: t.textFaint }}>
          {s.overview.examNone}
        </Text>
      </Card>
    );
  }

  // بالأيّام لا بالساعات: العدّاد الدقيق يوحي بإلحاحٍ لا معنى له هنا.
  const today = new Date();
  const target = new Date(e.exam_date);
  const days = Math.max(
    0,
    Math.round((target.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0)) / 86400000),
  );

  return (
    <Card title={s.overview.examTitle}>
      <Text style={{ fontFamily: f.displayBold, fontSize: 18, color: t.goldSoft }}>
        {e.title ?? s.overview.examTitle}
      </Text>
      <Text style={{ fontFamily: f.body, fontSize: 14, color: t.textDim, marginTop: 8 }}>
        {days === 0 ? s.overview.today : `${s.overview.examRemaining} ${days} ${s.overview.day}`}
        {e.place ? ` — ${e.place}` : ""}
      </Text>
    </Card>
  );
}
