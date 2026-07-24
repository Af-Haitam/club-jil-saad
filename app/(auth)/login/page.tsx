import type { Metadata } from "next";
import { strings } from "@/lib/strings";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: `${strings.auth.loginTitle} — ${strings.auth.brand}`,
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const initialError =
    error === "link_expired" ? strings.auth.errLinkExpired : undefined;
  return <LoginForm initialError={initialError} />;
}
