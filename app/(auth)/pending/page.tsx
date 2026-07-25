// شاشة «في انتظار الموافقة» — خادمية، تقرأ الملف الشخصي وتحيّي بالاسم.
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/user";
import { signOut } from "@/lib/auth/actions";
import { strings } from "@/lib/strings";

// العنوان يتبع الحالة أيضًا — وإلا بقي تبويب المتصفّح يقول «قيد المراجعة» لموقوف.
export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  const heading = profile?.status === "suspended" ? strings.auth.suspendedTitle : strings.auth.pendingTitle;
  return { title: `${heading} — ${strings.auth.brand}` };
}

export default async function PendingPage() {
  const profile = await getProfile();
  if (profile?.status === "active") redirect("/dashboard");
  const a = strings.auth;

  // موقوف ≠ قيد المراجعة: المراجعة انتهت، فقول «سيطّلع عليه المشرف قريبًا» كذب.
  const isSuspended = profile?.status === "suspended";

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <span className="thread-node" aria-hidden="true" />

      <div>
        <h1 className="font-body font-bold text-2xl text-gold-light">
          {isSuspended ? a.suspendedTitle : a.pendingTitle}
        </h1>
        {profile?.full_name && <p className="mt-2 font-medium text-parchment">{profile.full_name}</p>}
      </div>

      <p className="max-w-sm leading-8 text-parchment/75">{isSuspended ? a.suspendedBody : a.pendingBody}</p>
      <p className="text-sm text-parchment/55">{isSuspended ? a.suspendedHint : a.pendingHint}</p>

      <form action={signOut} className="mt-2 w-full">
        <button
          type="submit"
          className="w-full rounded-sm border border-gold px-6 py-2.5 text-gold transition-colors duration-200 hover:bg-gold hover:text-ink"
        >
          {a.signOut}
        </button>
      </form>
    </div>
  );
}
