import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/dashboard/queries";
import PositionCard from "@/components/dashboard/PositionCard";
import WeeklyGrid from "@/components/dashboard/WeeklyGrid";
import ExamCard from "@/components/dashboard/ExamCard";
import Announcements from "@/components/dashboard/Announcements";
import Reminders from "@/components/dashboard/Reminders";
import QuestionCard from "@/components/dashboard/QuestionCard";
import ScoreCard from "@/components/dashboard/ScoreCard";
import { getQuiz } from "@/lib/dashboard/quiz";
import { strings } from "@/lib/strings";

export const metadata: Metadata = {
  title: `${strings.dashboard.navOverview} — ${strings.auth.brand}`,
};

export default async function DashboardPage() {
  const [data, quiz] = await Promise.all([getDashboardData(), getQuiz()]);
  if (!data) redirect("/login");

  return (
    <div className="flex flex-col gap-6">
      {/* السؤال أوّلًا: له وقتٌ ينقضي، وما تحته باقٍ لا يفوت */}
      {quiz?.open && <QuestionCard question={quiz.open} />}
      <PositionCard progress={data.progress} surahs={data.surahs} />
      <WeeklyGrid cycle={data.cycle} sessions={data.sessions} surahs={data.surahs} />
      {/* الاختبار بطاقة عدّاد صغيرة، فتبقى بنصف العرض على الشاشات الواسعة.
          الإعلانات خرجت من الشبكة: البطاقة صارت ملصقًا بصورة، والملصق يحتاج
          العرض كاملًا. */}
      <div className="grid gap-6 md:grid-cols-2">
        <ExamCard exam={data.exam} surahs={data.surahs} />
      </div>
      <Announcements items={data.announcements} />
      <Reminders items={data.reminders} />
      {/* النقاط في الذيل: نظرةٌ إلى الوراء، لا شيء يُفعل بها الآن */}
      {quiz && <ScoreCard score={quiz.score} board={quiz.board} />}
    </div>
  );
}
