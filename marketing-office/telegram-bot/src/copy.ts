/**
 * Bot copy.
 *
 * Uzbek-first, matching the product. Kept in one file so wording can be
 * reviewed without reading handler logic.
 */
const lines = (...parts: string[]) => parts.join("\n");

export const copy = {
  brand: "Manzil Business",

  /** Shown under the logo on /start. Deliberately short — a wall of text on first contact gets skipped. */
  intro: lines(
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
  ),

  about: lines(
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
  ),

  askPrompt: lines(
    "💬 *Savolingizni yozing*",
    "",
    "Keyingi xabaringiz to'g'ridan-to'g'ri Manzil jamoasiga yetkaziladi.",
    "Biznes nomingizni ham yozsangiz, tezroq javob beramiz.",
    "",
    "_Bekor qilish uchun /start bosing._"
  ),

  messageSent: "✅ Xabaringiz yuborildi. Jamoamiz tez orada javob beradi.",

  statusPrompt: lines(
    "📊 *Holatni tekshirish*",
    "",
    "Biznesingiz nomini yoki telefon raqamingizni yuboring.",
    "",
    "_Bekor qilish uchun /start bosing._"
  ),

  statusNotFound: lines(
    "🔍 Bu nom bo'yicha biznes topilmadi.",
    "",
    "Hali ro'yxatdan o'tmagan bo'lsangiz, quyidagi tugma orqali boshlang."
  ),

  notAdmin: "⛔️ Bu buyruq faqat administratorlar uchun.",

  dbUnavailable:
    "⚠️ Ma'lumotlar bazasiga ulanib bo'lmadi, shuning uchun raqamlarni ko'rsata olmayman.",

  /** Reply guidance shown to the admin under each relayed message. */
  adminReplyHint: "↩️ Javob berish uchun shu xabarga _reply_ qiling.",

  /* ---------- Telegram linking + marketing consent ---------- */

  linkPrompt: lines(
    "📱 *Telegramni ulash*",
    "",
    "Raqamingizni ulasangiz, tashrif buyurgan bizneslaringizdan xabar olishingiz mumkin bo'ladi.",
    "",
    "Pastdagi tugma orqali raqamingizni yuboring — bu faqat sizni tanish uchun.",
    "",
    "_Raqamni ulash reklama olishga rozilik bermaydi. Roziligingizni keyingi qadamda alohida so'raymiz._"
  ),

  /** Telegram allows forwarding someone else's contact card; this is the refusal. */
  linkNotOwnContact: "⚠️ Iltimos, o'z raqamingizni yuboring — boshqa odamning kontaktini emas.",

  linkNoMatch: lines(
    "🔍 Bu raqam bo'yicha mijoz yozuvi topilmadi.",
    "",
    "Bu normal holat: biror biznesda bandlov qilganingizdan so'ng yozuv paydo bo'ladi."
  ),

  linkSuccess: "✅ Raqamingiz ulandi.",

  consentIntro: lines(
    "🔔 *Xabarlarga rozilik*",
    "",
    "Quyidagi bizneslar sizga taklif va yangiliklar yuborishi mumkin.",
    "Har biri uchun alohida tanlang — istalgan vaqtda bekor qilishingiz mumkin."
  ),

  consentNone: lines(
    "🔔 Sizda ulangan mijoz yozuvi yo'q.",
    "",
    "Avval raqamingizni ulang."
  ),

  consentGranted: "✅ Rozilik berildi.",
  consentRevoked: "🚫 Rozilik bekor qilindi.",
  consentFailed: "⚠️ Saqlab bo'lmadi. Birozdan so'ng qayta urinib ko'ring."
};

export const buttons = {
  register: "📋 Ro'yxatdan o'tish",
  openApp: "🌐 Saytni ochish",
  ask: "💬 Savol berish",
  status: "📊 Mening holatim",
  about: "ℹ️ Manzil haqida",
  back: "⬅️ Orqaga",
  link: "📱 Telegramni ulash",
  sharePhone: "📲 Raqamni yuborish",
  consent: "🔔 Xabarlar sozlamasi"
};
