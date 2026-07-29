// نصوص الواجهة الثابتة — ليست محتوى يحرّره المدير (ذاك في site-content.ts)
// بل عبارات الواجهة: alt، aria، تسميات الحقول.

export const strings = {
  logoAlt: "شعار نادي الجيل الصاعد",
  logoAltHero: "شعار نادي الجيل الصاعد — ريشة ذهبية",
  navBrand: "الجيل الصاعد",
  menuOpen: "افتح القائمة",
  menuClose: "أغلق القائمة",
  skipToContent: "انتقل إلى المحتوى",
  footerNavLabel: "روابط التذييل",
  contactTitle: "تواصل معنا",
  contactEmail: "البريد",
  contactPhone: "الهاتف",
  contactCity: "المدينة",
  contactSoon: "بيانات التواصل تُضاف قريبًا",
  rights: "جميع الحقوق محفوظة",
  statsHeading: "أرقام النادي",
  tracking: {
    caption:
      "نموذج توضيحي لجدول تتبّع برنامج الحفظ: أسابيع الدورة ثم الاختبار، الأخضر إتقان والأحمر لم يُتقن بعد",
    cellG: "أتقنَ الحفظ",
    cellR: "لم يُتقن بعد",
  },

  // ── الدخول والتسجيل (المرحلة ٢) ──
  auth: {
    brand: "نادي الجيل الصاعد",

    // الحقول المشتركة
    fullNameLabel: "الاسم الكامل",
    fullNamePlaceholder: "الاسم كما تحب أن يظهر",
    phoneLabel: "رقم الهاتف",
    phonePlaceholder: "06 أو 07 …",
    cityLabel: "المدينة",
    cityPlaceholder: "مدينتك",
    emailLabel: "البريد الإلكتروني",
    emailPlaceholder: "أدخل بريدك الإلكتروني",
    passwordLabel: "كلمة المرور",
    passwordPlaceholder: "٨ أحرف على الأقل",
    confirmLabel: "تأكيد كلمة المرور",
    confirmPlaceholder: "أعد كتابة كلمة المرور",
    sessionDayLabel: "يوم الاستظهار",
    sessionDayHint: "اليوم الذي تُسمّع فيه حفظك أسبوعيًا",
    weeklyAmountLabel: "مقدار الحفظ الأسبوعي",
    choosePlaceholder: "اختر…",

    // التسجيل
    registerTitle: "إنشاء حساب",
    registerSubtitle: "انضمّ إلى ركب الحفظة",
    pathQuestion: "كيف تريد الانضمام؟",
    pathClubTitle: "الانضمام للنادي",
    pathClubHint: "برنامج الحفظ + الأنشطة الدعوية للنادي",
    pathHifzTitle: "برنامج الحفظ فقط",
    pathHifzHint: "الاستظهار الأسبوعي لكتاب الله",
    registerSubmit: "إنشاء الحساب",
    registerSubmitting: "جارٍ الإنشاء…",
    checkEmail:
      "أنشأنا حسابك — تحقّق من بريدك الإلكتروني لتأكيده، ثم سجّل الدخول.",
    haveAccount: "لديك حساب بالفعل؟",
    goLogin: "سجّل الدخول",

    // الدخول
    loginTitle: "تسجيل الدخول",
    loginSubtitle: "أهلًا بعودتك",
    loginSubmit: "دخول",
    loginSubmitting: "جارٍ الدخول…",
    forgotLink: "نسيت كلمة المرور؟",
    noAccount: "ليس لديك حساب؟",
    goRegister: "أنشئ حسابًا",

    // استعادة كلمة المرور
    forgotTitle: "استعادة كلمة المرور",
    forgotSubtitle: "سنرسل إليك رابطًا لإعادة التعيين",
    forgotSubmit: "أرسل رابط الاستعادة",
    forgotSubmitting: "جارٍ الإرسال…",
    forgotSent:
      "إن كان هذا البريد مسجّلًا لدينا، فستصلك رسالة فيها رابط لإعادة تعيين كلمة المرور.",
    backToLogin: "العودة إلى الدخول",

    // كلمة مرور جديدة
    resetTitle: "كلمة مرور جديدة",
    resetSubtitle: "اختر كلمة مرور جديدة لحسابك",
    resetSubmit: "تحديث كلمة المرور",
    resetSubmitting: "جارٍ التحديث…",
    resetDone: "تم تحديث كلمة المرور بنجاح.",

    // في انتظار الموافقة
    pendingTitle: "حسابك قيد المراجعة",
    pendingBody:
      "تم استلام طلب انضمامك. سيطّلع عليه المشرف قريبًا، وستصلك رسالة فور قبول العضوية.",
    pendingHint: "لا حاجة لإعادة التسجيل — يكفي الانتظار.",

    // حساب موقوف/مرفوض — نصّ مختلف، فالمراجعة انتهت
    suspendedTitle: "حسابك موقوف",
    suspendedBody: "لم تُفعَّل عضويتك حاليًا. إن كنت ترى أنّ هذا خطأ فتواصل مع مشرف النادي.",
    suspendedHint: "إعادة التسجيل لن تغيّر شيئًا — التواصل مع المشرف هو الطريق.",
    signOut: "تسجيل الخروج",

    // لوحة مؤقتة (تُبنى في المرحلة ٣)
    dashboardStubTitle: "أهلًا بك",
    dashboardStubBody:
      "لوحة العضو قيد الإنشاء — ستظهر هنا متابعة حفظك قريبًا بإذن الله.",

    // رسائل الأخطاء — بصوت الواجهة، واضحة، دون اعتذار
    errRequired: "هذا الحقل مطلوب",
    errEmail: "أدخل بريدًا إلكترونيًا صحيحًا",
    errPasswordShort: "كلمة المرور ٨ أحرف على الأقل",
    errPasswordMismatch: "كلمتا المرور غير متطابقتين",
    errChooseDay: "اختر يوم الاستظهار",
    errChooseAmount: "اختر مقدار الحفظ",
    errEmailTaken: "هذا البريد مسجّل من قبل — جرّب تسجيل الدخول",
    errCredentials: "البريد أو كلمة المرور غير صحيحة",
    errGeneric: "تعذّر إتمام العملية، حاول مرة أخرى",
    errLinkExpired:
      "انتهت صلاحية الرابط أو أنه غير صالح — اطلب رابطًا جديدًا",
  },

  // ── لوحة العضو (المرحلة ٣) ──
  dashboard: {
    greeting: "مرحباً",
    navOverview: "المتابعة",
    navProfile: "ملفي",
    // اسم مقروء آليًّا لرابط الشعار — يبقى النصّ المرئي بداخله (معيار
    // «التسمية داخل الاسم»)، ويضيف وجهته لمن لا يرى الأيقونة.
    homeFromDashboard: "نادي الجيل الصاعد — الصفحة الرئيسية",
    signOut: "تسجيل الخروج",

    positionTitle: "موضعك في الحفظ",
    positionAt: "تقف عند",
    positionNone: "لم تبدأ بعد — سيظهر تقدّمك هنا بعد أوّل تسميع بإذن الله",
    juzLabel: "الأجزاء المحفوظة",
    pagesLabel: "الصفحات",
    surahWord: "سورة",
    ayahWord: "آية",

    gridTitle: "جدول تتبّع الحفظ",
    gridSubtitle: "دورتك الحالية — كل خلية تمثّل أسبوعًا، اضغط عليها لتفاصيل الحصة",
    weekWord: "الأسبوع",
    examCell: "أسبوع الاختبار",
    noCycle: "لا توجد دورة نشطة بعد — ستبدأ قريبًا بإذن الله",
    stGreen: "أتقن",
    stRed: "لم يُتقن",
    stAbsent: "غاب",
    stExcused: "بعذر",
    stPending: "لم يحن",

    detailStatus: "التقييم",
    detailRange: "المقدار",
    detailHizb: "الحزب",
    detailMistakes: "عدد الأخطاء",
    detailNotes: "ملاحظة المشرف",
    detailDate: "تاريخ الحصة",
    detailNone: "لم تُسجَّل هذه الحصة بعد",
    detailClose: "إغلاق",

    examTitle: "الاختبار القادم",
    examNone: "لا اختبار مقرَّر حاليًا",
    examRemaining: "باقٍ",
    examDays: "يومًا",
    examToday: "الاختبار اليوم",
    examPortion: "المقرَّر",
    examLocation: "المكان",

    annTitle: "الإعلانات",
    annNone: "لا إعلانات حاليًا",

    // ── المرحلة ٧: صندوق الإشعارات ──
    navInbox: "الإشعارات",
    inboxTitle: "صندوق الإشعارات",
    inboxSubtitle: "كل ما وصلك من إعلانات وتذكيرات ومواعيد",
    inboxNone: "لا إشعارات بعد — سيصلك هنا كل جديد بإذن الله",
    // عدّاد لا جملة: «غير مقروء · 3» يتجنّب صيغ العدد الخمس في العربية
    // ويقرأ بلمحة — والجملة الصحيحة نحويًا هنا كانت ستكلّف خمس عبارات.
    inboxUnreadLabel: "غير مقروء",
    inboxMarkAll: "تعليم الكل كمقروء",
    inboxMarking: "جارٍ…",
    inboxAllRead: "لا شيء غير مقروء",
    inboxNew: "جديد",
    kindAnnouncement: "إعلان",
    kindReminder: "تذكير",
    kindSystem: "من النادي",
    kindQuestion: "سؤال",

    // ── المسابقة ──
    quizTitle: "سؤال النادي",
    quizSend: "أرسل إجابتي",
    quizSending: "جارٍ الإرسال…",
    quizOnce: "لك محاولة واحدة، فتأنَّ",
    quizMultiHint: "لهذا السؤال أكثر من جوابٍ صحيح — اختر كلّ ما تراه صوابًا",
    quizCorrect: "إجابة صحيحة",
    quizWrong: "إجابة غير صحيحة",
    quizClosed: "أُغلق هذا السؤال",
    quizFailed: "تعذّر إرسال إجابتك — أعد المحاولة",
    quizScore: "نقاطي",
    quizRank: "الترتيب",
    quizBoard: "المتصدّرون",
    quizBoardEmpty: "لم يُجب أحدٌ بعد — كن أوّلهم",
    quizNoneYet: "لم تُجب عن سؤالٍ بعد",
    quizAnsweredOf: "أجبتَ عن {n}، أصبتَ في {c}",

    // تفعيل التنبيهات على الجهاز
    pushTitle: "تنبيهات الهاتف",
    pushBody: "فعّل التنبيهات ليصلك موعد تسميعك صباح يومك، دون فتح الموقع.",
    pushEnable: "فعّل التنبيهات على هذا الجهاز",
    pushEnabling: "جارٍ التفعيل…",
    pushOn: "التنبيهات مفعّلة على هذا الجهاز",
    pushDisable: "إيقاف التنبيهات هنا",
    pushDenied:
      "التنبيهات محظورة في إعدادات المتصفح. اسمح بها لهذا الموقع ثم أعد المحاولة.",
    pushUnsupported: "هذا المتصفح لا يدعم التنبيهات",
    pushFailed: "تعذّر تفعيل التنبيهات — حاول مرّة أخرى",
    pushIosTitle: "على الآيفون",
    pushIosBody:
      "التنبيهات على الآيفون لا تعمل من سفاري مباشرة. افتح زرّ المشاركة ثم «إضافة إلى الشاشة الرئيسية»، وافتح الموقع من الأيقونة الجديدة، ثم فعّل التنبيهات من هنا.",

    profileTitle: "ملفي الشخصي",
    profileSubtitle: "بيانات حسابك وتفضيلات الاستظهار",
    profileSave: "حفظ التغييرات",
    profileSaving: "جارٍ الحفظ…",
    profileSaved: "تم حفظ التغييرات بنجاح",
    backToDashboard: "العودة إلى اللوحة",
  },

  // ── نصوص المهمّة اليومية (المرحلة ٧) — تصل الهاتف، فلتكن قصيرة ──
  notify: {
    sessionTitle: "اليوم موعد تسميعك",
    sessionBody: "استعدّ لحصّتك — وفّقك الله.",
    sessionBodyAt: "حصّتك اليوم على الساعة {time} — وفّقك الله.",

    supervisorTitle: "طلابك اليوم",
    supervisorBody: "يُسمّع اليوم: {names}",

    examSoonTitle: "اختبارك بعد ثلاثة أيام",
    examTodayTitle: "اختبارك اليوم",
    examAt: "{title} — على الساعة {time}",
    examPlace: "{title} — {place}",
  },

  // ── صفحة التطبيق (المرحلة ٨) ──
  // هذه الصفحة تُقنع عضوًا بتثبيت ملفٍ من خارج المتجر. فالصدق فيها ليس
  // أخلاقًا فحسب بل هو ما ينجح: من رأى شاشة التحذير قبل أن تظهر له لم يفزع
  // منها، ومن فوجئ بها ألغى التثبيت.
  app: {
    navLink: "التطبيق",
    fromInbox: "ثبّت التطبيق على هاتفك",
    title: "التطبيق على هاتفك",
    subtitle: "أيقونةٌ في شاشة هاتفك تفتح متابعتك مباشرة، وتصلك فيها تنبيهات النادي.",

    // يُقرأ قبل الزرّ عمدًا: التطبيق لا شاشة تسجيل فيه، فمن حمّله بلا حساب
    // وقف أمام شاشة دخولٍ لا مخرج منها وظنّ التطبيق معطوبًا.
    needAccountTitle: "قبل التحميل: أنشئ حسابك في الموقع",
    needAccountBody:
      "التطبيق للأعضاء المقبولين فقط، ولا يوجد فيه تسجيل جديد. أنشئ حسابك من الموقع أوّلًا، وانتظر موافقة المشرف — ثمّ ادخل بالتطبيق بنفس البريد وكلمة السرّ.",
    needAccountCta: "أنشئ حسابًا في الموقع",

    androidHeading: "أندرويد",
    download: "حمّل التطبيق",
    // الحجم مكتوبٌ صراحةً ومعه نصيحة الواي-فاي: تطبيقٌ أصيل يحمل محرّكه
    // معه، وستّون ميغابايت من باقة عضوٍ ثمنٌ يستحقّ التنبيه قبل الضغط.
    downloadMeta: "ملفّ APK · {size} ميغابايت — يُفضَّل التحميل عبر Wi-Fi",
    soon: "الملفّ قيد التجهيز — سيظهر هنا قريبًا بإذن الله",

    step1Title: "حمّل الملفّ",
    step1Body: "اضغط الزرّ أعلاه. سيسألك المتصفّح تأكيدًا للتنزيل، فوافق.",
    step2Title: "افتح الملفّ بعد تنزيله",
    step2Body: "من شريط التنبيهات أو من مجلّد «التنزيلات».",
    step3Title: "ثبّته",
    step3Body:
      "قد يعترض هاتفك — الشاشات أدناه توضّح ما تضغط في كلٍّ منها. وإن كان هاتفك سامسونغ فابدأ بالبطاقة الأولى قبل كلّ شيء.",
    step4Title: "افتحه وسجّل دخولك",
    step4Body: "بنفس البريد وكلمة السرّ اللذين تستعملهما في الموقع.",

    warnHeading: "الشاشات التي قد تعترضك — وكلّها طبيعية",
    warnLead:
      "أندرويد يعرضها لكلّ تطبيقٍ لا يأتي من متجر Play. تطبيق النادي خارج المتجر عن قصد: النشر هناك يُكلّف مالًا، والنادي لا يجمع اشتراكات. انظر أيّها ظهر لك:",

    // شاشة سامسونغ أوّلًا وبوسمٍ «قبل التثبيت»: هي الوحيدة التي **لا مخرج
    // منها في الشاشة نفسها** — زرّ واحد لا غير. من لم يُطفئ الحاجب مسبقًا
    // عاد إلى أوّل الطريق.
    warnSamsungTag: "أجهزة سامسونغ — قبل التثبيت",
    warnSamsungTitle:
      "تمّ حظر تطبيق غير معروف. لحماية هاتفك وبياناتك يمنع «الحاجب التلقائي» تثبيت التطبيقات غير المعروفة.",
    warnSamsungOk: "موافق",
    warnSamsungHint:
      "هذه الشاشة لا زرّ تثبيتٍ فيها. اذهب إلى: الإعدادات ← الأمان والخصوصية ← الحاجب التلقائي (Auto Blocker) ← أوقفه، ثمّ افتح الملفّ من جديد. وأعِد تشغيله بعد التثبيت إن شئت — التطبيق يبقى يعمل.",

    warn1Tag: "عند التثبيت",
    warn1Title: "لأسباب أمنية، لا يُسمح لهاتفك بتثبيت تطبيقات من هذا المصدر",
    warn1Cancel: "إلغاء",
    warn1Ok: "الإعدادات",
    warn1Hint: "اضغط «الإعدادات» ← فعّل «السماح من هذا المصدر» ← ارجع.",

    warn2Tag: "عند التثبيت",
    warn2Title: "حظر Play Protect تثبيت تطبيقٍ غير معروف",
    warn2Cancel: "موافق",
    warn2Ok: "المزيد من التفاصيل",
    warn2Hint: "اضغط «المزيد من التفاصيل» ← «التثبيت بأيّ حال».",

    iosHeading: "آيفون",
    iosLead:
      "آبل لا تسمح بتثبيت تطبيقٍ من خارج متجرها، فلا يوجد ملفّ للآيفون. لكنّ الموقع نفسه يصير تطبيقًا بأيقونة وتنبيهات:",
    iosStep1: "افتح الموقع في متصفّح Safari.",
    iosStep2: "اضغط زرّ المشاركة (المربّع الذي يخرج منه سهم).",
    iosStep3: "اختر «إضافة إلى الشاشة الرئيسية».",
    iosPushNote:
      "تنبيهات الآيفون لا تعمل إلّا بعد هذه الخطوة — من Safari وحده لا تصل ولو أذِنت بها.",

    footNoteHeading: "لماذا لا يوجد في المتجر؟",
    footNote:
      "لأنّ النشر في متجر Play يُكلّف رسمًا، وفي متجر آبل رسمًا سنويًّا. والنادي مجّاني بالكامل، فآثرنا أن يبقى كذلك.",
    backHome: "العودة إلى الصفحة الرئيسية",
  },

  // ── الإدارة (المرحلة ٤) ──
  manage: {
    title: "الإدارة",
    hubSubtitle: "إدارة الأعضاء والحلقات ومتابعة الحفظ والمحتوى",
    navHub: "الرئيسية",
    navRecord: "تسجيل الاستظهار",
    navMembers: "الأعضاء",
    navHalaqat: "الحلقات",
    navExams: "الاختبارات",
    navContent: "الإعلانات والتذكيرات",
    toDashboard: "لوحتي",
    signOut: "تسجيل الخروج",

    statMembers: "عضو",
    statPending: "بانتظار الموافقة",
    statHalaqat: "حلقة",
    open: "فتح",

    // جدول التتبع التفاعلي — نفس شكل الورقة، لكن الخانة تُضغط فتُلوَّن
    weeksLabel: "الأسابيع",
    weekAdd: "إضافة أسبوع",
    weekRemove: "حذف آخر أسبوع",
    cycleStartLabel: "بداية الدورة",
    cycleStartHint: "منه تُحسب أرقام الأسابيع ويقوم التذكير الصباحي",
    cycleStartMissing: "اضبط تاريخ البداية — بدونه لا يعمل التذكير الصباحي",
    cycleStartSaved: "حُفظ تاريخ البداية",
    errCycleStart: "تاريخ غير صحيح",
    errWeekHasData: "لا يمكن حذف الأسبوع الأخير — فيه تسجيلات محفوظة",
    errWeekBlocked: "تعذّر التغيير — طبّق ملف الترحيل 0004_cycles_write.sql في Supabase أولًا",
    errWeekRange: "عدد الأسابيع بين ١ و ٥٣",

    gridPick: "اختر التقييم",
    gridDetails: "تفاصيل (سورة، آية، أخطاء)",
    gridClose: "إغلاق",
    gridSaveFailed: "تعذّر الحفظ — أعد المحاولة",
    colExam: "الاختبار",
    colWeekShort: "أ",
    examSoon: "قريبًا",

    recordTitle: "تسجيل الاستظهار",
    recordSubtitle: "سجّل حصّة الأسبوع لعضو — تظهر فورًا في جدوله",
    recordMember: "العضو",
    recordWeek: "الأسبوع",
    recordStatus: "التقييم",
    recordFromSurah: "من سورة",
    recordFromAyah: "من آية",
    recordToSurah: "إلى سورة",
    recordToAyah: "إلى آية",
    recordHizb: "الحزب",
    recordMistakes: "عدد الأخطاء",
    recordNotes: "ملاحظة",
    recordSave: "حفظ الحصة",
    recordSaving: "جارٍ الحفظ…",
    recordSaved: "تم حفظ الحصة بنجاح",
    chooseMember: "اختر عضوًا…",
    dash: "—",
    noCycle: "لا توجد دورة نشطة — أنشئ دورة أولًا",
    noMembers: "لا أعضاء نشطون بعد",

    membersTitle: "الأعضاء",
    pendingTitle: "طلبات الانضمام",
    pendingNone: "لا طلبات جديدة",
    activeTitle: "الأعضاء النشطون",
    approve: "قبول العضوية",
    approving: "جارٍ…",
    approved: "تم قبول العضوية",
    colName: "الاسم",
    colContact: "التواصل",
    colDay: "اليوم",
    colAmount: "المقدار",
    colRole: "الدور",
    colMembership: "العضوية",
    roleAdmin: "مدير",
    roleSupervisor: "مشرف",
    roleMember: "عضو",
    mClub: "النادي",
    mHifz: "الحفظ",

    halaqatTitle: "الحلقات",
    halaqatSubtitle: "الحلقة = مشرف وطلبته",
    halaqaName: "اسم الحلقة",
    halaqaSupervisor: "المشرف",
    halaqaScheduleNote: "ملاحظة الجدول",
    halaqaCapacity: "السعة",
    halaqaCreate: "إنشاء الحلقة",
    halaqaCreating: "جارٍ…",
    halaqaCreated: "تم إنشاء الحلقة",
    halaqatNone: "لا حلقات بعد",
    chooseSupervisor: "بدون مشرف",

    examsTitle: "الاختبارات",
    examName: "عنوان الاختبار",
    examScope: "النطاق",
    scopeAll: "الجميع",
    scopeHalaqa: "حلقة",
    scopeMember: "عضو",
    examDate: "التاريخ",
    examTime: "الوقت",
    examPlace: "المكان",
    examCreate: "إنشاء الاختبار",
    examCreating: "جارٍ…",
    examCreated: "تم إنشاء الاختبار",
    examsNone: "لا اختبارات",

    contentTitle: "الإعلانات والتذكيرات",
    tabAds: "إعلان",
    tabReminders: "تذكير",
    cTitle: "العنوان",
    cBody: "النص",
    cImage: "صورة (اختياري)",
    cAudience: "الجمهور",
    audBoth: "الجميع",
    audHifz: "أعضاء الحفظ",
    audClub: "أعضاء النادي",
    audHalaqa: "حلقة بعينها",
    audMember: "عضو بعينه",
    cHalaqa: "الحلقة المستهدَفة",
    cMember: "العضو المستهدَف",
    cPublish: "نشر",
    cPublishing: "جارٍ النشر…",
    adPublished: "تم نشر الإعلان",
    reminderPublished: "تم نشر التذكير",

    // ── الأسئلة ──
    navQuestions: "الأسئلة",
    questionsTitle: "طرح سؤال",
    questionsLead:
      "سؤالٌ باختيارات، يصل إلى هواتف الأعضاء. من أصاب نال نقطته، ولكلٍّ محاولة واحدة.",
    questionText: "نصّ السؤال",
    questionTextPh: "ما حكم…؟",
    questionBody: "توضيح قبل الإجابة (اختياري)",
    questionBodyPh: "سياقٌ يعين على الفهم، بلا تلميحٍ إلى الجواب",
    questionExplanation: "الشرح بعد الإجابة (اختياري)",
    questionExplanationPh: "لِمَ كان هذا هو الصواب — يُعرض للعضو بعد أن يجيب",
    questionOptions: "الاختيارات",
    questionOptionsHint:
      "اثنان على الأقلّ وستّة على الأكثر. علّم كلّ جوابٍ صحيح — وإن علّمتَ أكثر من واحد لزم العضوَ اختيارُها كلّها.",
    questionOptionPh: "الاختيار",
    questionCorrect: "الصواب",
    questionPoints: "نقاط الإجابة الصحيحة",
    questionCloses: "يُغلق في (اختياري)",
    questionClosesHint: "بعد هذا الوقت يُعرض السؤال للاطّلاع ولا تُقبل إجابة",
    questionSubmit: "انشر السؤال",
    questionSubmitting: "جارٍ النشر…",
    questionPublished: "نُشر السؤال",
    questionPushTitle: "سؤال جديد",
    questionRecent: "الأسئلة المطروحة",
    questionNone: "لم يُطرح سؤالٌ بعد",
    questionAnswers: "أجاب",
    questionCorrectCount: "أصاب",
    // عدد من وصلتهم الرسالة — بصيغ العربية الخمس، و{n} تُستبدل بالرقم
    sentZero: "لم يصل أحدًا — لا عضو نشط في هذا الجمهور",
    sentOne: "وصل إلى عضو واحد",
    sentTwo: "وصل إلى عضوين",
    sentFew: "وصل إلى {n} أعضاء",
    sentMany: "وصل إلى {n} عضوًا",
    // كم هاتفًا اهتزّ فعلًا. «لا جهاز مفعَّل» ليس تفصيلًا: بدونه يفشل الدفع
    // بصمتٍ تامّ ويظنّ المدير أن الرسالة وصلت الهواتف.
    devicesZero: "لا جهاز مفعَّل بعد",
    devicesOne: "ودُفع إلى جهاز واحد",
    devicesTwo: "ودُفع إلى جهازين",
    devicesFew: "ودُفع إلى {n} أجهزة",
    devicesMany: "ودُفع إلى {n} جهازًا",
    errAudienceScope: "المشرف يراسل حلقته أو أحد طلابه فقط",
    errTargetMissing: "اختر الحلقة أو العضو المستهدَف",
    uploading: "جارٍ رفع الصورة…",
    imageTooBig: "الصورة كبيرة جدًا (الحد ٥ ميغابايت)",
    removeImage: "إزالة الصورة",
    remindersHeading: "تذكيرات",

    // ── المرحلة ٥: إدارة الأشخاص ──
    reject: "رفض",
    memberRejected: "تم رفض الطلب",
    suspendedGroup: "الموقوفون",
    editMember: "تعديل",
    colEmail: "البريد",
    colHalaqa: "الحلقة",

    // جدول Google — قائمة الأعضاء أونلاين بدل ملف يُنزَّل ويقدُم
    sheetSync: "تحديث جدول Google",
    sheetSyncing: "جارٍ التحديث…",
    sheetSynced: "تم تحديث الجدول",
    sheetOpen: "فتح الجدول",
    sheetUnconfigured: "جدول Google غير مُهيّأ بعد",
    errSheet: "تعذّر الاتصال بجدول Google — تحقّق من الرابط ثم أعد المحاولة",
    noHalaqa: "بدون حلقة",
    fRole: "الدور",
    fStatus: "الحالة",
    stActive: "نشط",
    stSuspended: "موقوف",
    stPending: "قيد المراجعة",
    fInHifz: "مسجَّل في الحفظ",
    fInClub: "عضو في النادي",
    fDay: "يوم الاستظهار",
    fTime: "وقت الحصة",
    fAmount: "المقدار الأسبوعي",
    chooseDay: "بدون يوم",
    chooseAmount: "بدون مقدار",
    progressTitle: "التقدم في الحفظ",
    pSurah: "السورة الحالية",
    pAyah: "الآية",
    pPages: "الصفحات المحفوظة",
    pJuz: "الأجزاء المحفوظة",
    saveMember: "حفظ التعديلات",
    savingMember: "جارٍ الحفظ…",
    memberSaved: "تم حفظ التعديلات",
    errLastAdmin: "لا يمكن إزالة آخر مدير — عيّن مديرًا آخر أولًا",
    errSelfRole: "لا يمكنك تغيير دورك أو حالتك بنفسك",
    errAdminOnly: "هذا الإجراء للمدير فقط",

    // ── المرحلة ٦: محرّر الصفحة الرئيسية ──
    navSite: "الصفحة الرئيسية",
    siteSubtitle: "عدّل نصوص الصفحة العامة وصورها وترتيبها",
    siteSeed: "استيراد المحتوى الحالي",
    siteSeeding: "جارٍ الاستيراد…",
    siteSeeded: "تم استيراد المحتوى — صار التعديل ممكنًا",
    siteNotSeeded: "المحتوى ما زال مكتوبًا في الشيفرة. استورده مرّة واحدة لتتمكّن من تعديله من هنا.",
    siteSave: "حفظ القسم",
    siteSaving: "جارٍ الحفظ…",
    siteSaved: "تم الحفظ — الصفحة الرئيسية محدَّثة",
    siteShow: "إظهار",
    siteHide: "إخفاء",
    siteHidden: "مخفي",
    siteUp: "تقديم",
    siteDown: "تأخير",
    siteEdit: "تعديل",
    siteAddItem: "إضافة عنصر",
    siteRemoveItem: "حذف العنصر",
    siteFieldLocked: "حقل مركّب — يُعدَّل من الشيفرة",
    siteOpenHome: "معاينة الصفحة",
    siteImageChoose: "اختر صورة",
    siteImageCurrent: "الصورة الحالية",

    halaqaEdit: "تعديل الحلقة",
    halaqaSave: "حفظ الحلقة",
    halaqaSaving: "جارٍ الحفظ…",
    halaqaSaved: "تم حفظ الحلقة",
    halaqaRoster: "الطلبة",
    halaqaEmpty: "لا طلبة في هذه الحلقة بعد",
    halaqaCount: "طالب",
  },

  // أسماء أقسام الصفحة الرئيسية في محرّر الإدارة
  sectionTypes: {
    hero: "الواجهة",
    about: "عن النادي",
    hifz: "برنامج الحفظ",
    participation: "طريقة المشاركة",
    tracking: "جدول التتبّع",
    activities: "الأنشطة",
    stats: "أرقام النادي",
    cta: "دعوة الانضمام",
    footer: "التذييل",
  } as Record<string, string>,

  // تسميات عربية لمفاتيح المحتوى — المفاتيح إنجليزية في الشيفرة، ولا يظهر
  // منها شيء للمستخدم (القاعدة ١: لا نصّ إنجليزي في الواجهة).
  fieldLabels: {
    logo: "الشعار",
    name: "الاسم",
    tagline: "العبارة",
    lead: "المقدّمة",
    scrollCue: "دعوة التمرير",
    eyebrow: "العنوان العلوي",
    title: "العنوان",
    body: "الفقرات",
    pillars: "الركائز",
    text: "النص",
    paragraphs: "الفقرات",
    official: "النص الرسمي",
    steps: "الخطوات",
    intro: "التمهيد",
    columns: "أعمدة الجدول",
    weeks: "عدد الأسابيع",
    rows: "صفوف الجدول",
    legend: "دليل الألوان",
    note: "ملاحظة",
    items: "العناصر",
    value: "القيمة",
    label: "التسمية",
    primary: "الزر الرئيسي",
    secondary: "الزر الثانوي",
    href: "الرابط",
    contact: "بيانات التواصل",
    email: "البريد",
    phone: "الهاتف",
    city: "المدينة",
    hijriYear: "السنة الهجرية",
    gregYear: "السنة الميلادية",
    key: "الرمز",
    amount: "المقدار",
    exam: "الاختبار",
    weekPrefix: "بادئة الأسبوع",
    cells: "الخانات",
  } as Record<string, string>,

  // أيام الأسبوع (0=الأحد) — لاختيار يوم الاستظهار
  weekdays: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],

  // اختصارات اليوم كما في ورقة التتبع الورقية — عمود ضيّق في الجدول
  weekdaysShort: ["أح", "اث", "ث", "أر", "خ", "ج", "س"],

  // مقدار الحفظ بأثمان الحزب — القيمة المخزَّنة 1..8
  hifzAmounts: [
    { value: 1, label: "ثُمن" },
    { value: 2, label: "رُبع" },
    { value: 3, label: "ثلاثة أثمان" },
    { value: 4, label: "نصف حزب" },
    { value: 5, label: "خمسة أثمان" },
    { value: 6, label: "ثلاثة أرباع" },
    { value: 7, label: "سبعة أثمان" },
    { value: 8, label: "حزب كامل" },
  ],
} as const;

/** ٠١٢٣٤٥٦٧٨٩ — تحويل الأرقام إلى الهندية العربية */
export const arabicDigits = (n: number): string =>
  String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]);
