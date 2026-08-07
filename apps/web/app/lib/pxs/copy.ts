import type { Locale } from "@manzil/shared";

/**
 * Product Experience System — user-facing copy, uz / ru / en.
 *
 * Every string a PXS component can put on screen lives here, hand-written in
 * all three languages (no machine translation), following the same shape as
 * `crm-copy.ts` and `business-copy.ts`. PXS is web-only, so this stays in
 * `apps/web` rather than `packages/shared`.
 *
 * What is deliberately NOT here: any stage label. Stage text is emitted by the
 * process doing the work and arrives as data — see `PxsStage` in `./types`.
 * The only stage-adjacent strings below are `stagesWaiting` and `stagesFailed`,
 * which describe the *request* ("waiting for a reply"), not invented steps
 * inside it.
 *
 * Server-safe: no browser API, no "use client".
 */

const copy = {
  uz: {
    toast: {
      regionLabel: "Bildirishnomalar",
      dismiss: "Yopish",
      dismissAll: "Barchasini yopish",
      repeat: (count: number) => `${count} marta`
    },
    dialog: {
      close: "Yopish",
      cancel: "Bekor qilish",
      confirm: "Tasdiqlash",
      confirmDestructive: "Ha, o'chirish"
    },
    connection: {
      offlineTitle: "Internet aloqasi yo'q",
      offlineBody: "Ochilgan sahifalar ishlaydi, lekin yangi ma'lumot yuklanmaydi.",
      onlineTitle: "Aloqa tiklandi",
      onlineBody: "Sahifani yangilab, so'nggi ma'lumotni oling.",
      retry: "Qayta urinish",
      reload: "Sahifani yangilash"
    },
    async: {
      pending: "Bajarilmoqda…",
      saving: "Saqlanmoqda…",
      saved: "Saqlandi",
      savedAt: (time: string) => `Saqlandi · ${time}`,
      unsaved: "Saqlanmagan o'zgarishlar bor",
      failed: "Bajarilmadi",
      saveFailed: "Saqlab bo'lmadi",
      retry: "Qayta urinish",
      undo: "Bekor qilish",
      undone: "Bekor qilindi"
    },
    /**
     * Reverting an optimistic change is a specific, honest message: the screen
     * showed a result that did not stick, and it is now back as it was.
     */
    optimistic: {
      revertedTitle: "O'zgarish saqlanmadi",
      revertedBody: "Avvalgi holat qaytarildi. Qayta urinib ko'ring.",
      storageBlockedTitle: "Brauzer saqlashga ruxsat bermadi",
      storageBlockedBody:
        "Saqlangan joylar shu brauzerda xotiraga yozilmadi — maxfiy rejim yoki joy yetishmasligi sabab bo'lishi mumkin."
    },
    loading: {
      label: "Yuklanmoqda",
      /** Read by screen readers while a skeleton placeholder is on screen. */
      skeletonLabel: "Kontent yuklanmoqda"
    },
    progress: {
      label: "Bajarilishi",
      percent: (value: number) => `${value}%`,
      uploading: "Yuklanmoqda…",
      uploaded: "Yuklandi",
      uploadFailed: "Yuklab bo'lmadi",
      /** Both numbers come from real transfer events, never estimated. */
      bytes: (sent: string, total: string) => `${sent} / ${total}`
    },
    stages: {
      /**
       * Shown when a process is running but has reported no stages. It states
       * only what is true: we are waiting for an answer.
       */
      waiting: "Javob kutilmoqda…",
      failed: "Jarayon to'xtadi",
      listLabel: "Jarayon bosqichlari",
      statusPending: "Kutilmoqda",
      statusActive: "Bajarilmoqda",
      statusDone: "Bajarildi",
      statusFailed: "Xato",
      statusSkipped: "O'tkazib yuborildi"
    },
    error: {
      title: "Nimadir ishlamadi",
      body: "Bu qismni ko'rsatib bo'lmadi. Qayta urinib ko'ring.",
      retry: "Qayta urinish",
      /** Only rendered in development; production shows the message above. */
      detailsLabel: "Texnik tafsilotlar"
    },
    unsaved: {
      title: "Saqlanmagan o'zgarishlar",
      body: "Sahifadan chiqsangiz, kiritilgan ma'lumotlar yo'qoladi.",
      stay: "Sahifada qolish",
      leave: "Baribir chiqish",
      /** Modern browsers ignore custom text here and show their own prompt. */
      beforeUnload: "Saqlanmagan o'zgarishlar bor."
    },
    empty: {
      title: "Hozircha bo'sh",
      body: "Bu yerda ko'rsatadigan narsa yo'q."
    },
    shortcuts: {
      hint: "Klaviatura yorliqlari"
    }
  },

  ru: {
    toast: {
      regionLabel: "Уведомления",
      dismiss: "Закрыть",
      dismissAll: "Закрыть все",
      repeat: (count: number) => `${count} раза`
    },
    dialog: {
      close: "Закрыть",
      cancel: "Отмена",
      confirm: "Подтвердить",
      confirmDestructive: "Да, удалить"
    },
    connection: {
      offlineTitle: "Нет подключения к интернету",
      offlineBody: "Открытые страницы работают, но новые данные не загрузятся.",
      onlineTitle: "Соединение восстановлено",
      onlineBody: "Обновите страницу, чтобы получить свежие данные.",
      retry: "Повторить",
      reload: "Обновить страницу"
    },
    async: {
      pending: "Выполняется…",
      saving: "Сохраняем…",
      saved: "Сохранено",
      savedAt: (time: string) => `Сохранено · ${time}`,
      unsaved: "Есть несохранённые изменения",
      failed: "Не выполнено",
      saveFailed: "Не удалось сохранить",
      retry: "Повторить",
      undo: "Отменить",
      undone: "Отменено"
    },
    optimistic: {
      revertedTitle: "Изменение не сохранилось",
      revertedBody: "Вернули как было. Попробуйте ещё раз.",
      storageBlockedTitle: "Браузер не разрешил сохранение",
      storageBlockedBody:
        "Сохранённые места не записались в память этого браузера — возможно, приватный режим или нехватка места."
    },
    loading: {
      label: "Загрузка",
      skeletonLabel: "Контент загружается"
    },
    progress: {
      label: "Прогресс",
      percent: (value: number) => `${value}%`,
      uploading: "Загружаем…",
      uploaded: "Загружено",
      uploadFailed: "Не удалось загрузить",
      bytes: (sent: string, total: string) => `${sent} / ${total}`
    },
    stages: {
      waiting: "Ждём ответа…",
      failed: "Процесс остановился",
      listLabel: "Этапы процесса",
      statusPending: "В очереди",
      statusActive: "Выполняется",
      statusDone: "Готово",
      statusFailed: "Ошибка",
      statusSkipped: "Пропущено"
    },
    error: {
      title: "Что-то пошло не так",
      body: "Не удалось показать этот блок. Попробуйте ещё раз.",
      retry: "Повторить",
      detailsLabel: "Технические подробности"
    },
    unsaved: {
      title: "Несохранённые изменения",
      body: "Если уйти со страницы, введённые данные пропадут.",
      stay: "Остаться на странице",
      leave: "Всё равно уйти",
      beforeUnload: "Есть несохранённые изменения."
    },
    empty: {
      title: "Пока пусто",
      body: "Здесь нечего показать."
    },
    shortcuts: {
      hint: "Горячие клавиши"
    }
  },

  en: {
    toast: {
      regionLabel: "Notifications",
      dismiss: "Dismiss",
      dismissAll: "Dismiss all",
      repeat: (count: number) => `${count} times`
    },
    dialog: {
      close: "Close",
      cancel: "Cancel",
      confirm: "Confirm",
      confirmDestructive: "Yes, delete"
    },
    connection: {
      offlineTitle: "No internet connection",
      offlineBody: "Pages you already opened still work, but nothing new will load.",
      onlineTitle: "Back online",
      onlineBody: "Reload the page to get the latest data.",
      retry: "Try again",
      reload: "Reload page"
    },
    async: {
      pending: "Working…",
      saving: "Saving…",
      saved: "Saved",
      savedAt: (time: string) => `Saved · ${time}`,
      unsaved: "You have unsaved changes",
      failed: "Didn't go through",
      saveFailed: "Couldn't save",
      retry: "Try again",
      undo: "Undo",
      undone: "Undone"
    },
    optimistic: {
      revertedTitle: "That change didn't save",
      revertedBody: "Put back the way it was. Try again.",
      storageBlockedTitle: "Your browser blocked saving",
      storageBlockedBody:
        "Saved places couldn't be written to this browser — private mode or a full storage quota are the usual reasons."
    },
    loading: {
      label: "Loading",
      skeletonLabel: "Content loading"
    },
    progress: {
      label: "Progress",
      percent: (value: number) => `${value}%`,
      uploading: "Uploading…",
      uploaded: "Uploaded",
      uploadFailed: "Upload failed",
      bytes: (sent: string, total: string) => `${sent} / ${total}`
    },
    stages: {
      waiting: "Waiting for a reply…",
      failed: "The process stopped",
      listLabel: "Process stages",
      statusPending: "Queued",
      statusActive: "Running",
      statusDone: "Done",
      statusFailed: "Failed",
      statusSkipped: "Skipped"
    },
    error: {
      title: "Something went wrong",
      body: "This section couldn't be displayed. Try again.",
      retry: "Try again",
      detailsLabel: "Technical details"
    },
    unsaved: {
      title: "Unsaved changes",
      body: "If you leave this page, what you typed will be lost.",
      stay: "Stay on page",
      leave: "Leave anyway",
      beforeUnload: "You have unsaved changes."
    },
    empty: {
      title: "Nothing here yet",
      body: "There is nothing to show on this screen."
    },
    shortcuts: {
      hint: "Keyboard shortcuts"
    }
  }
};

// No `as const` — matching `crm-copy.ts`. Const-asserting would give each
// locale its own literal string types, so `copy[locale]` would be a union of
// three mutually unassignable shapes rather than one localized `PxsCopy`.
export type PxsCopy = (typeof copy)["uz"];

export function getPxsCopy(locale: Locale): PxsCopy {
  return copy[locale] ?? copy.uz;
}

/**
 * Formats a byte count for upload progress.
 *
 * Both operands come from a real `ProgressEvent` (`loaded` / `total`), so this
 * is formatting, not estimation. Returns an empty string when the transport
 * reported no total — an unknown size is shown as unknown, not guessed.
 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
