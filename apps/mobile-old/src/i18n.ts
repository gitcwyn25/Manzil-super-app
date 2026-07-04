import i18n from 'i18n-js';

const translations = {
  uz: {
    home: {
      title: 'Manzilga Xush Kelibsiz',
      subtitle: 'Tashkentdagi eng yaxshi joylarni toping',
      categories: 'Kategoriyalar',
      search_placeholder: 'Biznesnini qidirish...',
    },
    search: {
      results: 'Qidirish Natijalari',
      loading: 'Yuklanmoqda...',
    },
    profile: {
      username: 'Username',
      member_since: 'Azo sifatida...',
      reviews: 'Sharhlar',
      saved: 'Saqlangan',
      photos: 'Rasmlar',
      my_reviews: 'Mening Sharhlarim',
      saved_places: 'Saqlangan Joylar',
      settings: 'Sozlamalar',
    },
  },
  ru: {
    home: {
      title: 'Добро пожаловать в Manzil',
      subtitle: 'Найдите лучшие места в Ташкенте',
      categories: 'Категории',
      search_placeholder: 'Поиск бизнеса...',
    },
    search: {
      results: 'Результаты поиска',
      loading: 'Загрузка...',
    },
    profile: {
      username: 'Имя пользователя',
      member_since: 'Член с...',
      reviews: 'Отзывы',
      saved: 'Сохранено',
      photos: 'Фото',
      my_reviews: 'Мои отзывы',
      saved_places: 'Сохраненные места',
      settings: 'Настройки',
    },
  },
  en: {
    home: {
      title: 'Welcome to Manzil',
      subtitle: 'Discover the best places in Tashkent',
      categories: 'Categories',
      search_placeholder: 'Search for a business...',
    },
    search: {
      results: 'Search Results',
      loading: 'Loading...',
    },
    profile: {
      username: 'Username',
      member_since: 'Member since...',
      reviews: 'Reviews',
      saved: 'Saved',
      photos: 'Photos',
      my_reviews: 'My Reviews',
      saved_places: 'Saved Places',
      settings: 'Settings',
    },
  },
};

i18n.translations = translations;
i18n.defaultLocale = 'uz';
i18n.locale = 'uz';

export function useTranslations(namespace: string) {
  return (key: string) => i18n.t(`${namespace}.${key}`);
}
