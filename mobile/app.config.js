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

/**
 * أيّ ملفّ Firebase يوافق الحزمة التي نبنيها؟
 *
 * ⚠️ **مشروعان منفصلان مؤقّتًا.** أُنشئ `club-jill-saed` للتطبيق و
 * `club-jill-saed-beta` لنسخة التجربة. وملفّ google-services يخصّ مشروعًا
 * واحدًا لا مشروعين، فلا يمكن دمجهما في ملفّ — لكلٍّ ملفّه.
 *
 * والأهمّ أنّ **الإرسال يخصّ مشروعًا أيضًا**: مفتاح حساب الخدمة يرسل إلى
 * مشروعه وحده. فالخادم بمفتاحٍ واحد لا يبلغ التطبيقين. الوجهة الصحيحة
 * مشروعٌ واحد يحمل الحزمتين — وحتى يُدمجا، هذا يبقيهما يبنيان.
 *
 * وإضافة google-services إلى Gradle **تُفشل البناء** إن لم تجد عميلًا
 * مطابقًا لاسم الحزمة، فبدل أن ينهار بناءٌ يستغرق ثلاث عشرة دقيقة على سطرٍ
 * في ملفّ إعداد، نقرأ الملفّات هنا ونقرّر:
 *
 *   مسجَّلة   → تُضاف، والتنبيهات تعمل
 *   غير مسجّلة → تُترك، والبناء ينجح والتنبيهات وحدها غائبة
 */
function googleServicesFor(packageName) {
  for (const file of ["google-services.json", "google-services.beta.json"]) {
    try {
      const json = JSON.parse(fs.readFileSync(path.join(__dirname, file), "utf8"));
      const known = (json.client ?? []).some(
        (c) => c?.client_info?.android_client_info?.package_name === packageName,
      );
      if (known) return `./${file}`;
    } catch {
      // ملفٌّ غير موجود أو تالف — نجرّب التالي.
    }
  }
  return undefined;
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
