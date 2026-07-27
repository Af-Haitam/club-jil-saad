// يقرأ app.json ثمّ يعدّل ما يجب أن يأتي من البيئة.
//
// **رقم البناء:** أندرويد يرفض تثبيت نسخةٍ رقمها أقلّ من المثبَّتة، فرقم
// تشغيل GitHub Actions يصلح رقمًا: لا يتكرّر ولا يتناقص. الأساس 100 لأنّ
// قشرة TWA بلغت 6، وهذه النسخة يجب أن تعلوها لتُثبَّت مكانها لا بجانبها.
//
// **نسخة التجربة:** باسم حزمةٍ مختلف عمدًا، ليقف التطبيقان جنبًا إلى جنب
// على الهاتف نفسه. بلا ذلك تحلّ نسخة التجربة محلّ التطبيق العامل — ومعه
// تنبيهاته — لمجرّد إلقاء نظرة عليها.
const beta = process.env.APP_VARIANT === "beta";

module.exports = ({ config }) => ({
  ...config,
  name: beta ? "الجيل الصاعد (تجربة)" : config.name,
  android: {
    ...config.android,
    package: beta ? `${config.android.package}.beta` : config.android.package,
    versionCode: process.env.VERSION_CODE
      ? 100 + Number(process.env.VERSION_CODE)
      : config.android.versionCode,
  },
});
