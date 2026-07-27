// يقرأ app.json ثمّ يسمح لـCI برفع رقم البناء بلا تعديل ملفّ.
//
// أندرويد يرفض تثبيت نسخةٍ رقمها أقلّ من المثبَّتة، فرقم تشغيل GitHub
// Actions يصلح رقمًا: لا يتكرّر ولا يتناقص. الأساس 100 لأنّ قشرة TWA بلغت 6،
// وهذه النسخة يجب أن تعلوها لتُثبَّت مكانها لا بجانبها.
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    versionCode: process.env.VERSION_CODE
      ? 100 + Number(process.env.VERSION_CODE)
      : config.android.versionCode,
  },
});
