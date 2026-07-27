// نصوص الواجهة — عربية كلّها، كما في الموقع. نسخة مستقلّة عن
// `web/lib/strings.ts` عمدًا: التطبيق يحمل ما يعرضه فقط، لا نصوص الإدارة.
export const s = {
  brand: "نادي الجيل الصاعد",

  login: {
    title: "تسجيل الدخول",
    welcome: "أهلًا بعودتك",
    email: "البريد الإلكتروني",
    emailPh: "أدخل بريدك الإلكتروني",
    password: "كلمة المرور",
    passwordPh: "٨ أحرف على الأقل",
    submit: "دخول",
    submitting: "جارٍ الدخول…",
    failed: "البريد أو كلمة المرور غير صحيحة",
    offline: "تعذّر الاتصال — تحقّق من الإنترنت وأعد المحاولة",
    pending: "حسابك ينتظر موافقة المشرف",
    onWeb: "لإنشاء حساب أو استرجاع كلمة المرور، افتح موقع النادي",
  },

  tabs: {
    overview: "المتابعة",
    inbox: "الإشعارات",
    profile: "ملفي",
  },

  overview: {
    greeting: "مرحباً",
    positionTitle: "موضعك في الحفظ",
    positionAt: "تقف عند",
    positionNone: "لم تبدأ بعد — سيظهر تقدّمك هنا بعد أوّل تسميع بإذن الله",
    juz: "الأجزاء المحفوظة",
    pages: "الصفحات",
    ayah: "آية",
    gridTitle: "جدول تتبّع الحفظ",
    week: "الأسبوع",
    exam: "الاختبار",
    noCycle: "لا توجد دورة نشطة بعد",
    examTitle: "الاختبار القادم",
    examNone: "لا اختبار مقرَّر حاليًا",
    examRemaining: "باقٍ",
    day: "يوم",
    today: "اليوم",
  },

  status: {
    green: "أتقن",
    red: "لم يُتقن",
    absent: "غاب",
    excused: "بعذر",
    pending: "لم يحن",
  },

  inbox: {
    title: "صندوق الإشعارات",
    empty: "لا إشعارات بعد — سيصلك كلّ جديدٍ هنا",
    unread: "جديد",
    markAll: "تعليم الكل كمقروء",
  },

  profile: {
    title: "ملفي",
    name: "الاسم",
    email: "البريد الإلكتروني",
    phone: "الهاتف",
    sessionDay: "يوم التسميع",
    signOut: "تسجيل الخروج",
  },

  push: {
    title: "تنبيهات الجهاز",
    body: "فعّلها ليصلك تذكير حصّتك وإعلانات النادي.",
    enable: "فعّل التنبيهات",
    on: "التنبيهات مفعّلة",
    denied: "التنبيهات ممنوعة — فعّلها من إعدادات الهاتف",
  },

  common: {
    retry: "أعِد المحاولة",
    loading: "جارٍ التحميل…",
    error: "تعذّر جلب البيانات",
  },
} as const;

/** أيام الأسبوع كما في القاعدة (‎session_day‎). */
export const weekdays: Record<string, string> = {
  sunday: "الأحد",
  monday: "الاثنين",
  tuesday: "الثلاثاء",
  wednesday: "الأربعاء",
  thursday: "الخميس",
  friday: "الجمعة",
  saturday: "السبت",
};
