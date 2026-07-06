# Finance — Manzil

*Working model, July 2026. All projections are illustrative and assumption-driven; change the assumptions before arguing with the outputs. FX assumption: **1 USD ≈ 13 000 UZS**.*

## Revenue streams (in order of arrival)

| # | Stream | Mechanics | Status |
|---|---|---|---|
| 1 | **Merchant SaaS** | Free / Pro 399k / Max 499k UZS per month, admin-set, billed via Payme | Live product; billing integration in progress |
| 2 | **Transactions** | 5–10% take-rate on vouchers, deal-sets, and bookings redeemed in-store | 2027 |
| 3 | **Advertising** | Promoted placement in search & discovery (clearly labelled; never touches organic review ranking) | 2028 |
| 4 | **Fintech-adjacent** (option) | Payment-linked loyalty/cashback with Payme/Click rails | 2029+, optional |

Blended paying ARPU today ≈ **419k UZS ≈ $32/mo** (assumes 80% Pro / 20% Max).

## 5-year projection (USD, thousands)

| | 2026 | 2027 | 2028 | 2029 | 2030 |
|---|---|---|---|---|---|
| Paying merchants (EOY) | 100 | 600 | 2 000 | 5 000 | 10 000 |
| Subscriptions | 19 | 134 | 499 | 1 344 | 2 880 |
| Transactions (7% of GMV) | — | 35 | 210 | 840 | 2 450 |
| Advertising | — | — | 50 | 250 | 700 |
| **Revenue** | **19** | **169** | **759** | **2 434** | **6 030** |
| Team | 66 | 190 | 450 | 900 | 1 500 |
| Marketing | 30 | 120 | 250 | 500 | 900 |
| Infra + ops | 21 | 55 | 90 | 200 | 350 |
| **Costs** | **117** | **365** | **790** | **1 600** | **2 750** |
| **Net cash flow** | **−98** | **−196** | **−31** | **+834** | **+3 280** |
| **Cumulative** | −98 | −294 | −325 | +509 | +3 789 |

**Read:** trough ≈ **−$325k** in 2028; operating breakeven crosses during 2028–29. Team costs assume Tashkent salaries (loaded avg ≈ $1.1–1.8k/mo, rising with seniority).

## Funding plan

| Round | When | Amount | Use |
|---|---|---|---|
| Pre-seed | 2026 H2 | ~$200k | Mobile apps, Payme billing, first sales team, 12–15 mo runway |
| Seed | 2027 | $1–1.5M | Transaction layer at scale, 3 new cities, team → 15 |
| Series A | 2029 (optional — model self-funds from 2029) | for speed, not survival | National coverage, fintech layer |

## Cap table

**Today:** Founder — 100%.

**Target post-pre-seed:**

| Holder | % |
|---|---|
| Founder & CEO | 62 |
| Co-founder CTO | 16 |
| Founding team | 2 |
| ESOP | 10 |
| Pre-seed investors | 10 |

**Indicative post-seed** (20% round + ESOP top-up): CEO ~47%, CTO ~12%, ESOP ~12%, pre-seed ~7.5%, seed ~20%, team ~1.5%.

## Unit economics (targets)

- CAC per paying merchant (doorstep + Telegram motion): **≤ $40** → payback **< 2 months** at $32 ARPU
- Merchant gross margin ≈ 90% (software); transaction margin ≈ 85% of take
- Consumer side deliberately free — it is the audience the merchant pays for
- Churn guardrail: monthly logo churn < 3% once activated (activation = replied to a review or posted a promo)

## Policies that protect the model

- Review integrity is the moat: **reviews are never removable for payment** — structural.
- Pricing lives in the database (admin console), not in code or contracts.
- Currency risk: prices set in UZS and repriced quarterly against FX; costs are ~90% UZS-denominated (natural hedge).
