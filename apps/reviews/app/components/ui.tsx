"use client";
import Link from "next/link";
import { ArrowUpRight, Clock3, MapPin, Search, Star, Store } from "lucide-react";
import { type Business, type Category, distance, opening, safeImage, text } from "../lib/api";
import { useApp } from "./providers";
export function Notice({ children, error = false }: { children: React.ReactNode; error?: boolean }) { return <div className={error ? "notice error" : "notice"} role={error ? "alert" : "status"}>{children}</div>; }
export function Empty({ title, children }: { title: string; children?: React.ReactNode }) { return <div className="empty-state"><div className="empty-icon"><Search size={28}/></div><h2>{title}</h2>{children}</div>; }
export function Rating({ rating, count }: { rating: number; count?: number }) {
  const { t } = useApp();
  return <span className="rating"><Star size={16} fill={count === 0 ? "none" : "currentColor"}/>{count === 0 ? <span className="muted">{t.noReviews}</span> : <><strong>{Number.isFinite(rating) ? rating.toFixed(1) : "–"}</strong>{count !== undefined && <span className="muted">({count})</span>}</>}</span>;
}
export function BusinessCard({ business: b, categories = [], location }: { business: Business; categories?: Category[]; location?: [number, number] }) {
  const { t, locale } = useApp();
  const photo = safeImage(b.coverPhotoUrl), open = opening(b), km = distance(b, location);
  const category = categories.find(c => c.slug === b.categorySlug);
  return <article className="business-card"><Link className="card-photo" href={`/business/${encodeURIComponent(b.slug)}`} tabIndex={-1} aria-hidden="true">{photo ? <img src={photo} alt="" loading="lazy"/> : <div className="photo-placeholder"><Store size={42}/><span>{text(category?.name, locale) || b.categorySlug.replace(/-/g, " ")}</span></div>}{open !== null && <span className={`open-badge ${open ? "" : "closed"}`}><span/>{open ? t.open : "Closed"}</span>}</Link><div className="card-content"><div className="card-category">{text(category?.name, locale) || b.categorySlug.replace(/-/g, " ")} {b.priceTier && <span>· {b.priceTier}</span>}</div><h2><Link href={`/business/${encodeURIComponent(b.slug)}`}>{b.name}<ArrowUpRight size={18}/></Link></h2><Rating rating={b.avgRating} count={b.reviewCount}/><p className="card-location"><MapPin size={14}/>{b.district || b.address}{km !== undefined && <span>· {km.toFixed(1)} km</span>}</p>{b.hours && <p className="card-hours"><Clock3 size={13}/>{b.hours}</p>}<div className="tag-row">{b.tags.slice(0, 2).map(tag => <span key={tag}>{tag}</span>)}</div></div></article>;
}
export function SignInPrompt() { const { t } = useApp(); return <Empty title="Make it your Manzil"><p>Sign in to write reviews, save your favourite places, and manage your business.</p><Link className="button" href="/auth">{t.signIn}</Link></Empty>; }
