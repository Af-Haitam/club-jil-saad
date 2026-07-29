// النسخة الاحتياطية الأسبوعية.
//
// خطّة Supabase المجّانية بلا نسخٍ احتياطي — هذه هي كلّ الشبكة تحت النادي.
// تُكتب لقطةٌ JSON إلى دلو تخزينٍ **غير عامّ**، لا إلى مستودع git: المستودع
// علنيّ، وفي اللقطة أسماء الأعضاء وهواتفهم.
//
// والجدولة يوميّة والتنفيذ أسبوعيّ عمدًا: خطّة Vercel المجّانية تسمح
// بمهمّتين اثنتين لا أكثر، وقد تُقصّ جدولةٌ أندر من يوميّة إلى يوميّة. فلو
// شُغّلت كلّ يومٍ لم يضرّ — الشرط هنا في الشيفرة لا في الجدول وحده.
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { logError } from "@/lib/ops/log";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** الجمعة. يومٌ واحدٌ في الأسبوع يكفي لناد. */
const BACKUP_WEEKDAY = 5;
/** ما يُبقى من نسخ. ١٢ أسبوعًا ≈ ٣ أشهر، وحجمها لا يُذكر في غيغابايت. */
const KEEP = 12;

function casablancaNow(): Date {
  // نفس منطق `lib/notify/daily.ts`: المغرب لا UTC، وإلّا وقعت النسخة
  // على يومٍ آخر ليلة الخميس.
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Casablanca" }));
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not set" }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = casablancaNow();
  const forced = request.nextUrl.searchParams.get("force") === "1";
  if (!forced && now.getDay() !== BACKUP_WEEKDAY) {
    return NextResponse.json({ ok: true, skipped: "not-backup-day", weekday: now.getDay() });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    await logError("cron", "backup: supabase credentials missing");
    return NextResponse.json({ ok: false, error: "credentials missing" }, { status: 500 });
  }

  const db = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const { data: snapshot, error } = await db.rpc("export_snapshot");
    if (error) throw new Error(error.message);

    const body = JSON.stringify(snapshot);
    const stamp = now.toISOString().slice(0, 10);
    const name = `snapshot-${stamp}.json`;

    const { error: upErr } = await db.storage
      .from("backups")
      // `upsert` كي لا تفشل إعادة التشغيل في اليوم نفسه — وVercel يعيد
      // المحاولة عند 500، فالفشل على تصادم الاسم كان سيتكرّر إلى الأبد.
      .upload(name, body, { contentType: "application/json", upsert: true });
    if (upErr) throw new Error(upErr.message);

    // تقليم القديم — الغيغابايت المجّاني يمتلئ بصمتٍ ثمّ يرفض كلّ رفع
    const { data: files } = await db.storage.from("backups").list("", {
      limit: 200,
      sortBy: { column: "name", order: "desc" },
    });
    const stale = (files ?? []).map((f) => f.name).filter((n) => n.startsWith("snapshot-")).slice(KEEP);
    if (stale.length) await db.storage.from("backups").remove(stale);

    const counts = Object.fromEntries(
      Object.entries(snapshot as Record<string, unknown>)
        .filter(([, v]) => Array.isArray(v))
        .map(([k, v]) => [k, (v as unknown[]).length]),
    );

    return NextResponse.json({ ok: true, file: name, bytes: body.length, pruned: stale.length, counts });
  } catch (e) {
    // يُسجَّل في القاعدة لا في سجلّ Vercel وحده: سجلّ Vercel المجّاني يُمسح،
    // ولا أحد يفتحه أصلًا. وهذا الجدول يقرؤه المدير في لوحته.
    await logError("cron", "backup failed", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
