"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * reducedMotion="user" يجعل framer-motion يحترم تفضيل تقليل الحركة داخليًا
 * بعد التحميل — بدل التفريع على useReducedMotion وقت العرض الأول،
 * الذي كان يسبب اختلاف ترطيب (hydration mismatch) لمستخدمي تقليل الحركة.
 */
export default function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
