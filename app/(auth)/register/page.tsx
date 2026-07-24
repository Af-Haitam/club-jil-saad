import type { Metadata } from "next";
import { strings } from "@/lib/strings";
import RegisterForm from "./RegisterForm";

export const metadata: Metadata = {
  title: `${strings.auth.registerTitle} — ${strings.auth.brand}`,
};

export default function RegisterPage() {
  return <RegisterForm />;
}
