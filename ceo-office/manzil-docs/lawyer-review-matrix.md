# Manzil — huquqshunos ko‘rib chiqish matritsasi

**Maqsad:** Manzilning Uzbek, Russian va English hujjatlarini O‘zbekiston yuristi tez tekshirishi uchun clause-to-law xaritasi.

**Holat:** Draft — nashrdan oldin qualified Uzbekistan commercial/data-protection counsel review majburiy.

| Hujjat / band | Draftdagi qoida | Tegishli manba | Yurist tekshirishi kerak | Mahsulot dalili |
|---|---|---|---|---|
| Privacy 1 | Operatorning to‘liq nomi, manzili, privacy contact | LRU-547, Personal Data Law; LexUZ: https://lex.uz/en/docs/4396419 | Huquqiy shaxs, operator/owner roli va vakolatli kontakt to‘g‘rimi? | Legal entity record, privacy inbox |
| Privacy 2–4 | Ma’lumot kategoriyalari, maqsadlar, consent va marketing choice | LRU-547, especially Arts. 21, 23, 30–31: https://lex.uz/en/docs/4396419 | Har bir processing purpose uchun rozilik kerakmi yoki boshqa asos bormi? Notice formasi yetarlimi? | Consent UI, event log, withdrawal flow |
| Privacy 5 / AI Transparency | AI tavsiyasi informatsion; yuridik ahamiyatli qarorning yagona asosi emas | O‘RQ-1115, 21 Jan 2026: https://lex.uz/en/docs/8011930 | Manzil funksiyasi “legally significant decision”ga kirmasligini va human oversight wordingini tasdiqlash | Prompt flow, model policy, human escalation |
| Privacy 6 | Hosting, analytics, maps, auth va AI providerlar bilan ulashish | LRU-547 Arts. 27–28, 31: https://lex.uz/en/docs/4396419 | Har bir processor, purpose, confidentiality va contract language mosmi? | Vendor register, DPAs, access controls |
| Privacy 7 | Biometric/genetic/telecom data uchun local-storage; boshqa data uchun cross-border mechanism | LRU-1125, effective 27 Mar 2026: https://lex.uz/en/docs/8105926 | Qaysi data kategoriyasi Manzilga tegishli? Adequacy/SCC/BCR/standard mechanism amalda mavjudmi? | Data map, server map, transfer assessment |
| Privacy 8–10 | Retention, security, access/correction/withdrawal/deletion requests | LRU-547 Arts. 20, 27, 30–31: https://lex.uz/en/docs/4396419 | Retention schedule, deletion exceptions va State Register talablari | Deletion jobs, request tickets, register record |
| Privacy 11 | Cookie choices | LRU-547; consumer/advertising requirements where tracking is used | Non-essential analytics/marketing cookie consent neededmi? Vendor list to‘liqmi? | Cookie inventory, consent banner |
| Privacy 12 | Children’s data | LRU-547 and applicable civil/consumer rules | Age threshold, parental consent and product restrictions neededmi? | Age gate or data-minimization controls |
| Terms 2 | Manzil — catalogue/information platform; business is the service provider | LRU-792 Electronic Commerce Law Arts. 3, 12–13: https://lex.uz/en/docs/6213428 | Current product model catalogue, order aggregator yoki electronic trading platformmi? | Product flow, payment/order architecture |
| Terms 3 | AI output is not a guarantee or professional advice | O‘RQ-1115: https://lex.uz/en/docs/8011930 | Disclaimer wording and prohibited decision use sufficiently clearmi? | AI notice placement |
| Terms 5 / Reviews | User content, moderation, takedown and business response | LRU-547; Civil/IP rules; consumer law: https://lex.uz/docs/4525010 | Content licence, defamation, privacy, copyright and notice-and-action process | Report button, moderation log, appeal SLA |
| Terms 6 / Ads | Sponsored listings separated and labeled | LRU-776 Advertising Law Arts. 5, 16, 18, 31, 47, 49: https://lex.uz/en/docs/6052633 | “Reklama”/“Homiylik” label, native ads, comparative claims and platform liability | Ad label component, campaign approval |
| Terms 7 | IP ownership and user-content licence | Applicable Uzbekistan copyright rules | Licence scope, scraping restrictions and third-party photos review | Terms acceptance, asset provenance |
| Terms 8 | Third-party maps, messaging, calls and payment links | LRU-792 and provider terms | Responsibility allocation and external-link disclosures | Vendor links and notices |
| Terms 9 | Paid plans, refunds and business services | Consumer Protection Law Arts. 5–8, 10, 21, 28-1: https://lex.uz/docs/4525010 | Price, tax/receipt, cancellation, refund, auto-renewal and unfair-term risks | Checkout, invoice, refund policy |
| Terms 11 | Liability limitation subject to mandatory consumer rights | Consumer Protection Law Art. 21 and related mandatory rules | Clause enforceability and prohibited exclusions | Counsel-approved clause |
| Terms 13 | Uzbekistan law and pre-action contact | Applicable civil procedure and consumer rules | Court/venue wording, consumer complaints and authority rights | Complaint workflow |
| Business profile | Seller identity, address, working hours, prices, licenses/permits and update date | Consumer Protection Law Arts. 5–7, 28-1: https://lex.uz/docs/4525010; LRU-792 Arts. 9, 12–16: https://lex.uz/en/docs/6213428 | What data must be visible for catalogue vs transaction flows? | Profile schema, verification evidence |
| E-commerce operations | Notification, resident legal entity and separate bank account requirements | Cabinet Resolution No. 885, 26 Dec 2024: https://lex.uz/uz/docs/7285113 | Does Manzil qualify as regulated operator? Which notification and settlement rules apply? | Legal classification memo, bank setup |
| Cookie / marketing | Consent records and withdrawal | LRU-547 and applicable advertising/communications rules | Per-channel, per-business and retention requirements | Consent model, CampaignSend audit |
| All versions | Uzbek/Russian/English legal text parity | Language and contract interpretation review | Which language controls in case of conflict? | Versioning and locale QA |

## Counsel sign-off questions

1. Confirm Manzil’s legal entity, operator/owner status and regulated e-commerce classification.
2. Confirm whether the current product is only a directory or also an order aggregator/platform.
3. Confirm each data category, server location, AI provider and cross-border transfer mechanism.
4. Confirm privacy notice, consent wording, marketing opt-out, retention and data-request procedure.
5. Confirm review moderation, copyright, defamation, business takedown and appeal procedures.
6. Confirm advertising labels and responsibility for sponsored business claims.
7. Confirm payment, refund, receipt, tax and consumer-contract obligations if paid services are enabled.
8. Confirm the controlling language and publication/versioning process.

## Evidence to attach for counsel

- Current product user flows and screenshots
- Data inventory and vendor/server list
- Consent and withdrawal event examples
- Cookie inventory
- Business profile fields and verification process
- Advertising placement examples
- Payment/refund flows, if enabled
- Final legal entity registration details

*This matrix organizes research for review. It is not a legal opinion or a certification of compliance.*