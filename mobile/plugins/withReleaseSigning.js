// إضافة إعداد: توقيع نسخة الإصدار بمفتاح النادي.
//
// `expo prebuild` يولّد مشروع أندرويد موقّعًا بمفتاح التصحيح — وهو مفتاحٌ
// عامّ يعرفه الجميع، وتطبيقٌ موقَّع به لا يمكن تحديثه ولا التحقّق منه. هذه
// الإضافة تحقن إعداد التوقيع الحقيقي وقت التوليد، فيبقى ملفّ build.gradle
// مولَّدًا لا مُعدَّلًا يدويًّا (المجلّد android/ لا يُرفع أصلًا).
//
// المفتاح يأتي من البيئة لا من الملفّ: بناءٌ محلّي بلا متغيّرات ينتج نسخةً
// موقَّعة بمفتاح التصحيح كالمعتاد، وCI وحده يوقّع بالمفتاح الحقيقي.
const { withAppBuildGradle } = require("expo/config-plugins");

const RELEASE_CONFIG = `
        release {
            if (System.getenv("ANDROID_KEYSTORE_PATH")) {
                storeFile file(System.getenv("ANDROID_KEYSTORE_PATH"))
                storeType "PKCS12"
                storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
                keyAlias System.getenv("ANDROID_KEY_ALIAS")
                keyPassword System.getenv("ANDROID_KEY_PASSWORD")
            }
            // AGP يُسقط توقيع v1 تلقائيًّا حين يكون minSdk 24 فما فوق، لأنّ
            // v2 يكفي نظريًّا من أندرويد 7. وقشرة TWA — بـminSdk 21 — احتفظت
            // به، وهي الفرق الوحيد ذو المعنى بين حزمةٍ رفض الهاتف تحليلها
            // وحزمةٍ لم يرفضها. إبقاؤه لا يكلّف شيئًا وقت التشغيل، ويحذف
            // متغيّرًا من المعادلة.
            enableV1Signing true
            enableV2Signing true
            enableV3Signing true
        }`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let src = cfg.modResults.contents;

    if (!src.includes("signingConfigs {")) {
      throw new Error("withReleaseSigning: لم يُعثر على signingConfigs في build.gradle");
    }

    // العلامة سطرٌ لا يكتبه إلّا هذا الملفّ. المحاولة الأولى بحثت عن
    // `release {` داخل signingConfigs بتعبيرٍ نمطيّ، فالتقطت `release {`
    // الذي في buildTypes وظنّت العمل منجزًا — فأشار البناء إلى إعداد توقيعٍ
    // غير موجود. علامةٌ خاصّة أصدق من محاولة وصف بنية الملفّ.
    if (!src.includes('storeType "PKCS12"')) {
      src = src.replace("signingConfigs {", `signingConfigs {${RELEASE_CONFIG}`);
    }

    // نوع البناء release يشير افتراضيًّا إلى signingConfigs.debug — نحوّله.
    const before = src;
    src = src.replace(
      /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/,
      '$1signingConfig System.getenv("ANDROID_KEYSTORE_PATH") ? signingConfigs.release : signingConfigs.debug',
    );
    if (src === before) {
      throw new Error("withReleaseSigning: لم يُعثر على signingConfig في نوع البناء release");
    }

    cfg.modResults.contents = src;
    return cfg;
  });
};
