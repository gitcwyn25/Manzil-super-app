/**
 * Bot copy.
 *
 * Uzbek-first, matching the product. Kept in one file so wording can be
 * reviewed without reading handler logic.
 */
export const copy = {
  brand: "Manzil Business",

  /** Shown under the logo on /start. Deliberately short — a wall of text on first contact gets skipped. */
  intro: [
    "🇺🇿 *Manzil Business* — Toshkentdagi bizneslar uchun platforma.",
    "",
    "Men *Gurman* 👋 — sizga yordam beradigan yordamchiman.",
    "",
    "Bu yerda siz:",
    "• 📋 Biznesingizni ro'yxatdan o'tkazasiz",
    "• 💬 Savolingizni to'g'ridan-to'g'ri jamoaga yuborasiz",
    "• 📊 Arizangiz holatini kuzatasiz",
    "",
    "Quyidagi tugmalardan birini tanlang 👇"
  ].join("\n"),

  about: [
    "ℹ️ *Manzil haqida*",
    "",
    "Manzil — Toshkentdagi bizneslarni topish va boshqarish platformasi.",
    "",
    "*Biznes egalari uchun:*",
    "• Bepul listing va mijozlar oqimi",
    "• Sharhlarga javob berish",
    "• Tashriflar va mijozlar tahlili",
    "• Mijozlar bazasi (CRM)",
    "",
    "*Gurman AI* haqiqiy sharhlar asosida mijozlarga joy tavsiya qiladi — o'ylab topilgan baho emas, faqat real ma'lumot."
  ].join("\n"),

  askPrompt: [
    "💬 *Savolingizni yozing*",
    "",
    "Keyingi xabaringiz to'g'ridan-to'g'ri Manzil jamoasiga yetkaziladi.",
    "Biznes nomingizni ham yozsangiz, tezroq javob beramiz.",
    "",
    "_Bekor qilish uchun /start bosing._"
  ].join("\n"),

  messageSent: "✅ Xabaringiz yuborildi. Jamoamiz tez orada javob beradi.",
  messageFailed: "⚠️ Xabarni yuborib bo'lmadi. Birozdan so'ng qayta urinib ko'ring.",

  statusPrompt: [
    "📊 *Holatni tekshirish*",
    "",
    "Biznesingiz nomini yoki telefon raqamingizni yuboring.",
    "",
    "_Bekor qilish uchun /start bosing._"
  ].join("\n"),

  statusNotFound: [
    "🔍 Bu nom bo'yicha biznes topilmadi.",
    "",
    "Hali ro'yxatdan o'tmagan bo'lsangiz, quyidagi tugma orqali boshlang."
  ].join("\n"),

  notAdmin: "⛔️ Bu buyruq faqat administratorlar uchun.",

  dbUnavailable:
    "⚠️ Ma'lumotlar bazasiga ulanib bo'lmadi, shuning uchun raqamlarni ko'rsata olmayman.",

  /** Reply guidance shown to the admin under each relayed message. */
  adminReplyHint: "↩️ Javob berish uchun shu xabarga _reply_ qiling."
};

export const buttons = {
  register: "📋 Ro'yxatdan o'tish",
  openApp: "🌐 Saytni ochish",
  ask: "💬 Savol berish",
  status: "📊 Mening holatim",
  about: "ℹ️ Manzil haqida",
  back: "⬅️ Orqaga"
};
