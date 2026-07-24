import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/dashboard/queries";
import PositionCard from "@/components/dashboard/PositionCard";
import WeeklyGrid from "@/components/dashboard/WeeklyGrid";
import ExamCard from "@/components/dashboard/ExamCard";
import Announcements from "@/components/dashboard/Announcements";
import Reminders from "@/components/dashboard/Reminders";
import { strings } from "@/lib/strings";

export const metadata: Metadata = {
  title: `${strings.dashboard.navOverview} — ${strings.auth.brand}`,
};

export default async function DashboardPage() {
  const data = await getDashboardData();
  if (!data) redirect("/login");

  return (
    <div className="flex flex-col gap-6">
      <PositionCard progress={data.progress} surahs={data.surahs} />
      <WeeklyGrid cycle={data.cycle} sessions={data.sessions} surahs={data.surahs} />
      <div className="grid gap-6 md:grid-cols-2">
        <ExamCard exam={data.exam} surahs={data.surahs} />
        <Announcements items={data.announcements} />
      </div>
      <Reminders items={data.reminders} />
    </div>
  );
}
