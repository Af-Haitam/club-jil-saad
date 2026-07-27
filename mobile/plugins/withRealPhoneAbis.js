// إضافة إعداد: احذف معماريّات المحاكي من الحزمة.
//
// النسخة الأولى بلغت **100.7 ميغابايت**، وقياسُ محتواها أوضح السبب:
//
//   lib/x86        22.0 MB   ← محاكي فقط
//   lib/x86_64     21.5 MB   ← محاكي فقط
//   lib/arm64-v8a  21.0 MB   ← هواتف حقيقية
//   lib/armeabi-v7a 14.5 MB  ← هواتف أقدم
//
// لا هاتف أندرويد يُباع اليوم بمعمارية x86؛ هما للمحاكي على الحاسوب. فحملُهما
// إلى هاتف عضوٍ يدفع ثمن باقته إهدارٌ محض: **43.5 ميغابايت** لا تُستعمل أبدًا.
//
// أُبقيت armeabi-v7a رغم أنّ أغلب الهواتف الحديثة arm64: إسقاطها يوفّر 14
// ميغابايت، لكنّ عضوًا بهاتفٍ أقدم سيجد التطبيق يرفض التثبيت بلا سببٍ مفهوم.
const { withGradleProperties } = require("expo/config-plugins");

const ABIS = "armeabi-v7a,arm64-v8a";

module.exports = function withRealPhoneAbis(config) {
  return withGradleProperties(config, (cfg) => {
    const key = "reactNativeArchitectures";
    const existing = cfg.modResults.find(
      (item) => item.type === "property" && item.key === key,
    );

    if (existing) {
      existing.value = ABIS;
    } else {
      cfg.modResults.push({ type: "property", key, value: ABIS });
    }

    return cfg;
  });
};
