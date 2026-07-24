import type { Metadata } from "next";
import { strings } from "@/lib/strings";
import ResetForm from "./ResetForm";

export const metadata: Metadata = {
  title: `${strings.auth.resetTitle} — ${strings.auth.brand}`,
};

export default function ResetPasswordPage() {
  return <ResetForm />;
}
