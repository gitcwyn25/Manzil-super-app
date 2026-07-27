import { InlineKeyboard } from "grammy";
import { config } from "./config.js";
import { buttons } from "./copy.js";

/**
 * Main menu.
 *
 * Two buttons per row rather than one column: Telegram renders inline keyboards
 * at the width of the client, and a single column of long labels wraps awkwardly
 * on narrow phones — which is most of the audience.
 *
 * The Web App button opens the live site *inside* Telegram rather than kicking
 * the user out to a browser, so they keep their place in the conversation.
 */
export function mainMenu(): InlineKeyboard {
  return new InlineKeyboard()
    .webApp(buttons.register, `${config.webUrl}/uz/business/register`)
    .text(buttons.ask, "ask")
    .row()
    .text(buttons.status, "status")
    .text(buttons.about, "about")
    .row()
    .text(buttons.link, "link")
    .text(buttons.consent, "consent")
    .row()
    .webApp(buttons.openApp, `${config.webUrl}/uz`);
}

/** Single back-to-menu control, for sub-screens. */
export function backOnly(): InlineKeyboard {
  return new InlineKeyboard().text(buttons.back, "menu");
}

/** Shown after the about screen: the point of reading it is to then register. */
export function aboutMenu(): InlineKeyboard {
  return new InlineKeyboard()
    .webApp(buttons.register, `${config.webUrl}/uz/business/register`)
    .row()
    .text(buttons.back, "menu");
}

/** Admin dashboard controls. */
export function adminMenu(): InlineKeyboard {
  return new InlineKeyboard()
    .text("📈 Statistika", "admin:stats")
    .text("🏢 Bizneslar", "admin:businesses")
    .row()
    .text("⏳ Kutilayotgan", "admin:pending")
    .text("⭐️ Sharhlar", "admin:reviews")
    .row()
    .webApp("🛠 Admin panel", `${config.webUrl}/uz/admin`);
}

/**
 * Native contact-request keyboard.
 *
 * Telegram's own share-contact control, rather than asking the user to type a
 * number: it proves the number belongs to the account, and the client fills it
 * in so there is nothing to mistype.
 */
export function sharePhoneKeyboard() {
  return {
    keyboard: [[{ text: buttons.sharePhone, request_contact: true }]],
    resize_keyboard: true,
    one_time_keyboard: true
  };
}

/** Per-business consent toggles. One row per customer record. */
export function consentKeyboard(
  rows: Array<{ id: string; businessName: string; consentMarketing: boolean }>
): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  for (const row of rows) {
    keyboard
      .text(
        `${row.consentMarketing ? "🔕 Bekor qilish" : "🔔 Rozilik"} — ${row.businessName}`,
        `consent:${row.consentMarketing ? "off" : "on"}:${row.id}`
      )
      .row();
  }

  return keyboard.text(buttons.back, "menu");
}
