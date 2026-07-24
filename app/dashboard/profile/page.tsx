import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/user";
import ProfileForm from "./ProfileForm";
import { strings } from "@/lib/strings";

export const metadata: Metadata = {
  title: `${strings.dashboard.profileTitle} — ${strings.auth.brand}`,
};

export default async function ProfilePage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  return (
    <ProfileForm
      profile={{
        full_name: profile.full_name,
        phone: profile.phone,
        email: profile.email,
        session_day: profile.session_day,
        weekly_amount: profile.weekly_amount,
      }}
    />
  );
}
