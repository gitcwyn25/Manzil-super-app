# Manzil Homepage + Gurman Mobile Handoff

**Status:** DRAFT FOR DESIGN REVIEW  
**Date:** 2026-09-04  
**Owner:** Manzil product/design  
**Audience:** Figma designer, product owner, frontend engineer, motion designer  
**Source of truth:** [`docs/designs/manzil-web-mobile-gurman.md`](./manzil-web-mobile-gurman.md)  
**Related system:** [`docs/design/PRODUCT-EXPERIENCE-SYSTEM.md`](../design/PRODUCT-EXPERIENCE-SYSTEM.md)

> This is a design and content handoff. It does not authorize code changes, route changes, prompt execution, content publication, deployment, or the restoration of web Gurman chat.

## 1. Decision in one page

Manzil's homepage should explain one product system with four clear web jobs:

1. **Discover:** find and compare real local businesses available in the directory.
2. **For Businesses:** join or claim a business presence.
3. **Docs / Trust Center:** understand how the product works, what evidence means, and what is not available.
4. **Gurman mobile:** learn about the future mobile planning experience and join its waitlist.

Gurman must be visible on the homepage, but not presented as a second web product. The homepage may show a **static mobile preview** of a local-life planning concept. It must not show a simulated live chat, fake recommendation generation, fake availability, booking confirmation, app download buttons, or autonomous coordination.

### The central sentence

> Manzil helps people move from “what should we do?” to a trustworthy local plan; Discover makes the network visible, and Gurman makes the plan adaptive.

This is a product direction, not a claim that every future capability is live today.

## 2. Scope and boundaries

### In scope for this handoff

- Startup homepage narrative and section order.
- Homepage hero with a visible Gurman mobile entry point.
- A dedicated Gurman mobile preview section.
- Status labels for current, preview, planned, and unavailable capabilities.
- Figma page/frame/component structure.
- Static visual specifications for a Gurman plan preview.
- Higgsfield motion-study briefs, not executable generation prompts.
- Uzbek, Russian, and English homepage/Gurman copy.
- Claim and evidence guardrails for design review.

### Not in scope

- A web Gurman or Concierge chat.
- A new public `/gurman` or `/concierge` page.
- App-store links or an assertion that the mobile app is downloadable.
- Booking, payment, reservation, provider orchestration, or real-time availability.
- Invented ratings, reviews, metrics, customer counts, coverage claims, or testimonials.
- A new visual language that conflicts with the shipped Manzil tokens.
- Final Higgsfield prompts or generated assets before the static hierarchy is approved.

## 3. Homepage job, audience, and success criteria

### Page job

In the first few seconds, a visitor should understand:

- **What Manzil is now:** a local-business discovery and comparison product starting in Tashkent.
- **What Gurman is:** a future mobile planning experience for local life.
- **What to do next:** open Discover, join the Gurman mobile waitlist, read Docs, or enter For Businesses.

### Primary audiences

| Audience | Immediate question | Correct destination |
|---|---|---|
| Local resident or visitor | “Where can I find a real place that fits?” | Discover |
| Group-outing planner | “Could Manzil eventually help us plan the whole experience?” | Gurman mobile preview / waitlist |
| Business owner | “How do I appear or claim my business?” | For Businesses |
| Careful evaluator or future partner | “What is real, and how does the system handle evidence?” | Docs / Trust Center |

### Design success criteria

- A visitor can distinguish **Discover now** from **Gurman mobile next** without opening a chat.
- The primary homepage CTA opens Discover.
- The secondary CTA routes to the canonical localized Gurman waitlist.
- The Gurman preview is visibly labelled as mobile and preview/planned, not live.
- No visual state implies that a recommendation, booking, payment, or provider action has completed.
- Uzbek, Russian, and English communicate the same product boundary rather than translating old web-chat promises.
- The page remains readable with reduced motion, reduced transparency, narrow mobile width, and text scaling.

## 4. Recommended narrative and section map

The homepage should be designed as one vertical story. The current component names are implementation context only; the following order is the design target.

| Order | Section | User takeaway | Status treatment |
|---:|---|---|---|
| 01 | Hero | Manzil helps people discover real local places; Gurman is the mobile future | Discover = Live; Gurman = Preview / Planned |
| 02 | Discover proof | The useful product today is the real directory and its available fields | Live, with data-dependent language |
| 03 | Gurman mobile preview | A narrow example of the planning direction, not a live assistant | Preview, persistent label |
| 04 | System map | Discover → plan → coordinate → experience → remember, with boundaries visible | Mixed status strip |
| 05 | Trust | Missing data is shown as missing; evidence and uncertainty are explicit | Live policy / Docs |
| 06 | Choose a path | Discover, For Businesses, Docs, or Gurman mobile waitlist | Route-specific |
| 07 | Footer | One canonical set of routes, locales, legal links, and contact paths | Live links only |

### Sections to remove, defer, or verify before using

- **Fake testimonials:** remove from the startup homepage unless each person, quote, relationship, and permission is verified.
- **Unverified metrics:** remove `85%`, customer counts, coverage counts, “best,” and performance claims unless a dated evidence owner is attached.
- **Web-concierge language:** remove “Chat with Gurman AI,” “AI Concierge,” “generating real-time recommendation,” and equivalent localized phrases.
- **Full pricing grid:** keep pricing in the business surface unless prices and entitlements are verified for the homepage audience.
- **City-expansion waitlist:** do not use it as the Gurman waitlist. The Gurman form is a separate, email-first interest path with a fixed topic.

## 5. Hero direction

### Layout

**Desktop:** two-column composition within the existing wide container.

- Left: eyebrow, two-line headline, factual subtitle, primary Discover CTA, secondary Gurman mobile waitlist CTA, three small trust/context notes.
- Right: an editorial “local life system” composition, not a chat transcript. Combine a restrained map/capability motif, a directory card, and a small mobile-plan card. The right side may feel cinematic, but every visible status must be explicit.

**Mobile:** single column.

1. Brand and navigation.
2. Eyebrow and headline.
3. Subtitle.
4. Primary CTA.
5. Secondary waitlist CTA.
6. Compact static visual with no horizontal overflow.
7. Context notes.

### Hero visual rule

Do not depict a person typing to an AI and receiving a completed answer. A static composition may show:

- a directory card marked `Discover / Live`;
- a small phone silhouette marked `Gurman / Mobile preview`;
- plan chips such as venue, food, cake, budget, and time;
- an arrow or connector labelled `future planning layer`.

No result list should look like a live query response. No cursor, spinner, streaming text, “thinking” state, fake percentage, or “real-time” label.

### Hero CTA contract

- **Primary:** `Explore Discover` / localized equivalent → `/{locale}/discover`.
- **Secondary:** `Join the Gurman mobile waitlist` / localized equivalent → `/{locale}/waitlist/gurman`.
- **Never:** `Chat with Gurman AI`, `Start concierge`, `Download the app`, `Book now`, or `Get an instant recommendation`.

## 6. Gurman mobile preview section

### Section purpose

Give Gurman a concrete, emotionally legible place on the homepage without pretending that the mobile product is available. The section should answer:

- What kind of problem is Gurman intended to help with?
- What can a plan include?
- What is available today?
- What is the next honest action?

### Recommended desktop composition

Use a dark, elevated section with a controlled liquid-glass material treatment.

**Left column — narrative**

- Eyebrow: `Gurman AI · Mobile experience`.
- Heading: “From ‘what should we do?’ to a clearer plan.”
- Body: explain that Gurman is being developed as a mobile planner for local experiences and may bring several preferences into one editable plan.
- Scenario chips: `Venue`, `Food`, `Cake`, `Transport`, `Budget`, `Atmosphere`, `Time`.
- Persistent status row: `Mobile preview` + `Waitlist open`.
- CTA: canonical localized waitlist.

**Right column — static phone preview**

Show a phone-shaped research artifact, not an app screenshot that could be mistaken for a shipped screen.

- Header: `Gurman mobile · Preview`.
- Scenario: `Birthday for 4 people`.
- Sub-label: `Example planning workspace`.
- Four to seven neutral plan cards/chips: venue, food, cake, transport, budget, atmosphere, timing.
- Evidence affordance may be shown as a disabled/annotated concept, for example `Evidence will be shown here` with a `Planned` label. Do not populate it with fabricated businesses, ratings, prices, or times.
- Bottom label: `Concept preview · no booking or live availability`.

The prototype may use a fixed birthday scenario because it is the agreed first research case. It should not imply that the product only supports birthdays.

### Section state labels

Every high-fidelity frame must retain one visible state label. Recommended hierarchy:

1. `Gurman AI`
2. `Mobile preview`
3. `Waitlist open`
4. `No web chat or booking yet`

The last line may be shortened on narrow screens, but the boundary must remain available in the section or its nearby annotation.

### Responsive behavior

- At desktop widths, keep narrative and phone preview side by side.
- At tablet widths, preserve the phone preview above or beside the CTA; do not shrink text to save the two-column layout.
- At mobile widths, stack the phone preview below the explanation and before the CTA or immediately after it, depending on the chosen reading flow.
- Chips wrap to two rows maximum in the public section. Overflowing chips are not a carousel.
- The static preview must remain understandable if all motion is disabled.

## 7. Capability status system

Use one vocabulary across Figma annotations, page copy, prototype labels, Docs, and implementation tickets.

| Status | Meaning | Public affordance |
|---|---|---|
| **Live** | Backed by a tested production route or API | Normal link/action is allowed |
| **Preview** | Static or research artifact with no real side effect | Show persistent label; no consequential action inside preview |
| **Planned** | Future direction, not available | Explain without an action that implies availability |
| **Unavailable** | Intentionally disabled or not supported | Say so plainly when confusion is likely |

### Localized status labels

| English | Uzbek | Russian |
|---|---|---|
| Live | Hozir mavjud | Доступно сейчас |
| Preview | Preview | Предпросмотр |
| Planned | Rejada | В планах |
| Unavailable | Mavjud emas | Недоступно |
| Mobile | Mobil | Мобильный |
| Waitlist open | Kutish ro‘yxati ochiq | Лист ожидания открыт |

### Homepage capability matrix

| Capability | Status in the design | Copy rule |
|---|---|---|
| Browse/search available local directory entries | Live | Say “find,” “browse,” and “compare available directory data.” |
| Gurman visual concept | Preview | Label every phone/mockup frame as preview or concept. |
| Gurman mobile planning assistant | Planned | Say “being developed,” “future mobile planner,” or equivalent. |
| Web Gurman / Concierge chat | Unavailable | Do not show a chat CTA or imply a web session. |
| Group collaboration and shared plan | Planned | Describe as direction, not a current feature. |
| Provider booking, payment, and guaranteed availability | Unavailable | Do not simulate a completed action. |
| MCP integration | Planned | Mention only in Docs/roadmap, not as a current homepage action. |

## 8. Visual system for Figma

### Preserve shipped foundations

Use the existing Manzil/Kosmonavtlar token family as the starting point. Do not create a parallel palette for the homepage.

| Role | Existing token | Value / guidance |
|---|---|---|
| Deep cinematic background | `--void` | `#0a1a1e` |
| Light content panel | `--panel` | `#f1f3f2` |
| Primary ceramic accent | `--ceramic` | `#00706b` |
| Live/active signal | `--signal` | `#4de1c1`; state only, not decoration everywhere |
| Value/rating brass | `--brass` | `#c8a24c`; do not use as warning/status |
| Primary text | `--text` | `#0d1a1c` |
| Muted text | `--muted` / `--dust` | Use only where contrast remains sufficient |
| Border | `--outline` / `--line` | Use for quiet separation, not low-contrast text |

### Material levels

Use liquid glass selectively:

- **Level 0 — solid reading surface:** Docs, legal, dense directory content, filters, and evidence tables.
- **Level 1 — soft panel:** Homepage cards and business summary cards with a stable opaque fallback.
- **Level 2 — elevated glass:** Hero overlays, Gurman preview frame, and floating navigation where the background is quiet enough to preserve contrast.

Every glass frame needs an opaque fallback and a reduced-transparency variant. Blur is a material treatment, not a substitute for contrast.

### Shape and motion

- Reuse existing radius tokens: `10px`, `16px`, `24px`, `32px` as `sm`, `md`, `lg`, `xl`.
- Use an 8-point layout grid in Figma; map final spacing to the existing CSS tokens during implementation.
- Reuse existing motion tokens: `180ms`, `360ms`, `700ms`, `--ease-out`, and `--ease-spring`.
- Respect `prefers-reduced-motion`; decorative looping motion must disappear or become a static state.
- Do not add a determinate progress animation unless a real measured process supplies the value.

### Typography

Use the existing semantic font roles (`body`, `display`, and `data`) from the web shell. Do not make a new font family part of this handoff. Validate long Uzbek Latin words, Russian Cyrillic, and English line lengths in the same component.

## 9. Figma file and frame structure

Create the handoff as a small, inspectable file rather than one oversized canvas.

### Pages

1. `00 Readme + Claims`
2. `01 Foundations`
3. `02 Components`
4. `03 Homepage — Desktop`
5. `04 Homepage — Mobile`
6. `05 Gurman — Mobile Research Preview`
7. `06 Prototype + Annotations`
8. `07 Localization`

### Required frames

- `Home/uz/Desktop/1440`
- `Home/ru/Desktop/1440`
- `Home/en/Desktop/1440`
- `Home/uz/Mobile/390`
- `Home/ru/Mobile/390`
- `Home/en/Mobile/390`
- `GurmanPreview/uz/Desktop/1440`
- `GurmanPreview/ru/Mobile/390`
- `GurmanPreview/en/Mobile/390`
- `Waitlist/uz/Form`
- `Waitlist/ru/Form`
- `Waitlist/en/Form`
- `Trust/CapabilityStatusMatrix`

### Component variants

At minimum, define variants for:

- `StatusBadge`: `Live`, `Preview`, `Planned`, `Unavailable` × locale.
- `CTA`: `Primary`, `Secondary`, `Text` × `Default`, `Hover`, `Focus`, `Disabled`.
- `GlassPanel`: `OpaqueFallback`, `Glass`, `ReducedTransparency`.
- `GurmanPreviewCard`: `Desktop`, `Mobile`, `NoMotion`.
- `PlanChip`: `Venue`, `Food`, `Cake`, `Transport`, `Budget`, `Atmosphere`, `Time`.
- `WaitlistForm`: `Idle`, `Submitting`, `Success`, `Error` — with truthful, non-destructive states.

### Annotation convention

Each non-obvious visual element gets a small annotation with:

- `Status:` Live / Preview / Planned / Unavailable.
- `Evidence:` source route, API field, product decision, or “research concept.”
- `Owner:` product, data, engineering, or legal.
- `Verified:` date or `Not yet verified`.
- `Fallback:` what remains when image, blur, animation, or data is unavailable.

## 10. Higgsfield motion-study briefs

These are shot specifications for later prompt writing. They are intentionally not final generation prompts.

### Study A — Manzil material language

- **Purpose:** establish a restrained transition between solid directory data and elevated planning surfaces.
- **Duration:** 5–7 seconds.
- **Aspect ratios:** 16:9 hero study and 9:16 mobile crop.
- **Visual:** deep `--void` field, low-amplitude teal/signal refraction, a directory card resolves into a stable phone-outline preview.
- **Motion:** one slow material shift; no looping “AI thinking.”
- **Text:** only static labels `Discover · Live` and `Gurman · Mobile preview`.
- **Static fallback:** composed hero artwork with the same two labels.
- **Prohibited:** map coverage, live markers, generated answers, fake data, app-store UI, booking confirmation.

### Study B — Plan assembly

- **Purpose:** communicate the idea of combining local-life constraints into one future mobile plan.
- **Duration:** 6–8 seconds.
- **Aspect ratios:** 9:16 primary, 1:1 social crop only if labels remain legible.
- **Visual:** neutral plan shell; chips for venue, food, cake, transport, budget, atmosphere, and time settle into a group.
- **Motion:** chips enter as editorial composition, not as a measured processing sequence.
- **Text:** `Concept preview` and `No booking or live availability` remain visible.
- **Static fallback:** phone frame with all chips already composed.
- **Prohibited:** “Searching 24 places,” percentages, spinner, typing cursor, real business names, ratings, prices, or “confirmed.”

### Study C — Discover to Gurman bridge

- **Purpose:** show that the two surfaces share a foundation without presenting Gurman as a web feature.
- **Duration:** 4–6 seconds.
- **Visual:** an opaque Discover card gently transitions to a mobile preview card through a single connector line.
- **Motion:** one directional handoff, no autonomous agent behavior.
- **Static fallback:** side-by-side cards with the caption `Discover now · Gurman mobile next`.
- **Prohibited:** direct browser-to-app launch, live sync, booking handoff, or fake provider action.

### Motion QA

Before any generated asset is considered for production design:

- test with motion disabled;
- test the static fallback at all three locales;
- verify that labels do not disappear during the transition;
- verify no frame implies live availability or completed action;
- verify no new factual claim appears only in motion;
- keep the Figma static frame as the source of truth.

## 11. Localized copy deck

The following copy is the first approved-direction draft for Figma. It is written to preserve meaning across locales, not to translate the old web-chat narrative.

### 11.1 Navigation and hero

| Key | Uzbek | Russian | English |
|---|---|---|---|
| `nav.discover` | Kashf etish | Каталог | Discover |
| `nav.business` | Biznes uchun | Для бизнеса | For Businesses |
| `nav.docs` | Hujjatlar | Документы | Docs |
| `nav.gurman` | Gurman mobil | Gurman mobile | Gurman mobile |
| `hero.badge` | Toshkentdan boshlanadi | Начинаем с Ташкента | Starting in Tashkent |
| `hero.title.1` | Haqiqiy joylarni toping. | Находите реальные места. | Find real places. |
| `hero.title.2` | Keyingi rejangizni tasavvur qiling. | Планируйте то, что будет дальше. | Plan what comes next. |
| `hero.subtitle` | Manzil Toshkentdagi mavjud mahalliy bizneslarni topish va solishtirishga yordam beradi. Gurman AI esa kelajakdagi mobil rejalashtirish tajribasi sifatida ishlab chiqilmoqda. | Manzil помогает находить и сравнивать доступные локальные бизнесы в Ташкенте. Gurman AI разрабатывается как будущий мобильный помощник для планирования впечатлений. | Manzil helps you find and compare available local businesses in Tashkent. Gurman AI is being developed as a future mobile planner for local experiences. |
| `hero.primaryCta` | Joylarni kashf etish | Открыть каталог | Explore Discover |
| `hero.secondaryCta` | Gurman mobiliga qo‘shilish | В лист ожидания Gurman mobile | Join the Gurman mobile waitlist |
| `hero.context.1` | Mavjud katalog ma’lumotlari | Доступные данные каталога | Available directory data |
| `hero.context.2` | Toshkentdan boshlang | Начинаем с Ташкента | Starting in Tashkent |
| `hero.context.3` | Bepul ko‘rish | Бесплатный просмотр | Free to explore |

**Uzbek note:** Use `qo‘shilish` for joining the waitlist and `kashf etish` for Discover. Avoid the old hero phrase `Rejani boshlash`, which makes the current web surface sound like an active planner.

### 11.2 Gurman mobile preview

| Key | Uzbek | Russian | English |
|---|---|---|---|
| `gurman.eyebrow` | Gurman AI · mobil tajriba | Gurman AI · мобильный опыт | Gurman AI · mobile experience |
| `gurman.title` | “Nima qilamiz?” savolidan aniqroq rejaga. | От «что будем делать?» — к понятному плану. | From “what should we do?” to a clearer plan. |
| `gurman.body` | Gurman AI mahalliy tajribalarni rejalashtirish uchun mobil tajriba sifatida ishlab chiqilmoqda. U joy, taom, tort, transport, budjet, kayfiyat va vaqt kabi afzalliklarni bitta tahrirlanadigan reja atrofida ko‘rishga yordam berishi ko‘zda tutilgan. | Gurman AI разрабатывается как мобильный планировщик локальных впечатлений. Он должен помогать собрать в одном редактируемом плане место, еду, торт, транспорт, бюджет, атмосферу и время. | Gurman AI is being developed as a mobile planner for local experiences. It is designed to bring venue, food, cake, transport, budget, atmosphere, and timing into one editable plan. |
| `gurman.boundary` | Hozir: konsept va kutish ro‘yxati. Webda chat yoki bronlash yo‘q. | Сейчас: концепция и лист ожидания. Веб-чата и бронирования пока нет. | Now: concept and waitlist. No web chat or booking yet. |
| `gurman.cta` | Gurman kutish ro‘yxatiga qo‘shilish | В лист ожидания Gurman | Join the Gurman waitlist |
| `gurman.status` | Mobil preview · Kutish ro‘yxati ochiq | Предпросмотр · мобильный продукт · лист ожидания открыт | Mobile preview · Waitlist open |
| `gurman.preview.title` | 4 kishilik tug‘ilgan kun | День рождения для 4 человек | Birthday for 4 people |
| `gurman.preview.subtitle` | Reja konsepti | Концепция плана | Example planning workspace |
| `gurman.preview.footer` | Konsept preview · bronlash yoki jonli mavjudlik yo‘q | Концепт · без бронирования и онлайн-доступности | Concept preview · no booking or live availability |

**Copy note:** `tahrirlanadigan reja` / `редактируемый план` / `editable plan` describes the intended interaction model, not a shipped capability. Keep the `Preview` or `Concept` label adjacent to the phone frame.

### 11.3 Gurman plan chips

| Key | Uzbek | Russian | English |
|---|---|---|---|
| `chip.venue` | Joy | Место | Venue |
| `chip.food` | Taom | Еда | Food |
| `chip.cake` | Tort | Торт | Cake |
| `chip.transport` | Transport | Транспорт | Transport |
| `chip.budget` | Budjet | Бюджет | Budget |
| `chip.atmosphere` | Kayfiyat | Атмосфера | Atmosphere |
| `chip.time` | Vaqt | Время | Timing |

### 11.4 Capability status copy

| Capability | Uzbek | Russian | English |
|---|---|---|---|
| Discover | `Hozir mavjud` — Toshkent katalogidagi mavjud bizneslarni ko‘ring va solishtiring. | `Доступно сейчас` — находите и сравнивайте доступные бизнесы в каталоге Ташкента. | `Live` — browse and compare available businesses in the Tashkent directory. |
| Gurman mobile | `Preview` — mobil rejalashtirish tajribasi; kutish ro‘yxati ochiq. | `Предпросмотр` — мобильный планировщик в разработке; лист ожидания открыт. | `Preview` — mobile planning experience in development; waitlist open. |
| Group planning | `Rejada` — guruh bilan birga tahrirlash va muvofiqlashtirish yo‘nalishda. | `В планах` — совместное редактирование и координация находятся в разработке. | `Planned` — shared editing and coordination are future direction. |
| Booking / payments | `Mavjud emas` — hozircha simulyatsiya qilinmaydi. | `Недоступно` — сейчас не симулируем это действие. | `Unavailable` — we do not simulate this action today. |

### 11.5 Trust and waitlist copy

| Key | Uzbek | Russian | English |
|---|---|---|---|
| `trust.title` | Haqiqat ma’lumotdan boshlanadi. | Доверие начинается с данных. | Trust starts with evidence. |
| `trust.body` | Har bir da’vo o‘z manbasiga ega bo‘lishi kerak. Ma’lumot bo‘lmasa, biz buni ochiq ko‘rsatamiz. | У каждого утверждения должен быть источник. Если данных нет, мы показываем это прямо. | Every claim needs a source. When data is missing, we show that plainly. |
| `waitlist.badge` | Gurman mobil | Gurman mobile | Gurman mobile |
| `waitlist.title` | Mobil Gurman tajribasiga qiziqasizmi? | Хотите узнать о мобильном Gurman? | Curious about the Gurman mobile experience? |
| `waitlist.body` | Email manzilingizni qoldiring — Gurman mobil tajribasi haqida yangiliklar bo‘lsa, xabar beramiz. | Оставьте email — мы сообщим новости о мобильном Gurman, когда появятся обновления. | Leave your email and we will share updates about Gurman mobile as they become available. |
| `waitlist.email` | Email manzilingiz | Ваш email | Your email |
| `waitlist.cta` | Yangiliklardan xabardor bo‘lish | Узнавать новости | Get updates |
| `waitlist.note` | Spam yo‘q. Faqat Gurman mobil tajribasi haqidagi yangiliklar. | Без спама. Только новости о мобильном Gurman. | No spam. Only updates about Gurman mobile. |
| `waitlist.success` | Rahmat — siz ro‘yxatdasiz. | Спасибо — вы в списке. | Thank you — you are on the list. |
| `waitlist.error` | Emailni tekshirib, qayta urinib ko‘ring. | Проверьте email и попробуйте ещё раз. | Check your email and try again. |

The waitlist copy must not promise a launch date, early access, bonus, download, booking, or guaranteed reply. The form should be email-first; do not add a city field unless the backend contract is explicitly changed and approved.

### 11.6 Path cards and footer

| Key | Uzbek | Russian | English |
|---|---|---|---|
| `path.discover.title` | Haqiqiy joylarni kashf eting | Находите реальные места | Discover real places |
| `path.discover.body` | Mavjud katalog ma’lumotlarini ko‘ring, solishtiring va keyingi qadamni o‘zingiz tanlang. | Смотрите доступные данные каталога, сравнивайте и выбирайте следующий шаг сами. | Browse available directory details, compare options, and choose your next step. |
| `path.business.title` | Biznesingizni qo‘shing | Добавьте свой бизнес | Add your business |
| `path.business.body` | Biznes profilingizni yaratish yoki mavjud profilni boshqarish yo‘lini ko‘ring. | Узнайте, как создать или заявить профиль компании. | See how to create or claim a business profile. |
| `path.docs.title` | Tizim qanday ishlashini o‘qing | Узнайте, как устроена система | See how the system works |
| `path.docs.body` | Dalillar, cheklovlar va kelajakdagi imkoniyatlar haqida ochiq ma’lumot. | Открыто о данных, ограничениях и будущих возможностях. | Clear information about evidence, limits, and future capabilities. |
| `path.gurman.title` | Gurman mobilini kuting | Ждите Gurman mobile | Follow Gurman mobile |
| `path.gurman.body` | Mobil rejalashtirish tajribasi ishlab chiqilmoqda. | Мобильный планировщик находится в разработке. | The mobile planning experience is in development. |
| `footer.disclaimer` | Manzil Toshkentdagi mavjud mahalliy biznes ma’lumotlaridan boshlanadi. Gurman mobil tajribasi ishlab chiqilmoqda. | Manzil начинает с доступных данных о локальных бизнесах в Ташкенте. Gurman mobile находится в разработке. | Manzil starts with available local-business data in Tashkent. Gurman mobile is in development. |

## 12. Copy guardrails

| Do not use | Use instead |
|---|---|
| `Chat with Gurman AI` | `Join the Gurman mobile waitlist` |
| `Gurman AI Concierge` | `Gurman AI · mobile experience` |
| `Generating real-time recommendation…` | `Mobile preview` or no processing status |
| `Verified data` as a blanket promise | `Available directory data` or the exact evidence label |
| `The best places` without a defined, evidenced scope | `Places available in the directory` |
| `Book now`, `confirmed`, `reserved`, `guaranteed availability` | Omit until the action is real and verified |
| `AI understands everything` | Describe the narrow planning direction and its limits |
| `We are expanding rapidly` | State only a verified launch/coverage fact |
| `Join for early access`, `special bonus`, or a launch date | `Get updates about Gurman mobile` |
| A fabricated avatar, review, rating, or customer count | A verified quote or no testimonial block |

## 13. Claim and evidence matrix for design review

This matrix should be copied into `00 Readme + Claims` in Figma and linked to the final content review.

| Claim or visible element | Allowed status | Evidence owner / source | Review rule |
|---|---|---|---|
| Manzil helps people find and compare available local businesses in Tashkent | Live | Web Discover route and current directory fields | Keep wording tied to available data; do not say complete coverage |
| Gurman is a future mobile planner for local experiences | Planned | Approved product-direction record | Keep mobile and future qualifiers adjacent |
| Gurman phone frame | Preview | Figma research artifact | Must carry `Preview` or `Concept` label in the frame |
| Birthday-for-four scenario | Preview / research fixture | Product design brief | Do not use real-looking provider facts unless separately verified |
| Venue/food/cake/transport/budget/atmosphere/time chips | Planned concept | Product direction | Present as editable dimensions, not completed services |
| Web chat | Unavailable | Route/product boundary | No chat UI, no chat CTA, no streaming state |
| Booking/payment/live availability | Unavailable | Product boundary | No confirmation screen, reservation language, or real-time badge |
| Directory ratings, reviews, hours, photos | Live only when field-backed | Catalog source and field-level audit | Render missing values as missing or unknown |
| Customer testimonials and metrics | Only if individually verified | Evidence owner + permission record | Otherwise remove from homepage |
| Waitlist is open | Live only after route/API smoke test | Waitlist route and submission contract | Do not imply launch timing or access guarantee |

## 14. Prototype annotation examples

Use these labels in Figma rather than burying status in a separate document:

```text
STATUS: PREVIEW
EVIDENCE: Research concept; no live provider data
OWNER: Product/design
VERIFIED: Not applicable
FALLBACK: Static phone frame with plan chips
```

```text
STATUS: LIVE
EVIDENCE: /{locale}/discover and current directory response
OWNER: Web/data
VERIFIED: Record date during implementation QA
FALLBACK: Empty or unavailable field state
```

```text
STATUS: UNAVAILABLE
EVIDENCE: Current product boundary
OWNER: Product
VERIFIED: 2026-09-04
FALLBACK: Plain text explanation; no action affordance
```

## 15. Handoff checklist

### Before Figma review

- [ ] The hero has one clear Discover CTA and one clearly mobile Gurman CTA.
- [ ] The hero visual contains no fake chat or fake live-processing state.
- [ ] The Gurman section has a persistent `Mobile preview` / `Preview` label.
- [ ] The static phone frame contains no fabricated business, price, rating, hour, or availability.
- [ ] `Live`, `Preview`, `Planned`, and `Unavailable` are visually distinct without relying on colour alone.
- [ ] All three locales are placed in the same component variants and tested for line length.
- [ ] Opaque fallback and reduced-motion variants exist for every glass/motion frame.
- [ ] The canonical waitlist form is email-first and has no unapproved city or preference fields.

### Before implementation handoff

- [ ] Product owner approves the copy and status vocabulary.
- [ ] The claim/evidence matrix has an owner and verification date for every public claim.
- [ ] The route contract is rechecked against source and production.
- [ ] The existing landing copy is scrubbed for stale web-chat, real-time, testimonial, metric, and app-download language.
- [ ] The canonical waitlist schema and success/error states are confirmed.
- [ ] The low-fidelity homepage → Discover → business detail → mobile waitlist flow is tested before motion polish.
- [ ] Higgsfield studies have static fallbacks and are not treated as product truth.

## 16. Next handoff sequence

1. Review this copy and status system.
2. Build the Figma foundation and static homepage/Gurman frames.
3. Run the low-fidelity boundary test: can users tell Discover is live and Gurman is mobile/future?
4. Revise the high-fidelity system based on comprehension, not only visual preference.
5. Write the final Higgsfield prompts from the approved static frames.
6. Only after explicit design approval, create the engineering implementation ticket and update the homepage source.

**Current state:** this brief is created locally for review. Homepage source, routes, deployment, and the open PR have not been changed by this artifact.
