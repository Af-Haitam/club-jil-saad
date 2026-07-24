// رفع صورة إلى دلو media — يضغطها إلى WebP في المتصفح أولًا (توفيرًا للـ1GB)،
// ثم يرفعها بعميل المتصفح المُصادَق (سياسة التخزين تسمح للمدير/المشرف فقط).
"use client";

import { createClient } from "@/lib/supabase/client";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB (before compression)

async function compressToWebp(file: File, maxDim = 1600, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");
  ctx.drawImage(bitmap, 0, 0, w, h);
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("compress failed"))), "image/webp", quality)
  );
}

/** يرفع الصورة ويعيد رابطها العام، أو يرمي خطأ. */
export async function uploadImage(file: File): Promise<string> {
  const blob = await compressToWebp(file);
  const supabase = createClient();
  const path = `${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage.from("media").upload(path, blob, {
    contentType: "image/webp",
    upsert: false,
  });
  if (error) throw error;
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}
