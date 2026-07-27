// نفس ألوان الموقع حرفًا بحرف (‎globals.css‎). لو انحرف لونٌ هنا لبدا
// التطبيق تطبيقًا آخر لناد آخر.
export const c = {
  ink: "#14100B",
  inkSoft: "#201910",
  inkLine: "#3A2F1E",
  gold: "#C9A227",
  goldLight: "#E8C96A",
  goldDeep: "#755B0F",
  parchment: "#F4EDDC",
  navy: "#232C54",
  green: "#2E8B46", // أتقن
  red: "#C04545", // لم يُتقن
  absent: "#D07D2B", // غاب
  excused: "#4F86C0", // بعذر
} as const;

// أسماء الخطوط كما تُسجَّل في useFonts — لا كأسماء الحزم.
export const f = {
  logo: "Lalezar", // اسم النادي والعناوين الكبرى
  display: "ReemKufi", // العناوين
  displayBold: "ReemKufi_600",
  body: "Tajawal",
  bodyBold: "Tajawal_700",
} as const;

/** شفافية على لون — RN لا يفهم `text-parchment/70`. */
export const alpha = (hex: string, a: number) => {
  const n = Math.round(Math.min(1, Math.max(0, a)) * 255);
  return hex + n.toString(16).padStart(2, "0");
};
