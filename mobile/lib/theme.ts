// السمات الثلاث.
//
// هويّة النادي ذهبٌ على حبر، وهي الأصل. أُضيفت إليها سمةٌ فاتحة لمن يقرأ
// في الشمس، وسمةٌ سوداء تمامًا: شاشات AMOLED تُطفئ البكسل الأسود فعلًا،
// فالأسود الخالص يوفّر بطارية ولا يتوهّج في الظلام.
//
// الذهب يتغيّر بين السمتين عمدًا: ‎#C9A227‎ على الرقّ يعطي تباينًا دون
// الحدّ المقروء، فالفاتحة تستعمل ‎gold-deep‎ (‎#755B0F‎) — وهو اللون الذي
// اختير في الموقع لهذا السبب نفسه.

export type ThemeName = "dark" | "black" | "light";

export type Palette = {
  bg: string;
  surface: string;
  line: string;
  gold: string;
  goldSoft: string;
  text: string;
  textDim: string;
  textFaint: string;
  onGold: string;
  green: string;
  red: string;
  absent: string;
  excused: string;
  /** لون شريط الحالة ولوحة النظام. */
  statusBar: "light" | "dark";
};

const shared = {
  green: "#2E8B46",
  red: "#C04545",
  absent: "#D07D2B",
  excused: "#4F86C0",
};

export const palettes: Record<ThemeName, Palette> = {
  // الأصل — نفس ألوان الموقع حرفًا بحرف
  dark: {
    bg: "#14100B",
    surface: "#201910",
    line: "#3A2F1E",
    gold: "#C9A227",
    goldSoft: "#E8C96A",
    text: "#F4EDDC",
    textDim: "rgba(244,237,220,0.72)",
    textFaint: "rgba(244,237,220,0.5)",
    onGold: "#14100B",
    statusBar: "light",
    ...shared,
  },
  // أسود خالص — البكسل مُطفأ على AMOLED
  black: {
    bg: "#000000",
    surface: "#0D0B07",
    line: "#241D12",
    gold: "#C9A227",
    goldSoft: "#E8C96A",
    text: "#F4EDDC",
    textDim: "rgba(244,237,220,0.72)",
    textFaint: "rgba(244,237,220,0.5)",
    onGold: "#000000",
    statusBar: "light",
    ...shared,
  },
  // رقّ ومداد — الذهب هنا غامق ليمرّ التباين
  light: {
    bg: "#F4EDDC",
    surface: "#FBF7EC",
    line: "#DCCFAE",
    gold: "#755B0F",
    goldSoft: "#5C4709",
    text: "#14100B",
    textDim: "rgba(20,16,11,0.75)",
    textFaint: "rgba(20,16,11,0.55)",
    onGold: "#F4EDDC",
    statusBar: "dark",
    ...shared,
  },
};

/** أسماء الخطوط كما تُسجَّل في useFonts — لا كأسماء الحزم. */
export const f = {
  logo: "Lalezar",
  display: "ReemKufi",
  displayBold: "ReemKufi_600",
  body: "Tajawal",
  bodyBold: "Tajawal_700",
} as const;

/** شفافية على لون سداسي — RN لا يفهم `text-parchment/70`. */
export const alpha = (hex: string, a: number) => {
  if (!hex.startsWith("#") || hex.length !== 7) return hex;
  const n = Math.round(Math.min(1, Math.max(0, a)) * 255);
  return hex + n.toString(16).padStart(2, "0");
};
