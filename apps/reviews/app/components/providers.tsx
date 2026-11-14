"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Locale } from "../lib/api";

const copy = {
  en: { explore: "Explore", saved: "Saved places", owners: "For business owners", signIn: "Sign in", profile: "My profile", signOut: "Sign out", find: "Find your next local favourite.", intro: "Independent places. Honest experiences. A better way to get to know Tashkent.", search: "Search places, services, or a neighbourhood", searchButton: "Search", all: "All places", categories: "Categories", filters: "Refine your search", open: "Open now", price: "Price level", rating: "Minimum rating", results: "places", list: "List", map: "Map", nearby: "Use my location", empty: "No places match your search.", clear: "Clear filters", noReviews: "No reviews yet", review: "Write a review", back: "Back to places", hours: "Hours", about: "About this place", reviews: "Community reviews", save: "Save place", add: "Add a business", claim: "Claim this business", favorites: "Favourites", want_to_try: "Want to visit", visited: "Visited", community: "Explore Tashkent, one recommendation at a time.", noSaved: "Your next great find belongs here.", browse: "Explore places" },
  uz: { explore: "Joylarni topish", saved: "Saqlangan joylar", owners: "Biznes egalari uchun", signIn: "Kirish", profile: "Profilim", signOut: "Chiqish", find: "Yangi sevimli joyingizni toping.", intro: "Mahalliy joylar. Haqiqiy tajribalar. Toshkentni yaxshiroq kashf eting.", search: "Joy, xizmat yoki mahallani qidiring", searchButton: "Qidirish", all: "Barcha joylar", categories: "Toifalar", filters: "Qidiruvni aniqlashtiring", open: "Hozir ochiq", price: "Narx darajasi", rating: "Minimal reyting", results: "ta joy", list: "Ro‘yxat", map: "Xarita", nearby: "Joylashuvimni aniqlash", empty: "Qidiruvingizga mos joy topilmadi.", clear: "Filtrlarni tozalash", noReviews: "Hali sharh yo‘q", review: "Sharh yozish", back: "Joylarga qaytish", hours: "Ish vaqti", about: "Bu joy haqida", reviews: "Foydalanuvchilar sharhlari", save: "Saqlash", add: "Biznes qo‘shish", claim: "Biznesni tasdiqlash", favorites: "Sevimlilar", want_to_try: "Bormoqchiman", visited: "Borganman", community: "Har bir tavsiya bilan Toshkentni kashf eting.", noSaved: "Keyingi sevimli joyingiz shu yerda bo‘ladi.", browse: "Joylarni ko‘rish" },
  ru: { explore: "Найти места", saved: "Сохранённые места", owners: "Владельцам бизнеса", signIn: "Войти", profile: "Мой профиль", signOut: "Выйти", find: "Найдите новое любимое место.", intro: "Местные заведения. Честный опыт. Узнайте Ташкент ближе.", search: "Найти место, услугу или район", searchButton: "Найти", all: "Все места", categories: "Категории", filters: "Уточните поиск", open: "Сейчас открыто", price: "Уровень цен", rating: "Минимальный рейтинг", results: "мест", list: "Список", map: "Карта", nearby: "Моё местоположение", empty: "Нет мест по вашему запросу.", clear: "Сбросить фильтры", noReviews: "Пока нет отзывов", review: "Написать отзыв", back: "К списку мест", hours: "Часы работы", about: "Об этом месте", reviews: "Отзывы сообщества", save: "Сохранить", add: "Добавить бизнес", claim: "Подтвердить бизнес", favorites: "Избранное", want_to_try: "Хочу посетить", visited: "Посетил", community: "Открывайте Ташкент с каждой рекомендацией.", noSaved: "Здесь будет ваше следующее любимое место.", browse: "Посмотреть места" }
};
type Context = { locale: Locale; setLocale: (value: Locale) => void; t: typeof copy.en; user: User | null; session: Session | null; authReady: boolean; token: () => Promise<string>; signOut: () => Promise<void> };
const AppContext = createContext<Context | null>(null);
export function Providers({ children }: { children: ReactNode }) {
  const [locale, setLanguage] = useState<Locale>("en");
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setReady] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("manzil-reviews-locale");
    if (stored === "en" || stored === "uz" || stored === "ru") setLanguage(stored);
    const client = supabase();
    if (!client) { setReady(true); return; }
    client.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, next) => { setSession(next); setReady(true); });
    return () => subscription.unsubscribe();
  }, []);
  const setLocale = (value: Locale) => { setLanguage(value); localStorage.setItem("manzil-reviews-locale", value); document.documentElement.lang = value; };
  async function token() {
    const result = await supabase()?.auth.getSession();
    if (!result?.data.session?.access_token) throw new Error("Please sign in to continue.");
    return result.data.session.access_token;
  }
  async function signOut() { await supabase()?.auth.signOut(); setSession(null); window.location.assign("/"); }
  return <AppContext.Provider value={{ locale, setLocale, t: copy[locale], user: session?.user || null, session, authReady, token, signOut }}>{children}</AppContext.Provider>;
}
export function useApp() { const ctx = useContext(AppContext); if (!ctx) throw new Error("Missing Manzil provider"); return ctx; }
