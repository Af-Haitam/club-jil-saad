// صياغة عدد من وصلتهم الرسالة بالعربية الصحيحة.
//
// العربية تميّز خمس صيغ للعدد، لا اثنتين كالإنجليزية: مفرد، مثنّى، جمع قلّة
// (٣–١٠ ← «أعضاء»)، ثم تمييز مفرد منصوب (١١+ ← «عضوًا»). «وصل إلى 2 أعضاء»
// خطأ يقرؤه العضو فورًا، فتستحقّ الحالة أن تُكتب كاملة.
import { strings } from "@/lib/strings";

export function recipientsLabel(count: number): string {
  const m = strings.manage;
  if (count <= 0) return m.sentZero;
  if (count === 1) return m.sentOne;
  if (count === 2) return m.sentTwo;

  // الحكم على آخر خانتين: 103 «أعضاء» بينما 100 و112 «عضوًا».
  const lastTwo = count % 100;
  const template = lastTwo >= 3 && lastTwo <= 10 ? m.sentFew : m.sentMany;
  return template.replace("{n}", String(count));
}

/** كم جهازًا اهتزّ فعلًا — نفس قواعد العدد. */
export function devicesLabel(count: number): string {
  const m = strings.manage;
  if (count <= 0) return m.devicesZero;
  if (count === 1) return m.devicesOne;
  if (count === 2) return m.devicesTwo;

  const lastTwo = count % 100;
  const template = lastTwo >= 3 && lastTwo <= 10 ? m.devicesFew : m.devicesMany;
  return template.replace("{n}", String(count));
}
