// نقطة المهمّة اليومية — يستدعيها Vercel Cron صباح كل يوم.
//
// الحماية: Vercel يُرسل ترويسة `Authorization: Bearer $CRON_SECRET` تلقائيًا
// متى وُجد المتغيّر. بدونه المسار مفتوح للعالم — لذلك نرفض الطلب حين يغيب
// المتغيّر بدل أن نعمل بلا حارس.
import { NextResponse, type NextRequest } from "next/server";

import { runDailyJob } from "@/lib/notify/daily";

// لا تُخزَّن ولا تُبنى مسبقًا: نتيجتها تختلف كل يوم وتكتب في قاعدة البيانات.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not set" }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const report = await runDailyJob();
    return NextResponse.json({ ok: true, ...report });
  } catch (error) {
    // الخطأ يظهر في سجلّ Vercel، ورمز 500 يجعل المحاولة تُعاد — وهو آمن
    // لأن كل كتابة في المهمّة لا تُكرَّر.
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
