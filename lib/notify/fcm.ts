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

// رمز الوصول **لكلّ مشروعٍ على حدة**. ذاكرةٌ واحدة كانت تسلّم رمز مشروعٍ
// إلى نداءٍ موجَّهٍ إلى غيره، وهو خطأٌ لا يظهر ما دام المشروع واحدًا.
const cachedTokens = new Map<string, { value: string; expiresAt: number }>();
let cachedAccounts: ServiceAccount[] | undefined;

function parseAccount(raw: string | undefined): ServiceAccount | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ServiceAccount>;
    if (!parsed.client_email || !parsed.private_key || !parsed.project_id) return null;
    return {
      client_email: parsed.client_email,
      project_id: parsed.project_id,
      // متغيّرات بيئة Vercel تُخزَّن سطرًا واحدًا، فالمفتاح يصل بـ\n
      // حرفيّتين لا بأسطر. بلا هذا التحويل يرفضه crypto بلا رسالة مفيدة.
      private_key: parsed.private_key.replace(/\\n/g, "\n"),
    };
  } catch {
    // مضبوطٌ لكنّه ليس JSON — نعامله كغير مضبوط بدل أن نُسقط النشر كلّه.
    return null;
  }
}

/**
 * كلّ مشاريع Firebase المضبوطة.
 *
 * وهي أكثر من واحد لأنّ نسخة التجربة حزمةٌ أخرى (`…club_jil_saad.beta`)
 * مسجَّلةٌ في مشروعٍ آخر. **ورمز الجهاز ينتمي إلى مشروعٍ بعينه**: أرسله
 * باعتماد مشروعٍ غيره يُجبك FCM بـ404 كأنّ الرمز ميّت.
 *
 * وهذا ما كان يقع فعلًا — لا التنبيه يصل، **بل يُحذف الرمز الصحيح** لأنّ
 * المُنادي يقرأ 404 على أنّها «التطبيق أُزيل». فيعيد العضو التفعيل، ويُحذف
 * مرّةً أخرى، بلا أثرٍ في أيّ سجلّ.
 *
 * الدواء الجذريّ أن يُسجَّل التطبيقان في مشروعٍ واحد (يقبل Firebase عدّة
 * حزمٍ في المشروع الواحد)، وحينها تعود هذه القائمة إلى عنصرٍ واحد بلا
 * تغييرٍ في هذا الملفّ.
 */
function accounts(): ServiceAccount[] {
  if (cachedAccounts !== undefined) return cachedAccounts;
  const list = [
    parseAccount(process.env.FCM_SERVICE_ACCOUNT),
    parseAccount(process.env.FCM_SERVICE_ACCOUNT_BETA),
  ].filter((x): x is ServiceAccount => x !== null);

  // مشروعان بنفس المعرّف = ضبطٌ مكرَّر، فلا نُرسل مرّتين
  cachedAccounts = list.filter(
    (a, i) => list.findIndex((b) => b.project_id === a.project_id) === i,
  );
  return cachedAccounts;
}

export function isFcmConfigured(): boolean {
  return accounts().length > 0;
}

const b64url = (input: Buffer | string) =>
  (typeof input === "string" ? Buffer.from(input) : input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

async function accessToken(sa: ServiceAccount): Promise<string | null> {
  // الرمز يعيش ساعة. نجدّده قبل انتهائه بدقيقة تفاديًا لسباقٍ عند الحافّة.
  const hit = cachedTokens.get(sa.project_id);
  if (hit && hit.expiresAt > Date.now() + 60_000) return hit.value;

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

  cachedTokens.set(sa.project_id, {
    value: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
  });
  return json.access_token;
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
function payload(token: string, message: FcmMessage, validateOnly: boolean) {
  return JSON.stringify({
    validate_only: validateOnly,
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
  });
}

/** محاولةٌ واحدة على مشروعٍ واحد. `rejected` تعني «هذا المشروع لا يعرفه». */
async function trySend(
  sa: ServiceAccount,
  token: string,
  message: FcmMessage,
  validateOnly = false,
): Promise<"sent" | "rejected" | "transient"> {
  const bearer = await accessToken(sa);
  if (!bearer) return "transient";

  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${bearer}`, "Content-Type": "application/json" },
      body: payload(token, message, validateOnly),
    },
  );

  if (res.ok) return "sent";
  // 404 = غير مسجّل في **هذا** المشروع · 400 = مشوّه أو لمشروعٍ آخر.
  // ما عداهما (401/429/5xx) قد يكون عابرًا فلا يُحذف عليه رمز.
  return res.status === 404 || res.status === 400 ? "rejected" : "transient";
}

/**
 * يرسل إلى قائمة رموز أجهزة. لا يرمي أبدًا — كما في نظيره على الويب،
 * فشل التنبيه لا يجوز أن يُفشل نشر الإعلان نفسه.
 *
 * ويُجرَّب الرمز على كلّ مشروعٍ مضبوط قبل الحكم عليه بالموت: التطبيق
 * الأساسيّ ونسخة التجربة في مشروعين، ولا شيء في الرمز يقول إلى أيّهما
 * ينتمي. ورفضُ مشروعٍ واحد ليس موتًا، بل «ليس عندي».
 */
export async function sendFcm(
  tokens: string[],
  message: FcmMessage,
  validateOnly = false,
): Promise<FcmResult> {
  const projects = accounts();
  if (projects.length === 0 || tokens.length === 0) return { sent: 0, dead: [] };

  try {
    const results = await Promise.allSettled(
      tokens.map(async (token) => {
        let everTransient = false;
        for (const sa of projects) {
          const outcome = await trySend(sa, token, message, validateOnly);
          if (outcome === "sent") return { token, dead: false, sent: true };
          if (outcome === "transient") everTransient = true;
        }
        // لم يقبله مشروع. وإن كان أحد الردود عابرًا فلا نجزم بالموت —
        // انقطاعُ شبكةٍ لحظيّ لا يستحقّ حذف رمزِ عضوٍ صحيح.
        return { token, dead: !everTransient, sent: false };
      }),
    );

    let sent = 0;
    const dead: string[] = [];
    for (const r of results) {
      if (r.status !== "fulfilled") continue;
      if (r.value.sent) sent += 1;
      else if (r.value.dead) dead.push(r.value.token);
    }

    return { sent, dead };
  } catch {
    return { sent: 0, dead: [] };
  }
}
