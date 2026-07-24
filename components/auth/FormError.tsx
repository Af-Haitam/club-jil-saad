// شريط خطأ عام أعلى النموذج (غير مرتبط بحقل واحد) — role="alert" يكفي وحده
// كمنطقة حيّة (لا حاجة لـ aria-live إضافي).
export default function FormError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className="rounded-sm border border-tick-red/40 bg-tick-red/10 px-3.5 py-2.5 text-sm text-tick-red"
    >
      {message}
    </p>
  );
}
