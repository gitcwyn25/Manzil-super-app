import React from "react";
import { color, font, radius, shadow } from "../theme";
import {
  IconDashboard,
  IconStore,
  IconReviews,
  IconPhotos,
  IconAnalytics,
  IconSettings,
  IconLogout,
  IconSearch,
  IconBell,
  IconHelp,
  IconGlobe,
  IconEye,
  IconTrendUp,
  IconStar,
  IconStarHalf,
  IconVerified,
} from "../icons";

// Faithful recreation of the real Manzil Business merchant dashboard
// (source: brand-identity/biznes_dashboard_dashboard). Renders at a fixed
// internal size; the scene scales/positions it. Dynamic props drive animation.

export const DASH_W = 1360;
export const DASH_H = 900;

type Props = {
  views: number;
  viewsDelta: number; // %
  rating: number;
  ratingCount: number;
  searches: number;
  newReviews: number;
  replyText?: string; // typed-so-far reply
  verified?: number; // 0..1 badge reveal
  showCursor?: boolean;
};

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}> = ({ icon, label, active }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "13px 16px",
      borderRadius: radius.md,
      background: active ? color.tealContainer : "transparent",
      color: active ? color.tealSoft : color.inkVariant,
    }}
  >
    <span style={{ color: active ? "#eafffe" : color.inkVariant, display: "flex" }}>
      {icon}
    </span>
    <span style={{ fontFamily: font.ui, fontWeight: 500, fontSize: 19 }}>{label}</span>
  </div>
);

const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <div
    style={{
      background: color.surfaceLowest,
      border: `1px solid ${color.outlineVariant}`,
      borderRadius: radius.lg,
      boxShadow: shadow.card,
      padding: 22,
      ...style,
    }}
  >
    {children}
  </div>
);

const KpiLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    style={{
      fontFamily: font.ui,
      fontSize: 18,
      fontWeight: 500,
      color: color.inkVariant,
    }}
  >
    {children}
  </span>
);

const KpiValue: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      fontFamily: font.ui,
      fontSize: 44,
      fontWeight: 700,
      color: color.ink,
      letterSpacing: "-0.01em",
      lineHeight: 1.1,
      marginTop: 6,
    }}
  >
    {children}
  </div>
);

const KpiSub: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: font.ui, fontSize: 16, color: color.outline, marginTop: 4 }}>
    {children}
  </div>
);

export const Dashboard: React.FC<Props> = ({
  views,
  viewsDelta,
  rating,
  ratingCount,
  searches,
  newReviews,
  replyText = "",
  verified = 0,
  showCursor = false,
}) => {
  return (
    <div
      style={{
        width: DASH_W,
        height: DASH_H,
        background: color.surface,
        display: "flex",
        fontFamily: font.body,
        color: color.ink,
        overflow: "hidden",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: 262,
          flexShrink: 0,
          background: color.surface,
          borderRight: `1px solid ${color.outlineVariant}`,
          display: "flex",
          flexDirection: "column",
          padding: "26px 16px",
        }}
      >
        <div style={{ padding: "0 8px 22px" }}>
          <div
            style={{
              fontFamily: font.display,
              fontSize: 27,
              fontWeight: 700,
              color: color.teal,
              lineHeight: 1.1,
            }}
          >
            Manzil Business
          </div>
          <div
            style={{
              fontFamily: font.ui,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.02em",
              color: color.inkVariant,
              marginTop: 4,
            }}
          >
            Verified Merchant
          </div>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          <NavItem icon={<IconDashboard size={22} />} label="Dashboard" active />
          <NavItem icon={<IconStore size={22} />} label="My Listing" />
          <NavItem icon={<IconReviews size={22} />} label="Reviews" />
          <NavItem icon={<IconPhotos size={22} />} label="Photos" />
          <NavItem icon={<IconAnalytics size={22} />} label="Insights" />
          <NavItem icon={<IconSettings size={22} />} label="Settings" />
        </nav>
        <div style={{ borderTop: `1px solid ${color.outlineVariant}`, paddingTop: 16 }}>
          <div
            style={{
              background: color.gold,
              color: color.goldInk,
              fontFamily: font.ui,
              fontWeight: 700,
              fontSize: 18,
              textAlign: "center",
              padding: "14px 0",
              borderRadius: radius.md,
              marginBottom: 10,
            }}
          >
            Upgrade to Premium
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "12px 16px",
              color: color.inkVariant,
              fontFamily: font.ui,
              fontSize: 19,
              fontWeight: 500,
            }}
          >
            <IconLogout size={22} /> Logout
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Topbar */}
        <header
          style={{
            height: 74,
            flexShrink: 0,
            borderBottom: `1px solid ${color.outlineVariant}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 26px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: color.surfaceLow,
              borderRadius: radius.pill,
              padding: "11px 20px",
              width: 380,
              color: color.outline,
            }}
          >
            <IconSearch size={20} />
            <span style={{ fontFamily: font.body, fontSize: 17 }}>Qidirish...</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20, color: color.ink }}>
            <IconBell size={23} />
            <IconHelp size={23} />
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <IconGlobe size={23} />
              <span style={{ fontFamily: font.ui, fontSize: 14, fontWeight: 600 }}>UZ</span>
            </div>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: radius.pill,
                background: `linear-gradient(135deg, ${color.teal}, ${color.tealContainer})`,
                color: "#eafffe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: font.ui,
                fontWeight: 700,
                fontSize: 16,
                border: `1px solid ${color.outlineVariant}`,
              }}
            >
              ST
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ padding: 30, display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Business title + verified stamp */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                fontFamily: font.display,
                fontSize: 34,
                fontWeight: 700,
                color: color.ink,
              }}
            >
              Osh Markazi
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                opacity: verified,
                transform: `scale(${0.6 + 0.4 * verified})`,
                transformOrigin: "left center",
              }}
            >
              <IconVerified size={30} fill={color.teal} />
              <span
                style={{
                  fontFamily: font.ui,
                  fontSize: 16,
                  fontWeight: 600,
                  color: color.teal,
                }}
              >
                Verified Merchant
              </span>
            </div>
          </div>

          {/* KPI grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <KpiLabel>Profil ko'rishlar</KpiLabel>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    background: color.tealFixed,
                    color: color.teal,
                    fontFamily: font.ui,
                    fontWeight: 700,
                    fontSize: 14,
                    padding: "3px 9px",
                    borderRadius: radius.pill,
                  }}
                >
                  <IconTrendUp size={14} strokeWidth={2.6} /> +{Math.round(viewsDelta)}%
                </span>
              </div>
              <KpiValue>{fmt(views)}</KpiValue>
              <KpiSub>bu hafta</KpiSub>
            </Card>

            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <KpiLabel>Yangi fikrlar</KpiLabel>
                <IconReviews size={22} color={color.gold} />
              </div>
              <KpiValue>{Math.round(newReviews)}</KpiValue>
              <KpiSub>javob berilmagan</KpiSub>
            </Card>

            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <KpiLabel>O'rtacha reyting</KpiLabel>
                <IconStar size={22} fill={color.gold} />
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <KpiValue>{rating.toFixed(1)}</KpiValue>
                <span style={{ fontFamily: font.ui, fontSize: 15, color: color.outline }}>
                  ({fmt(ratingCount)} ta)
                </span>
              </div>
              <div style={{ display: "flex", gap: 2, marginTop: 6 }}>
                <IconStar size={18} fill={color.gold} />
                <IconStar size={18} fill={color.gold} />
                <IconStar size={18} fill={color.gold} />
                <IconStar size={18} fill={color.gold} />
                <IconStarHalf size={18} fill={color.gold} />
              </div>
            </Card>

            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <KpiLabel>Qidiruvda chiqish</KpiLabel>
                <IconEye size={22} color={color.teal} />
              </div>
              <KpiValue>{fmt(searches)}</KpiValue>
              <KpiSub>oxirgi 7 kun</KpiSub>
            </Card>
          </div>

          {/* Review response queue */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div
                style={{
                  fontFamily: font.display,
                  fontSize: 27,
                  fontWeight: 700,
                  color: color.ink,
                }}
              >
                Fikrlarga javob bering
              </div>
              <span
                style={{
                  background: color.errorContainer,
                  color: color.onErrorContainer,
                  fontFamily: font.ui,
                  fontWeight: 600,
                  fontSize: 15,
                  padding: "5px 14px",
                  borderRadius: radius.pill,
                }}
              >
                2 ta yangi
              </span>
            </div>

            <Card style={{ padding: 24 }}>
              <div style={{ display: "flex", gap: 16 }}>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: radius.pill,
                    background: color.goldSoft,
                    color: color.goldInk,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: font.ui,
                    fontWeight: 700,
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  A
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: font.ui, fontWeight: 700, fontSize: 19, color: color.ink }}>
                    Azizbek Rahimov
                  </div>
                  <div style={{ display: "flex", gap: 2, marginTop: 3 }}>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <IconStar key={i} size={16} fill={color.gold} />
                    ))}
                  </div>
                  <div
                    style={{
                      fontFamily: font.body,
                      fontSize: 17,
                      color: color.inkVariant,
                      marginTop: 8,
                    }}
                  >
                    Ajoyib joy, osh zo'r edi. Albatta yana kelaman!
                  </div>

                  {/* Owner reply (typed) */}
                  {replyText.length > 0 && (
                    <div
                      style={{
                        marginTop: 14,
                        background: color.tealContainer,
                        borderRadius: radius.md,
                        padding: "13px 16px",
                        display: "inline-flex",
                        alignItems: "center",
                        maxWidth: "90%",
                      }}
                    >
                      <span style={{ fontFamily: font.body, fontSize: 17, color: "#eafffe" }}>
                        {replyText}
                        {showCursor && (
                          <span style={{ opacity: 0.7, color: color.tealSoft }}>▍</span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};
