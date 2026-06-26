# Compliance & Security Roadmap — Real World Comics, LLC

**Prepared:** June 2026
**Scope:** astralnautstudios.com and all subdomains/properties operated by Real World Comics, LLC.
**Posture today:** Direct-to-consumer digital comics publisher. No PHI, no card data stored on-server (Stripe handles PCI), no government data, no automotive data, no EU financial-services data.

> This is a working roadmap, not a compliance attestation. Nothing in this document constitutes legal advice. Every framework that requires an audit or certification requires engagement of an accredited assessor (CPA firm for SOC 2, ISO-accredited CB for 27001/42001, QSA for PCI, C3PAO for CMMC, etc.).

---

## 1. Framework-by-framework triage

Legend: **In scope** = applies to this business, plan to comply / certify. **Out of scope** = does not apply to this business or sector. **Inherit** = covered by an upstream provider (Stripe, Lovable Cloud / Supabase, Cloudflare, Resend) under their own audits; we inherit controls and reference their reports.

| # | Framework | Status | Why |
|---|-----------|--------|-----|
| 1 | **SOC 2 Type II** | In scope (future, optional) | Only required if you sell to enterprise B2B. Not needed for D2C consumers. Defer until B2B revenue justifies ~$30–60k/yr audit + readiness cost. |
| 2 | **NIST 800-171** | Out of scope | Protects DoD Controlled Unclassified Information. You don't handle CUI. |
| 3 | **DORA** | Out of scope | EU regulation for financial entities (banks, insurers, trading venues, crypto-asset service providers). You're a comics publisher. |
| 4 | **AWS FTR** | Out of scope | Required only if listing on AWS Marketplace as an ISV. |
| 5 | **CCPA / CPRA** | **In scope NOW** | California consumers visit the site. Need privacy notice, "Right to Know/Delete/Correct/Limit", "Do Not Sell or Share My Personal Information" link, opt-out preference signal (GPC) honoring. |
| 6 | **NYCRR 500 (2023)** | Out of scope | NY DFS rule for licensed financial-services companies. |
| 7 | **ISO 27001** | In scope (future, optional) | Same calculus as SOC 2 — only if enterprise/EU B2B requires it. Defer. |
| 8 | **NIST 800-53** | Out of scope | US federal-system control catalog; FedRAMP is the consumer of this. |
| 9 | **HITRUST** | Out of scope | Healthcare framework. You don't process PHI. |
| 10 | **MVSP** | **In scope NOW** | Minimum Viable Secure Product is a free Google/Salesforce checklist of baseline controls. Aim for full compliance — it's free, public, and 90% maps to other frameworks. |
| 11 | **TISAX** | Out of scope | Automotive supplier framework. |
| 12 | **Microsoft SSPA** | Out of scope | Only required if you process MS Personal Data as a Microsoft supplier. |
| 13 | **CMMC** | Out of scope | US Defense Industrial Base. |
| 14 | **ISO 42001** | In scope (future) | AI Management System. Becomes relevant if/when you ship customer-facing AI features. Defer until then. |
| 15 | **HIPAA** | Out of scope | No PHI. Do NOT claim "HIPAA compliant" — it would require BAAs with every subprocessor and a complete administrative-safeguards program. |
| 16 | **Cyber Essentials (UK)** | In scope (cheap, fast) | UK gov-backed self-assessment, ~£300. Wins UK trust and maps cleanly to MVSP. Good optional badge. |
| 17 | **OFDSS** | Out of scope | Open Finance Data Security Standard. Banking/fintech. |
| 18 | **USDP** | In scope NOW | "US state privacy laws" umbrella — CCPA + Virginia (VCDPA) + Colorado (CPA) + Connecticut + Utah + Texas + Oregon + Montana + Delaware + Iowa + Tennessee + …. Honor universal opt-out signals (GPC). |
| 19 | **GDPR** | **In scope NOW** | EU/EEA/UK visitors. Need lawful basis, DPIA where applicable, DSAR process, data-processor contracts (Art. 28), cookie consent (ePrivacy), international transfer mechanism (SCCs) for any non-EU subprocessor. |
| 20 | **NIS 2** | Out of scope | EU directive for "essential" and "important" entities in named sectors (energy, transport, banking, health, etc.). Comics publisher does not qualify. |
| 21 | **Custom** | N/A | Use this slot if a future enterprise customer dictates a bespoke control set. |
| 22 | **EU-US Data Privacy Framework** | **In scope NOW** | If you serve EU users and use US-based processors (you do: Stripe, Resend, Lovable/Cloudflare, Supabase), self-certify under DPF *or* use SCCs. SCCs are the default and don't require DOC self-certification. |
| 23 | **ACSC Essential Eight** | Out of scope | Australian gov mitigation strategies designed for managed endpoints / Windows fleets. Not applicable to a SaaS web app. |
| 24 | **PCI DSS** | **Inherit (SAQ-A)** | Stripe Checkout/Elements means card data never touches your servers. You qualify for the lightest self-assessment (SAQ-A, ~22 questions). Must still complete SAQ-A annually and not log/store card numbers anywhere. |

---

## 2. What's actually achievable in the platform (Lovable / TanStack / Supabase)

These are the controls I can implement in code right now. Everything else lives in a Google Doc, a vendor agreement, or an auditor's workbook.

### 2.1 Implemented this turn (option 1)
- `/trust` — customer-facing security overview (no false certification claims).
- `/privacy` — combined GDPR/CCPA/USDP privacy notice.
- `/terms` — terms of service.
- `/cookies` — cookie policy with category breakdown.
- `/subprocessors` — vendor list (Stripe, Resend, Supabase via Lovable Cloud, Cloudflare, Shopify).
- `/dsar` — DSAR intake form (access / delete / correct / opt-out of sale-share).
- `/.well-known/security.txt` — RFC 9116 vulnerability disclosure contact.
- Cookie consent banner with deny-by-default for non-essential categories.
- Global Privacy Control (`Sec-GPC: 1`) detection — automatic opt-out for US privacy laws.
- Footer links to all of the above.

### 2.2 Next platform increments (not in this turn)
- **Security response headers** via Cloudflare Workers response middleware: `Strict-Transport-Security`, `Content-Security-Policy` (start in report-only), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`. CSP needs careful authoring against the actual asset/connect-src graph; do this as its own change with a report-only rollout.
- **MFA enforcement for admin accounts** (Supabase MFA enrollment + a route gate that requires `aal2`).
- **Audit log table** for admin actions (`admin_audit_log` with append-only RLS).
- **Rate limiting** on `/api/public/*` and auth endpoints (Cloudflare WAF rules + per-IP token bucket in handlers).
- **Data retention job** — purge `visitor_hits` older than 30 days, `analytics_events` older than 13 months. Cron on `pg_cron`.
- **DSAR fulfillment automation** — server fn that, given a verified email, exports / deletes a user's rows across `profiles`, `subscribers`, `subscriptions`, `letters`, `letter_comments`, `raffle_entries`, `leads`, `visitor_hits`, `analytics_events`.
- **Encryption at rest disclosure** — already true via Supabase/Postgres + Cloudflare. Document it on `/trust`.
- **Backup / DR statement** — Lovable Cloud (Supabase) does daily PITR; document RPO/RTO on `/trust`.

### 2.3 Off-platform work (you / counsel / vendors)
- **Data Processing Addendum (DPA)** with every subprocessor: Stripe ✅ (in TOS), Resend ✅, Supabase ✅, Cloudflare ✅, Shopify ✅. Save copies to a Drive folder.
- **Standard Contractual Clauses (SCCs)** — covered by each vendor's DPA. Inventory them.
- **Records of Processing Activities (RoPA)** — GDPR Art. 30. One spreadsheet listing every category of personal data, lawful basis, recipients, retention. ~half-day exercise.
- **Information security policy** — short markdown doc covering access control, incident response, secure SDLC, vendor management. Required by SOC 2, ISO 27001, MVSP, Cyber Essentials. Templates exist (e.g., Vanta/Drata starter pack, SANS templates).
- **Incident response runbook** — who is paged, how customers are notified, GDPR 72-hour breach clock.
- **Annual penetration test** — required by SOC 2, recommended by everyone. ~$5–15k.
- **Background checks + security training** for any employee/contractor with prod access. Required by SOC 2.
- **Stripe SAQ-A** completed annually in the Stripe Dashboard.

---

## 3. Recommended sequence

| Phase | Window | Cost | Outcome |
|-------|--------|------|---------|
| **Phase 0 — Trust surface** | This week | $0 | `/trust`, `/privacy`, `/terms`, `/cookies`, `/dsar`, `/subprocessors`, cookie consent, security.txt, footer wiring. **DONE THIS TURN.** |
| **Phase 1 — MVSP baseline** | 2–4 weeks | $0 | Security headers (CSP report-only first), admin MFA enforcement, audit log table, retention cron, DSAR automation, rate limits. |
| **Phase 2 — Paper trail** | 1 month, async | $0–$500 | InfoSec policy, IR runbook, RoPA, subprocessor DPA inventory, Stripe SAQ-A annual. |
| **Phase 3 — Cyber Essentials (UK)** | 1 week, when ready | ~£300 | Public badge, maps to MVSP. |
| **Phase 4 — SOC 2 Type II** | 6–12 months | $30–60k/yr | Engage Vanta/Drata + a CPA firm. Only if B2B revenue justifies it. |
| **Phase 5 — ISO 27001 / 42001** | 12+ months | $20–40k/yr | If EU enterprise / AI features. |

---

## 4. Things this site MUST NOT say

To stay legally defensible, the marketing surface and the trust page must not claim:

- "SOC 2 certified / compliant" — until a CPA issues a Type II report.
- "ISO 27001 certified" — until an accredited CB issues a certificate.
- "HIPAA compliant" — would require BAAs you don't have, and you don't process PHI.
- "PCI DSS compliant" beyond SAQ-A scope. Wording: "Card payments are handled by Stripe, a PCI DSS Level 1 service provider; card data never reaches our servers."
- "GDPR certified" — there is no such certification. Correct wording: "We process personal data in line with the GDPR."
- "FedRAMP", "CMMC", "HITRUST certified" — not applicable.
- "Bank-level / military-grade encryption" — meaningless marketing phrase; auditors flag it.

Use factual, scoped language: "TLS 1.2+ in transit. AES-256 at rest via our cloud provider. Card data tokenized by Stripe."

---

## 5. Open questions for you

1. **Business contact email for legal/privacy/security?** Need three addresses or one shared: `privacy@`, `legal@`, `security@`. Currently I'll wire to `legal@astralnautstudios.com` — confirm or change.
2. **DPO / Privacy contact name?** GDPR doesn't require a DPO for a publisher of your size, but the privacy policy needs a named natural-or-legal contact. Default: "Real World Comics, LLC, attn: Privacy."
3. **Registered business address** for the privacy policy footer and DSAR responses.
4. **Are you actually selling to UK/EU consumers today?** Yes → GDPR fully applies. Geofence-out → GDPR exposure drops to "they happened to visit," still applies for visitors but lighter.
5. **California "Do Not Sell or Share" — are you running any ad/analytics that could be construed as a "sale" or "sharing for cross-context behavioral advertising"?** Right now: no ads, GA-less analytics, no third-party cookies → you can truthfully say "we do not sell or share." Confirm.

Answer these and I'll wire them into the actual policy copy on the next pass.
