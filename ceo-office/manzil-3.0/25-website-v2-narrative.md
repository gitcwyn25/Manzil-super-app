# 🌐 MANZIL — Website v2: The Product Narrative Site

> Captured 2026-08-07. **Honest assessment adopted:** the site shipped 2026-08-06 (Vibrant Marketplace, Genesis v1.0) is *a business directory with an AI chat attached*. Manzil is becoming *an AI operating system for real-world experiences*. Those are different products, and the site does not yet tell that story. V1 stays; V2 is built around the narrative rather than iterated out of the directory.

## The failure to fix

A visitor today cannot answer "what exactly is Manzil?" in five seconds. Mental model today: `Landing → search businesses → view business → book`, with AI as just another page. Target: `Life → Intent → Planning → Group decisions → Booking → Experience → Memory → Learning → Better next recommendation` — where listings are one node, not the product.

## Five questions the homepage must answer in 5 seconds

1. **What is Manzil?** — "The AI platform that plans real-life experiences with you." (not "AI concierge")
2. **Why different?** — tell Gurman what you're planning (birthday · date · coffee · wedding · family dinner · weekend · haircut · travel) and it plans everything (not "find businesses")
3. **How does it work?** — visual pipeline: you → tell Gurman → AI understands → compares hundreds of businesses → creates your plan → books → learns from your experience
4. **Why trust it?** — verified businesses, verified reviews, AI explains WHY, transparent recommendations, no sponsored manipulation, continuous learning
5. **What happens after booking?** — the unfair advantage: experience → review → memory → better recommendations forever

## Page structure

Hero (intent chips + "I'm planning…" typing animation opening straight into Gurman) · Meet Gurman (an experience planner, not a chatbot: customer → mission → knowledge → reasoning → businesses → plan) · **Multiplayer Planning** (its own section — nobody has this) · **Experience Workspace** (post-booking timeline: photos, reservations, expenses, memories, reviews, AI summary, next year) · **How AI thinks** (transparency, ending in "recommended because ✓ 10 min away ✓ fits budget ✓ quiet ✓ friends liked it ✓ available tonight") · Businesses (why they join: customers, AI recommendations, CRM, campaigns, analytics, announcements, bookings, customer memory, BI) · Marketplace Intelligence · Trust · Download.

**Gurman gets its own site at `/gurman`** (not `/concierge`): who Gurman is · what Gurman knows · **what Gurman cannot do** (this builds trust) · how Gurman reasons · multiplayer demo · experience-learning demo · AI privacy.

**Business landing reframed:** acquire → understand → communicate → grow → measure → improve, with every CRM module explained.

**New pages:** / · Discover · Business · Workspace · Gurman · How AI Works · Marketplace Intelligence · For Business · Business CRM · Pricing · Security · Privacy · Trust · Developers · API · Roadmap · Investors · Careers · Press.

## Guiding principle

> **The website demonstrates the product; it does not describe it.**

Interactive: AI playground (watch Gurman reason live) · multiplayer demo (five avatars vote, watch the compromise compute) · experience timeline (click dinner → photos, summary, expenses, reviews) · animated knowledge graph.

## ⚠️ BINDING SEQUENCING CONSTRAINT (orchestrator)

"Demonstrate, don't describe" collides with the platform's honesty rule: **most of what the demos would show does not exist yet** — multiplayer planning is Epic 11, the experience timeline is Epic 14, transparent reasoning is Epic 08, marketplace intelligence is Epic 06/13, the learning loop is Epic 10/16. A site that demos them as live product would be the most consequential fabrication we have shipped, in the one place customers and investors actually look.

Therefore:

- **Live demos may only be built on shipped capability.** Today that is: Gurman grounded recommendations (real), business/review data (real), the reasoning *pipeline as architecture* (real — the contracts exist and are inspectable).
- **Everything else ships as an explicitly-labelled preview** ("coming: multiplayer planning") or **not at all** — never as a working feature.
- The narrative may state the vision in future tense; the interactive surfaces may only enact the present tense.
- Each demo section unlocks when its epic ships — the site becomes progressively more honest-and-impressive rather than impressive-then-embarrassing.

## Phasing

1. **Product story** — homepage narrative rewrite (10-second comprehension). *Buildable now.*
2. **Interactive demos** — per-capability, each gated on its epic. *Partially buildable now (Gurman + reasoning-architecture explainer).*
3. **Trust & business** — Trust, Security, Privacy, Pricing, Business CRM pages. *Buildable now; Trust page must describe what verification actually exists today.*
4. **Developer & ecosystem** — docs, API, architecture, investors. *Gated on Epic 12.*

## Product pillars this site must establish

Intent-first planning · multiplayer decision making · Workspace as lifelong memory · experience intelligence · transparent AI reasoning · marketplace intelligence · AI-powered business CRM · trust and verification · privacy with user-controlled memory · continuous learning.
