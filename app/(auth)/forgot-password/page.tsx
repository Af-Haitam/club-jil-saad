import type { Metadata } from "next";
import { strings } from "@/lib/strings";
import ForgotForm from "./ForgotForm";

export const metadata: Metadata = {
  title: `${strings.auth.forgotTitle} — ${strings.auth.brand}`,
};

export default function ForgotPasswordPage() {
  return <ForgotForm />;
}
