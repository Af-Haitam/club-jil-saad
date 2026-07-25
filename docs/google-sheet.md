# Connecting the member list to Google Sheets

The **«تحديث جدول Google»** button on the manage page pushes the full member list
into a spreadsheet **you own**. Every press replaces the sheet contents with the
current list.

Everything below is free. No credit card, no Google Cloud project, no billing account.
It takes about five minutes and you only do it once.

> ⚠️ **The sheet will contain every member's name, phone number and email address.**
> Once the data is in Google it is outside the app's protection — whoever you share
> the sheet with sees the whole list. Keep it private.

---

## Before you start

You need:

- A Google account (any free one).
- Access to your Vercel project settings, for the last step.

---

## Step 1 — Create the sheet

Go to **[sheets.new](https://sheets.new)**. A blank spreadsheet opens.

Give it a name, for example `أعضاء نادي الجيل الصاعد`. Leave it empty — the script
fills it in.

---

## Step 2 — Invent a secret word

Think of a password-like string. It is never shown to anyone; it only proves that a
sync request really came from your website and not from a stranger.

Make it long and unguessable. **Invent your own — do not copy any example from this
file.** This document is public on GitHub, so anything written here is already known
to everyone.

A good way to generate one, in a terminal:

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
```

Write the result down. You will paste the **exact same value** in Step 3 and again in
Step 6.

---

## Step 3 — Add the script

Inside your new sheet, click **Extensions → Apps Script**. A code editor opens in a
new tab with a small `function myFunction() {}` already in it.

**Delete everything in that editor** and paste this instead:

```javascript
// Receives the member list from the website and writes it into the first sheet.
const TOKEN = 'PUT-YOUR-SECRET-WORD-HERE';   // ← must match GOOGLE_SHEET_TOKEN in step 6

function doPost(e) {
  const reply = (obj) =>
    ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);

  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return reply({ ok: false });
  }

  if (body.token !== TOKEN) return reply({ ok: false });

  const rows = body.rows;
  if (!rows || !rows.length) return reply({ ok: false });

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  sheet.clear();
  sheet.setRightToLeft(true);

  const range = sheet.getRange(1, 1, rows.length, rows[0].length);
  range.setNumberFormat('@');   // plain text — without this Sheets eats the leading 0 of a phone number
  range.setValues(rows);

  sheet.getRange(1, 1, 1, rows[0].length).setFontWeight('bold').setBackground('#D9A441');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, rows[0].length);

  return reply({ ok: true, rows: rows.length - 1 });
}
```

Replace `PUT-YOUR-SECRET-WORD-HERE` with the secret from Step 2, keeping the quotes.

Save with **Ctrl+S**.

---

## Step 4 — Publish it as a web app

Click **Deploy → New deployment**.

1. Next to *Select type*, click the gear icon ⚙️ and choose **Web app**.
2. Fill in the form:

   | Field | Value |
   |---|---|
   | Description | anything, e.g. `member sync` |
   | Execute as | **Me** |
   | Who has access | **Anyone** |

3. Click **Deploy**.

Google will ask you to authorise the script. If you see a screen saying *"Google
hasn't verified this app"*, click **Advanced → Go to (project name) (unsafe)**. That
warning appears for every personal script; this one is yours and you just wrote it.

When it finishes, copy the **Web app URL**. It ends in `/exec` and looks like:

```
https://script.google.com/macros/s/AKfycb.../exec
```

> **"Anyone" does not mean anyone can read your sheet.** The script only *writes*, and
> it refuses any request that doesn't carry your secret word. The sheet itself stays
> as private as you set it.

---

## Step 5 — Copy the sheet link

Go back to the spreadsheet tab and copy the URL from the browser address bar:

```
https://docs.google.com/spreadsheets/d/XXXXXXXX/edit
```

This is what the **«فتح الجدول»** button will open.

---

## Step 6 — Add the three environment variables

You now have three values. Add them in **both** places:

**Locally**, at the end of `.env.local`:

```bash
GOOGLE_SHEET_WEBHOOK_URL=https://script.google.com/macros/s/AKfycb.../exec
GOOGLE_SHEET_TOKEN=the-secret-you-invented-in-step-2
GOOGLE_SHEET_URL=https://docs.google.com/spreadsheets/d/XXXXXXXX/edit
```

**On Vercel**, at *Project Settings → Environment Variables*, add the same three with
the **Production** environment ticked.

Then redeploy so the live site picks them up:

```bash
cd web && vercel deploy --prod --yes
```

---

## Done — what you should see

In the **«الأعضاء»** section of the manage page, two controls appear:

- **«تحديث جدول Google»** — pushes the current member list into the sheet.
- **«فتح الجدول»** — opens the sheet in a new tab.

Press the first one. You should get **«تم تحديث الجدول — N عضو»**, and the sheet fills
with a bold gold header row and one row per member.

If the variables are missing you see **«جدول Google غير مُهيّأ بعد»** instead. Nothing
else on the page is affected.

Only an admin sees these controls, and the sync itself re-checks that on the server —
a supervisor cannot trigger it.

---

## What ends up in the sheet

Fifteen columns, right-to-left, header frozen:

| # | Column | # | Column |
|---|---|---|---|
| 1 | الاسم | 9 | اليوم |
| 2 | التواصل | 10 | وقت الحصة |
| 3 | البريد | 11 | المقدار الأسبوعي |
| 4 | الدور | 12 | السورة الحالية |
| 5 | الحالة | 13 | الآية |
| 6 | الحفظ | 14 | الصفحات المحفوظة |
| 7 | النادي | 15 | الأجزاء المحفوظة |
| 8 | الحلقة | | |

---

## Troubleshooting

| What you see | Most likely cause |
|---|---|
| «جدول Google غير مُهيّأ بعد» | A variable is missing or misspelled — or you added them on Vercel but haven't redeployed yet. |
| «تعذّر الاتصال بجدول Google» | The URL doesn't end in `/exec`; **or** the secret in the script doesn't exactly match `GOOGLE_SHEET_TOKEN`; **or** *Who has access* wasn't set to **Anyone**. |
| The sheet updates, but phone numbers lost their leading `0` | `range.setNumberFormat('@')` was removed from the script. Put it back — it must run *before* `setValues`. |
| Nothing happens for 15 seconds, then an error | Apps Script was cold or is down. Press the button again. |
| An old version keeps running after you edit the script | See below. |

**Editing the script later:** saving is not enough. You must go to
**Deploy → Manage deployments → ✏️ (edit) → Version: New version → Deploy**. Otherwise
the published web app keeps serving the old code. The URL does not change.

---

## Why Apps Script and not the official Google Sheets API

The API route needs a Google Cloud project, an enabled Sheets API, a service account,
and a downloaded JSON key — whose multi-line private key is genuinely awkward to paste
into Vercel's environment variables without breaking the line endings. Apps Script gets
the same result with one paste and one deploy, and is equally free.

If you'd rather have the service-account version, it's a small change on the app side —
only `lib/manage/google-sheet.ts` would need rewriting.
