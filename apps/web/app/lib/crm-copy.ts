import type { Locale } from "@manzil/shared";

const copy = {
  uz: {
    menu: {
      section: "Asosiy menyu",
      overview: "Boshqaruv paneli",
      announcements: "E'lonlar",
      packages: "Xizmatlar va narxlar",
      reviews: "Sharhlar",
      settings: "Sozlamalar",
      plan: "Tarif",
      upgrade: "Tarifni oshirish",
      viewPublic: "Ochiq sahifani ko'rish"
    },
    overview: {
      title: "Boshqaruv paneli",
      visits30: "Tashriflar (30 kun)",
      unique30: "Noyob mehmonlar",
      reviewsTotal: "Jami sharhlar",
      avgRating: "O'rtacha baho",
      vsNote: "so'nggi 30 kun",
      last7: "so'nggi 7 kunda",
      visitsChart: "Kunlik tashriflar",
      ratingDist: "Baholar taqsimoti",
      completeness: "Profil to'liqligi",
      completenessHint: "To'liq profil qidiruvda yuqoriroq ko'rinadi.",
      published: "Chop etilgan e'lonlar",
      activePackages: "Faol xizmatlar",
      pendingNote: "Biznesingiz admin tasdig'ini kutmoqda. Tasdiqdan so'ng profil ochiq sahifada ko'rinadi."
    },
    announcements: {
      title: "E'lonlar",
      subtitle: "Yangiliklar, chegirmalar va xabarlarni chop eting.",
      newTitle: "Yangi e'lon",
      kind: "Turi",
      kinds: { news: "Yangilik", discount: "Chegirma", broadcast: "Xabar" },
      formTitle: "Sarlavha",
      formBody: "Matn",
      discountPercent: "Chegirma (%)",
      startsAt: "Boshlanish sanasi",
      endsAt: "Tugash sanasi",
      submit: "Chop etish",
      saveDraft: "Qoralama sifatida saqlash",
      statuses: { draft: "Qoralama", published: "Chop etilgan", archived: "Arxiv" },
      publish: "Chop etish",
      archive: "Arxivlash",
      remove: "O'chirish",
      empty: "Hozircha e'lonlar yo'q.",
      table: { title: "Sarlavha", kind: "Turi", status: "Holat", date: "Sana", actions: "Amallar" }
    },
    packages: {
      title: "Xizmatlar va narxlar",
      subtitle: "Xizmatlar ro'yxati mijozlarga ochiq sahifada ko'rinadi.",
      newTitle: "Yangi xizmat",
      name: "Nomi",
      description: "Tavsif",
      price: "Narx (so'm)",
      submit: "Qo'shish",
      activate: "Faollashtirish",
      deactivate: "To'xtatish",
      remove: "O'chirish",
      empty: "Hozircha xizmatlar yo'q.",
      table: { name: "Xizmat", price: "Narx", status: "Holat", actions: "Amallar" },
      active: "Faol",
      inactive: "Faol emas"
    },
    reviews: {
      title: "Sharhlar",
      subtitle: "Mijozlar sharhlariga rasmiy javob bering.",
      empty: "Hozircha sharhlar yo'q.",
      reply: "Javob yozish",
      replyPlaceholder: "Rasmiy javob matni",
      send: "Yuborish",
      replied: "Javob berilgan",
      exportCsv: "CSV yuklab olish"
    },
    settings: {
      title: "Sozlamalar",
      subtitle: "Biznes ma'lumotlari ochiq sahifada ko'rinadi.",
      profile: "Biznes ma'lumotlari",
      name: "Nomi",
      legalName: "Yuridik nomi",
      taxId: "STIR (9 raqam)",
      address: "Manzil",
      district: "Tuman",
      phone: "Telefon",
      email: "Email",
      website: "Veb-sayt",
      instagram: "Instagram",
      telegram: "Telegram",
      hours: "Ish vaqti",
      description: "Tavsif",
      save: "Saqlash",
      subscription: "Obuna",
      plan: "Tarif",
      status: "Holat",
      renews: "Keyingi to'lov",
      subStatuses: {
        active: "Faol",
        trial: "Sinov",
        invoice_pending: "To'lov kutilmoqda",
        canceled: "Bekor qilingan"
      }
    },
    register: {
      title: "Biznesni ro'yxatdan o'tkazish",
      subtitle:
        "Ma'lumotlarni to'ldiring. Ariza admin tomonidan ko'rib chiqiladi va tasdiqlangach kabinet to'liq ochiladi.",
      basics: "Asosiy ma'lumotlar",
      category: "Kategoriya",
      contactSection: "Aloqa",
      legalSection: "Yuridik ma'lumotlar (O'zbekiston)",
      legalHint: "STIR ixtiyoriy, lekin tasdiqlashni tezlashtiradi.",
      submit: "Ro'yxatdan o'tkazish",
      signInFirst: "Avval tizimga kiring",
      signInText: "Biznesni ro'yxatdan o'tkazish uchun hisob talab qilinadi.",
      signIn: "Kirish"
    },
    plans: {
      title: "Tarifni tanlang",
      subtitle: "Keyinroq istalgan vaqtda o'zgartirishingiz mumkin.",
      note: "Pullik tariflar uchun hisob-faktura yuboriladi. To'lov tasdiqlangach tarif faollashadi.",
      choose: "Tanlash"
    },
    common: {
      signInPrompt: "Kabinet uchun tizimga kiring",
      noBusiness: "Sizda hali biznes yo'q",
      noBusinessText: "Yangi biznes qo'shing yoki mavjud listingni tasdiqlang.",
      registerCta: "Biznes qo'shish",
      switchBusiness: "Biznes"
    }
  },
  ru: {
    menu: {
      section: "Основное меню",
      overview: "Панель управления",
      announcements: "Объявления",
      packages: "Услуги и цены",
      reviews: "Отзывы",
      settings: "Настройки",
      plan: "Тариф",
      upgrade: "Повысить тариф",
      viewPublic: "Открытая страница"
    },
    overview: {
      title: "Панель управления",
      visits30: "Визиты (30 дней)",
      unique30: "Уникальные гости",
      reviewsTotal: "Всего отзывов",
      avgRating: "Средняя оценка",
      vsNote: "за последние 30 дней",
      last7: "за последние 7 дней",
      visitsChart: "Визиты по дням",
      ratingDist: "Распределение оценок",
      completeness: "Заполненность профиля",
      completenessHint: "Полный профиль выше показывается в поиске.",
      published: "Опубликованные объявления",
      activePackages: "Активные услуги",
      pendingNote: "Бизнес ожидает подтверждения администратора. После проверки профиль станет публичным."
    },
    announcements: {
      title: "Объявления",
      subtitle: "Публикуйте новости, скидки и сообщения.",
      newTitle: "Новое объявление",
      kind: "Тип",
      kinds: { news: "Новость", discount: "Скидка", broadcast: "Сообщение" },
      formTitle: "Заголовок",
      formBody: "Текст",
      discountPercent: "Скидка (%)",
      startsAt: "Дата начала",
      endsAt: "Дата окончания",
      submit: "Опубликовать",
      saveDraft: "Сохранить как черновик",
      statuses: { draft: "Черновик", published: "Опубликовано", archived: "Архив" },
      publish: "Опубликовать",
      archive: "В архив",
      remove: "Удалить",
      empty: "Объявлений пока нет.",
      table: { title: "Заголовок", kind: "Тип", status: "Статус", date: "Дата", actions: "Действия" }
    },
    packages: {
      title: "Услуги и цены",
      subtitle: "Список услуг виден клиентам на открытой странице.",
      newTitle: "Новая услуга",
      name: "Название",
      description: "Описание",
      price: "Цена (сум)",
      submit: "Добавить",
      activate: "Активировать",
      deactivate: "Остановить",
      remove: "Удалить",
      empty: "Услуг пока нет.",
      table: { name: "Услуга", price: "Цена", status: "Статус", actions: "Действия" },
      active: "Активна",
      inactive: "Неактивна"
    },
    reviews: {
      title: "Отзывы",
      subtitle: "Официально отвечайте на отзывы клиентов.",
      empty: "Отзывов пока нет.",
      reply: "Ответить",
      replyPlaceholder: "Текст официального ответа",
      send: "Отправить",
      replied: "Ответ отправлен",
      exportCsv: "Скачать CSV"
    },
    settings: {
      title: "Настройки",
      subtitle: "Данные бизнеса видны на открытой странице.",
      profile: "Данные бизнеса",
      name: "Название",
      legalName: "Юридическое название",
      taxId: "ИНН/СТИР (9 цифр)",
      address: "Адрес",
      district: "Район",
      phone: "Телефон",
      email: "Email",
      website: "Сайт",
      instagram: "Instagram",
      telegram: "Telegram",
      hours: "Часы работы",
      description: "Описание",
      save: "Сохранить",
      subscription: "Подписка",
      plan: "Тариф",
      status: "Статус",
      renews: "Следующий платёж",
      subStatuses: {
        active: "Активна",
        trial: "Пробный период",
        invoice_pending: "Ожидает оплаты",
        canceled: "Отменена"
      }
    },
    register: {
      title: "Регистрация бизнеса",
      subtitle:
        "Заполните данные. Заявку проверит администратор, после подтверждения кабинет откроется полностью.",
      basics: "Основные данные",
      category: "Категория",
      contactSection: "Контакты",
      legalSection: "Юридические данные (Узбекистан)",
      legalHint: "ИНН необязателен, но ускоряет подтверждение.",
      submit: "Зарегистрировать",
      signInFirst: "Сначала войдите",
      signInText: "Для регистрации бизнеса требуется аккаунт.",
      signIn: "Войти"
    },
    plans: {
      title: "Выберите тариф",
      subtitle: "Его можно изменить в любой момент.",
      note: "Для платных тарифов выставляется счёт. Тариф активируется после подтверждения оплаты.",
      choose: "Выбрать"
    },
    common: {
      signInPrompt: "Войдите, чтобы открыть кабинет",
      noBusiness: "У вас пока нет бизнеса",
      noBusinessText: "Добавьте новый бизнес или подтвердите существующий листинг.",
      registerCta: "Добавить бизнес",
      switchBusiness: "Бизнес"
    }
  },
  en: {
    menu: {
      section: "Main menu",
      overview: "Dashboard",
      announcements: "Announcements",
      packages: "Services & prices",
      reviews: "Reviews",
      settings: "Settings",
      plan: "Plan",
      upgrade: "Upgrade plan",
      viewPublic: "View public page"
    },
    overview: {
      title: "Dashboard",
      visits30: "Visits (30 days)",
      unique30: "Unique visitors",
      reviewsTotal: "Total reviews",
      avgRating: "Average rating",
      vsNote: "last 30 days",
      last7: "in the last 7 days",
      visitsChart: "Daily visits",
      ratingDist: "Rating distribution",
      completeness: "Profile completeness",
      completenessHint: "Complete profiles rank higher in search.",
      published: "Published announcements",
      activePackages: "Active services",
      pendingNote: "Your business is awaiting admin approval. The profile becomes public after review."
    },
    announcements: {
      title: "Announcements",
      subtitle: "Publish news, discounts, and broadcasts.",
      newTitle: "New announcement",
      kind: "Type",
      kinds: { news: "News", discount: "Discount", broadcast: "Broadcast" },
      formTitle: "Title",
      formBody: "Body",
      discountPercent: "Discount (%)",
      startsAt: "Start date",
      endsAt: "End date",
      submit: "Publish",
      saveDraft: "Save as draft",
      statuses: { draft: "Draft", published: "Published", archived: "Archived" },
      publish: "Publish",
      archive: "Archive",
      remove: "Delete",
      empty: "No announcements yet.",
      table: { title: "Title", kind: "Type", status: "Status", date: "Date", actions: "Actions" }
    },
    packages: {
      title: "Services & prices",
      subtitle: "Your service list is visible to customers on the public page.",
      newTitle: "New service",
      name: "Name",
      description: "Description",
      price: "Price (UZS)",
      submit: "Add",
      activate: "Activate",
      deactivate: "Deactivate",
      remove: "Delete",
      empty: "No services yet.",
      table: { name: "Service", price: "Price", status: "Status", actions: "Actions" },
      active: "Active",
      inactive: "Inactive"
    },
    reviews: {
      title: "Reviews",
      subtitle: "Respond to customer reviews officially.",
      empty: "No reviews yet.",
      reply: "Reply",
      replyPlaceholder: "Official reply text",
      send: "Send",
      replied: "Replied",
      exportCsv: "Download CSV"
    },
    settings: {
      title: "Settings",
      subtitle: "Business details appear on the public page.",
      profile: "Business details",
      name: "Name",
      legalName: "Legal name",
      taxId: "Tax ID (9 digits)",
      address: "Address",
      district: "District",
      phone: "Phone",
      email: "Email",
      website: "Website",
      instagram: "Instagram",
      telegram: "Telegram",
      hours: "Opening hours",
      description: "Description",
      save: "Save",
      subscription: "Subscription",
      plan: "Plan",
      status: "Status",
      renews: "Next payment",
      subStatuses: {
        active: "Active",
        trial: "Trial",
        invoice_pending: "Invoice pending",
        canceled: "Canceled"
      }
    },
    register: {
      title: "Register your business",
      subtitle:
        "Fill in the details. An administrator reviews the application; the dashboard unlocks fully after approval.",
      basics: "Basic details",
      category: "Category",
      contactSection: "Contacts",
      legalSection: "Legal details (Uzbekistan)",
      legalHint: "Tax ID is optional but speeds up approval.",
      submit: "Register",
      signInFirst: "Sign in first",
      signInText: "An account is required to register a business.",
      signIn: "Sign in"
    },
    plans: {
      title: "Choose a plan",
      subtitle: "You can change it at any time.",
      note: "Paid plans are invoiced. The plan activates once payment is confirmed.",
      choose: "Choose"
    },
    common: {
      signInPrompt: "Sign in to open the dashboard",
      noBusiness: "You have no business yet",
      noBusinessText: "Register a new business or claim an existing listing.",
      registerCta: "Add a business",
      switchBusiness: "Business"
    }
  }
};

export type CrmCopy = (typeof copy)["uz"];

export function getCrmCopy(locale: Locale): CrmCopy {
  return copy[locale] ?? copy.uz;
}
