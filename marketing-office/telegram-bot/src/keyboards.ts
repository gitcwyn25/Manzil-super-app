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
