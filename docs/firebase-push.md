# Android app notifications — Firebase setup

**You do this once.** After that, notifications work in the native app the
same way they already work in the browser.

## Why this step exists at all

The website's notifications travel over **Web Push**, a standard that lives
inside the browser — specifically inside a *service worker*. A native app has
no browser and no service worker, so that road is closed to it no matter how
the app is written.

The only route to native Android notifications is **FCM** (Firebase Cloud
Messaging). It is free with no practical limit and asks for no bank card —
but it needs a *Firebase project in your name*, because the keys belong to
whoever owns the app, not to whoever builds it.

**Your website notifications keep working exactly as they do now.** The server
will send both ways: Web Push for anyone using the site or an iPhone home-screen
install, FCM for anyone with the Android app.

---

## Steps

### 1. Create a Firebase project

1. Open <https://console.firebase.google.com> and sign in with your Google account.
2. Click **Add project**.
3. Name it `club-jil-saad` (any name works — this is only for your own organisation).
4. At the **Google Analytics** step: **turn it off** (Disable). We don't need it,
   and switching it off avoids linking an analytics account and accepting extra terms.
5. Wait for the project to be created, then **Continue**.

### 2. Add an Android app inside the project

1. On the project home screen, click the Android icon (**Add app → Android**).
2. **Android package name** — type it exactly, character for character:

   ```
   app.vercel.club_jil_saad
   ```

   > This string *is* the app's identity to Android. One wrong character and
   > Google rejects every message, with no error message that explains why.

3. **App nickname** — leave it blank, or write `Club Jil Saad`.
4. **SHA-1** — leave it blank. It's only needed for Google Sign-In, which we don't use.
5. Click **Register app**.

### 3. Download the config file

Right after registering, Firebase offers a **Download google-services.json** button.

- Download the file.
- **Send it to me** (or drop it at `web/mobile/google-services.json`).
- Then click **Next → Next → Continue to console**, and ignore the code snippets
  it shows you — that part is already written.

> **Is it a secret?** No. `google-services.json` is baked into every copy of the
> app, so it is public by construction. The genuinely secret file is the one in
> the next step.

### 4. The server key (service account)

This is what lets the club's server **send** notifications:

1. In Firebase: the ⚙ gear next to **Project Overview** → **Project settings**.
2. Open the **Service accounts** tab.
3. Click **Generate new private key**, then **Generate key**.
4. A `.json` file downloads.

> ⚠️ **This file is a real secret.** Anyone holding it can send notifications
> in the club's name to every member. Do not commit it to GitHub and do not paste
> it into a public chat. It will go into Vercel's encrypted environment variables,
> the same place the Supabase key lives.

---

## Two files, two very different risks

| File | Where it ends up | Secret? |
|---|---|---|
| `google-services.json` | Inside every APK | **No** — public by construction |
| service account `.json` | Vercel env vars, server-side only | **Yes** — treat like a password |

## What happens afterwards

| Device | Route |
|---|---|
| The Android app | FCM |
| Any browser, phone or desktop | Web Push (unchanged) |
| iPhone, site added to the home screen | Web Push (unchanged) |

The `push_tokens` table gains a column marking the token's kind, and the server
sends to each device by its own road. Anyone who installs the app **and** uses
the website will not get everything twice: tokens are tied to an account and a
device, and duplicates are ruled out by the same `dedupe_key` that protects the
inbox today.
