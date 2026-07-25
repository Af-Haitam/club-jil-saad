<div align="center">

# نادي الجيل الصاعد
### Da'wah Club & Qur'an Memorization (Ḥifẓ) Platform

منصّة عربية لإدارة نادٍ دعوي وبرنامج تحفيظ القرآن الكريم:
متابعة أسبوعية للحفظ، حلقات، اختبارات، وإعلانات.

An Arabic (RTL) web platform for a Da'wah club and a Qur'an‑memorization
program — weekly ḥifẓ tracking, study circles (ḥalaqāt), exams and announcements.

### 🌐 الموقع المباشر · Live site → **[club-jil-saad.vercel.app](https://club-jil-saad.vercel.app)**

</div>

---

## ✨ المزايا · Features

- 🏠 **الصفحة الرئيسية** — صفحة تعريفية واحدة بتمرير سلس.
- 🔐 **التسجيل والدخول** — بريد وكلمة مرور، مسار الحفظ أو النادي.
- 📊 **لوحة العضو** — جدول تتبّع أسبوعي بالألوان، الموضع في الحفظ، الاختبار القادم، الإعلانات.
- 🛠️ **الإدارة** — تسجيل الاستظهار، قبول الأعضاء، الحلقات، الاختبارات، الإعلانات والتذكيرات مع الصور.
- 👥 **إدارة الأشخاص** — الأدوار، توزيع الأعضاء على الحلقات، تعديل التقدم، ودفع القائمة إلى **جدول Google** مباشرةً.

## 🧱 التقنيات · Tech stack

**Next.js 16** (App Router · TypeScript · Turbopack) · **Tailwind CSS v4** ·
**Supabase** (Postgres + Auth + Storage) · **Vercel** (hosting)

## 🚀 التشغيل محليًا · Run locally

> يلزم **Node.js 20+**. · You need **Node.js 20+** installed.

```bash
# 1) استنسخ المستودع · clone
git clone https://github.com/Af-Haitam/club-jil-saad.git
cd club-jil-saad

# 2) ثبّت الحزم · install dependencies
npm install

# 3) أنشئ ملف البيئة (انظر الأسفل) · create the env file (see below)

# 4) شغّل خادم التطوير · start the dev server
npm run dev
```

ثم افتح · then open **http://localhost:3000**

### 🔑 متغيّرات البيئة · Environment variables

أنشئ ملفًا باسم `.env.local` في جذر المشروع بهذا المحتوى، واملأ القيم من
مشروعك في Supabase (**Project Settings → API**):

Create a file named `.env.local` in the project root with the following, filling
in the values from your Supabase project (**Project Settings → API**):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

اختياري — لتفعيل زرّ «تحديث جدول Google» في صفحة الإدارة، اتبع الدليل (بالإنجليزية)
في [docs/google-sheet.md](docs/google-sheet.md):
Optional — to enable the Google Sheets sync button, follow
[docs/google-sheet.md](docs/google-sheet.md):

```bash
GOOGLE_SHEET_WEBHOOK_URL=https://script.google.com/macros/s/XXXX/exec
GOOGLE_SHEET_TOKEN=your-shared-secret
GOOGLE_SHEET_URL=https://docs.google.com/spreadsheets/d/XXXX/edit
```

> ⚠️ **لا ترفع `.env.local` أبدًا** — يحتوي مفاتيح سرّية، وهو مستثنى في `.gitignore`.
> Never commit `.env.local` — it holds secret keys and is git‑ignored.

## 🗄️ قاعدة البيانات · Database

ملفات SQL في `supabase/migrations/` — طبّقها بالترتيب في **SQL Editor** بلوحة Supabase.
Run the SQL files in `supabase/migrations/` in order, via the Supabase **SQL Editor**.

## 📄 الحالة · Status

المراحل ١–٥ مكتملة (الواجهة · التسجيل · لوحة العضو · الإدارة · إدارة الأشخاص). العمل مستمرّ. 🌱
Phases 1–5 complete (homepage · auth · member dashboard · management · people admin). Work in progress.
