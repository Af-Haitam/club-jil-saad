// إرسال التنبيهات إلى تطبيق أندرويد الأصيل عبر FCM HTTP v1.
//
// بلا حزمة خارجية: كلّ ما يلزم توقيع JWT بمفتاح حساب الخدمة ثمّ مبادلته
// برمز وصول. أربعون سطرًا من `node:crypto` أهون من تبعية جديدة تُحدَّث
// وتُدقَّق مدى عمر المشروع.
//
// لماذا FCM أصلًا؟ Web Push يعيش داخل عامل خدمة، والتطبيق الأصيل لا متصفّح
// فيه. فالخادم يرسل بطريقين: هذا للتطبيق، وlib/notify/push.ts للمتصفّحات.
import { createSign } from "node:crypto";

type ServiceAccount = {
  client_email: string;
  private_key: string;
  project_id: string;
};

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/firebase.messaging";

let cachedToken: { value: string; expiresAt: number } | null = null;
let cachedAccount: ServiceAccount | null | undefined;

function account(): ServiceAccount | null {
  if (cachedAccount !== undefined) return cachedAccount;

  const raw = process.env.FCM_SERVICE_ACCOUNT;
  if (!raw) {
    cachedAccount = null;
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<ServiceAccount>;
    if (parsed.client_email && parsed.private_key && parsed.project_id) {
      cachedAccount = {
        client_email: parsed.client_email,
        project_id: parsed.project_id,
        // متغيّرات بيئة Vercel تُخزَّن سطرًا واحدًا، فالمفتاح يصل بـ\n
        // حرفيّتين لا بأسطر. بلا هذا التحويل يرفضه crypto بلا رسالة مفيدة.
        private_key: parsed.private_key.replace(/\\n/g, "\n"),
      };
      return cachedAccount;
    }
  } catch {
    // مضبوطٌ لكنّه ليس JSON — نعامله كغير مضبوط بدل أن نُسقط النشر كلّه.
  }
  cachedAccount = null;
  return null;
}

export function isFcmConfigured(): boolean {
  return account() !== null;
}

const b64url = (input: Buffer | string) =>
  (typeof input === "string" ? Buffer.from(input) : input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

async function accessToken(sa: ServiceAccount): Promise<string | null> {
  // الرمز يعيش ساعة. نجدّده قبل انتهائه بدقيقة تفاديًا لسباقٍ عند الحافّة.
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );

  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claim}`);
  const jwt = `${header}.${claim}.${b64url(signer.sign(sa.private_key))}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) return null;
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) return null;

  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
  };
  return cachedToken.value;
}

export interface FcmMessage {
  title: string;
  body: string;
  url?: string;
  image?: string | null;
}

export interface FcmResult {
  sent: number;
  /** رموز ماتت — يحذفها المُنادي. */
  dead: string[];
}

/**
 * يرسل إلى قائمة رموز أجهزة. لا يرمي أبدًا — كما في نظيره على الويب،
 * فشل التنبيه لا يجوز أن يُفشل نشر الإعلان نفسه.
 */
export async function sendFcm(tokens: string[], message: FcmMessage): Promise<FcmResult> {
  const sa = account();
  if (!sa || tokens.length === 0) return { sent: 0, dead: [] };

  try {
    const bearer = await accessToken(sa);
    if (!bearer) return { sent: 0, dead: [] };

    const endpoint = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;

    const results = await Promise.allSettled(
      tokens.map(async (token) => {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${bearer}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: {
              token,
              notification: {
                title: message.title,
                body: message.body,
                ...(message.image ? { image: message.image } : {}),
              },
              android: {
                priority: "HIGH",
                notification: {
                  channel_id: "default",
                  color: "#C9A227",
                  // بالضغط يُفتح التطبيق على الوجهة، لا على شاشته الأولى.
                  click_action: "android.intent.action.MAIN",
                },
              },
              // القيم نصوصٌ إجباريًّا في FCM — رقمٌ هنا يُرفض بالكامل.
              data: { url: message.url ?? "/dashboard/inbox" },
            },
          }),
        });

        if (res.ok) return { token, dead: false };

        // 404 = الرمز لم يعد مسجّلًا (التطبيق أُزيل أو مُسحت بياناته).
        // 400 = رمزٌ مشوّه. ما عداهما قد يكون عابرًا فلا نحذف عليه.
        const dead = res.status === 404 || res.status === 400;
        return { token, dead };
      }),
    );

    let sent = 0;
    const dead: string[] = [];
    for (const r of results) {
      if (r.status !== "fulfilled") continue;
      if (r.value.dead) dead.push(r.value.token);
      else sent += 1;
    }

    return { sent, dead };
  } catch {
    return { sent: 0, dead: [] };
  }
}
