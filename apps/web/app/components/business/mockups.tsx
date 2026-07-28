/**
 * High-fidelity product mockups for the business marketing site.
 *
 * These render the *actual* Manzil business dashboard surfaces (overview,
 * review inbox, promotions composer, analytics) as real UI — not wireframe
 * placeholders — so the marketing page shows a shipping product the way
 * Asana/Linear market theirs. Purely presentational and aria-hidden; styled
 * by the `.mk-*` rules in globals.css.
 */

type SampleBusiness = {
  name: string;
  district: string;
  category: string;
  rating: string;
};

const FALLBACK: SampleBusiness = {
  name: "Caravan Coffee",
  district: "Chilonzor",
  category: "Kafe",
  rating: "4.8"
};

function Icon({ name }: { name: "grid" | "star" | "tag" | "chart" | "gear" }) {
  const common = {
    width: 15,
    height: 15,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const
  };
  switch (name) {
    case "grid":
      return (
        <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
      );
    case "star":
      return <svg {...common}><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5z" /></svg>;
    case "tag":
      return <svg {...common}><path d="M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0l-7-7a2 2 0 01-.6-1.4V4a1 1 0 011-1h7.8a2 2 0 011.4.6l7 7a2 2 0 010 2.8z" /><circle cx="7.5" cy="7.5" r="1.3" /></svg>;
    case "chart":
      return <svg {...common}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>;
    case "gear":
      return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7.7 1.6 1.6 0 01-3.2 0 1.6 1.6 0 00-2.7-.7l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00-1.1-2.7 1.6 1.6 0 010-3.2 1.6 1.6 0 001.1-2.7l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 002.7-.7 1.6 1.6 0 013.2 0 1.6 1.6 0 002.7.7l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00.7 2.7 1.6 1.6 0 010 3.2 1.6 1.6 0 00-1 .9z" /></svg>;
  }
}

function Chrome({ label }: { label: string }) {
  return (
    <div className="mk-chrome">
      <span className="mk-dot" />
      <span className="mk-dot" />
      <span className="mk-dot" />
      <span className="mk-chrome-pill">{label}</span>
    </div>
  );
}

function Sidebar({ active }: { active: "grid" | "star" | "tag" | "chart" }) {
  const items: Array<{ key: "grid" | "star" | "tag" | "chart" | "gear"; label: string; badge?: string }> = [
    { key: "grid", label: "Boshqaruv" },
    { key: "star", label: "Sharhlar", badge: "3" },
    { key: "tag", label: "Aksiyalar" },
    { key: "chart", label: "Statistika" },
    { key: "gear", label: "Sozlamalar" }
  ];
  return (
    <aside className="mk-side">
      <div className="mk-side-brand">
        Manzil<span className="mk-side-brand-dot" />
      </div>
      <nav className="mk-nav">
        {items.map((item) => (
          <span className={item.key === active ? "mk-nav-item active" : "mk-nav-item"} key={item.key}>
            <Icon name={item.key} />
            {item.label}
            {item.badge ? <b className="mk-nav-badge">{item.badge}</b> : null}
          </span>
        ))}
      </nav>
    </aside>
  );
}

/** Hero: the dashboard overview screen. */
export function DashboardMock({ business = FALLBACK }: { business?: SampleBusiness }) {
  const bars = [38, 52, 45, 63, 58, 74, 88];
  return (
    <div aria-hidden="true" className="mk-frame mk-dashboard">
      <Chrome label="app.manzil.uz/boshqaruv" />
      <div className="mk-app">
        <Sidebar active="grid" />
        <div className="mk-main">
          <div className="mk-main-head">
            <div className="mk-biz">
              <span className="mk-biz-logo">{business.name.charAt(0)}</span>
              <span>
                <strong>{business.name}</strong>
                <small>{business.district} · {business.category}</small>
              </span>
            </div>
            <span className="mk-pill-rating"><i>★</i> {business.rating}</span>
          </div>
          <div className="mk-kpis">
            <div className="mk-kpi">
              <span>Ko&apos;rishlar</span>
              <strong>2 480</strong>
              <i className="up">+18%</i>
            </div>
            <div className="mk-kpi">
              <span>Sharhlar</span>
              <strong>132</strong>
              <i className="up">+6</i>
            </div>
            <div className="mk-kpi">
              <span>Reyting</span>
              <strong>{business.rating}</strong>
              <i className="gold">★★★★★</i>
            </div>
          </div>
          <div className="mk-panel">
            <div className="mk-panel-head">
              <span>Haftalik ko&apos;rishlar</span>
              <b className="up">▲ 24%</b>
            </div>
            <div className="mk-bars">
              {bars.map((h, i) => (
                <i key={i} style={{ height: `${h}%` }} className={i === bars.length - 1 ? "peak" : undefined} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Feature: review inbox with reply. */
export function ReviewsMock({ business = FALLBACK }: { business?: SampleBusiness }) {
  return (
    <div aria-hidden="true" className="mk-frame mk-reviews">
      <Chrome label={`${business.name} · Sharhlar`} />
      <div className="mk-review-list">
        <div className="mk-review">
          <span className="mk-avatar">A</span>
          <div className="mk-review-body">
            <div className="mk-review-top">
              <strong>Aziza R.</strong>
              <span className="mk-stars">★★★★★</span>
            </div>
            <p>Ajoyib joy, xizmat zo&apos;r edi. Kofe hidi hali ham yodimda.</p>
            <div className="mk-owner-reply">
              <b>Sizning javobingiz</b>
              <p>Rahmat, Aziza! Sizni yana kutamiz.</p>
            </div>
          </div>
        </div>
        <div className="mk-review">
          <span className="mk-avatar alt">D</span>
          <div className="mk-review-body">
            <div className="mk-review-top">
              <strong>Doston K.</strong>
              <span className="mk-stars">★★★★<i className="off">★</i></span>
            </div>
            <p>Yaxshi, lekin buyurtma biroz kechikdi.</p>
            <div className="mk-reply-bar">
              <span className="mk-reply-ph">Javob yozing…</span>
              <span className="mk-reply-btn">Javob berish</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Feature: promotion / deal composer (the O2O core). */
export function PromoMock() {
  return (
    <div aria-hidden="true" className="mk-frame mk-promo">
      <Chrome label="Aksiyalar · Yangi" />
      <div className="mk-promo-body">
        <div className="mk-promo-card">
          <div className="mk-promo-img">
            <span className="mk-promo-pct">−20%</span>
          </div>
          <div className="mk-promo-meta">
            <strong>Tushlik seti</strong>
            <small>Dush–Juma · 12:00–15:00</small>
            <div className="mk-promo-price">
              <em>45 000</em> 36 000 so&apos;m
            </div>
          </div>
        </div>
        <div className="mk-promo-form">
          <label className="mk-field">
            <span>Sarlavha</span>
            <span className="mk-input filled">Tushlik seti −20%</span>
          </label>
          <label className="mk-field">
            <span>Muddat</span>
            <span className="mk-input">7 kun</span>
          </label>
          <span className="mk-publish">E&apos;lon qilish</span>
        </div>
      </div>
    </div>
  );
}

/** Feature: analytics with a real area chart. */
export function AnalyticsMock() {
  return (
    <div aria-hidden="true" className="mk-frame mk-analytics">
      <Chrome label="Statistika · Bu oy" />
      <div className="mk-analytics-body">
        <div className="mk-analytics-head">
          <span>
            <small>Bu oy ko&apos;rishlar</small>
            <strong>18 240</strong>
          </span>
          <b className="up">▲ 24%</b>
        </div>
        <svg className="mk-chart" viewBox="0 0 320 128" preserveAspectRatio="none" role="presentation">
          <defs>
            <linearGradient id="mk-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path className="mk-chart-area" d="M0,96 L53,84 L106,90 L160,60 L213,66 L266,36 L320,26 L320,128 L0,128 Z" fill="url(#mk-area)" />
          <path className="mk-chart-line" d="M0,96 L53,84 L106,90 L160,60 L213,66 L266,36 L320,26" fill="none" />
          <circle className="mk-chart-dot" cx="320" cy="26" r="4" />
        </svg>
        <div className="mk-top-list">
          <div className="mk-top-row">
            <span>Kofe &amp; nonushta</span>
            <em>1 240</em>
          </div>
          <div className="mk-top-row">
            <span>Tushlik seti</span>
            <em>980</em>
          </div>
          <div className="mk-top-row">
            <span>Shirinliklar</span>
            <em>610</em>
          </div>
        </div>
      </div>
    </div>
  );
}
