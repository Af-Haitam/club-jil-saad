// يقرأ app.json ثمّ يعدّل ما يجب أن يأتي من البيئة.
//
// **رقم البناء:** أندرويد يرفض تثبيت نسخةٍ رقمها أقلّ من المثبَّتة، فرقم
// تشغيل GitHub Actions يصلح رقمًا: لا يتكرّر ولا يتناقص. الأساس 100 لأنّ
// قشرة TWA بلغت 6، وهذه النسخة يجب أن تعلوها لتُثبَّت مكانها لا بجانبها.
//
// **نسخة التجربة:** باسم حزمةٍ مختلف عمدًا، ليقف التطبيقان جنبًا إلى جنب
// على الهاتف نفسه. بلا ذلك تحلّ نسخة التجربة محلّ التطبيق العامل — ومعه
// تنبيهاته — لمجرّد إلقاء نظرة عليها.
const fs = require("fs");
const path = require("path");

const beta = process.env.APP_VARIANT === "beta";
const GOOGLE_SERVICES = path.join(__dirname, "google-services.json");

/**
 * هل يعرف ملفّ Firebase اسم الحزمة التي نبنيها؟
 *
 * إضافة google-services إلى Gradle **تُفشل البناء** إذا لم تجد عميلًا
 * مطابقًا لاسم الحزمة — ونسخة التجربة تحمل لاحقة ‎.beta‎ لا تُسجَّل في
 * Firebase تلقائيًّا. فبدل أن ينهار بناءٌ يستغرق ثلاث عشرة دقيقة على سطرٍ
 * في ملفّ إعداد، نقرأ الملفّ هنا ونقرّر:
 *
 *   مسجَّلة   → تُضاف، والتنبيهات تعمل
 *   غير مسجّلة → تُترك، والبناء ينجح والتنبيهات وحدها غائبة
 */
function googleServicesFor(packageName) {
  try {
    const json = JSON.parse(fs.readFileSync(GOOGLE_SERVICES, "utf8"));
    const known = (json.client ?? []).some(
      (c) => c?.client_info?.android_client_info?.package_name === packageName,
    );
    return known ? "./google-services.json" : undefined;
  } catch {
    return undefined;
  }
}

module.exports = ({ config }) => {
  const packageName = beta
    ? `${config.android.package}.beta`
    : config.android.package;

  return {
    ...config,
    // كان مُهمَلًا: مسار البناء يقبل رقم إصدارٍ ثمّ يتجاهله، فتخرج كلّ نسخة
    // باسم 2.0.0 مهما كتبنا. رقم البناء وحده كان يتقدّم.
    version: process.env.VERSION_NAME || config.version,
    name: beta ? "الجيل الصاعد (تجربة)" : config.name,
    android: {
      ...config.android,
      package: packageName,
      googleServicesFile: googleServicesFor(packageName),
      versionCode: process.env.VERSION_CODE
        ? 100 + Number(process.env.VERSION_CODE)
        : config.android.versionCode,
    },
  };
};
