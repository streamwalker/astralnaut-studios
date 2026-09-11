# Canonical Control Plan

Generated: 2026-09-11T01:49:57Z

| Control | Title | Gate | Severity | Applicability | Verification |
|---|---|---|---|---|---|
| GOV-001 | Define scope, boundary, owners, and release authority | both | blocker | applicable | manual |
| GOV-002 | Complete applicability decisions and pin sources | both | blocker | applicable | mixed |
| GOV-003 | Operate policies, roles, reviews, and temporary exceptions | assurance | high | applicable | manual |
| RSK-001 | Maintain threat model and risk treatment | both | blocker | applicable | manual |
| AST-001 | Inventory assets, data, dependencies, vendors, and subprocessors | both | high | applicable | mixed |
| PRIV-001 | Minimize data and enforce its lifecycle | both | high | applicable | mixed |
| PRIV-002 | Align behavior, consent, disclosures, and third parties | both | blocker | applicable | mixed |
| IAM-001 | Implement secure identity, authentication, enrollment, and recovery | release | blocker | applicable | mixed |
| IAM-002 | Protect privileged access and workforce identity | both | blocker | applicable | mixed |
| AUTHZ-001 | Enforce server-side authorization and tenant isolation | release | blocker | applicable | automated |
| SES-001 | Protect sessions, tokens, and critical actions | release | blocker | applicable | automated |
| SEC-001 | Eliminate embedded and exposed secrets | release | blocker | applicable | automated |
| CRY-001 | Use approved cryptography and managed key lifecycles | both | blocker | applicable | mixed |
| NET-001 | Secure network communication and trust validation | release | blocker | applicable | mixed |
| APP-001 | Validate untrusted input and encode output | release | blocker | applicable | automated |
| APP-002 | Defend business logic and resource use | release | high | applicable | mixed |
| APP-003 | Fail safely without debug or sensitive errors | release | blocker | applicable | mixed |
| SDLC-001 | Require protected changes, review, and security impact declarations | both | blocker | applicable | mixed |
| TST-001 | Run automated code, dependency, secret, and infrastructure checks | release | blocker | applicable | automated |
| TST-002 | Run dynamic, API, authorization, and fuzz testing | release | high | applicable | automated |
| TST-003 | Obtain independent security testing for high assurance | assurance | blocker | not_applicable | external |
| SUP-001 | Pin dependencies and produce complete SBOM and provenance | release | blocker | applicable | automated |
| SUP-002 | Build, sign, and deploy only through controlled identities | both | blocker | applicable | mixed |
| CFG-001 | Harden infrastructure and detect drift | release | blocker | applicable | mixed |
| LOG-001 | Create authoritative, privacy-safe security logging | both | high | applicable | mixed |
| MON-001 | Monitor, alert, and respond to security signals | both | high | applicable | mixed |
| VUL-001 | Operate vulnerability intake, triage, remediation, and disclosure | both | blocker | applicable | mixed |
| IR-001 | Maintain and exercise incident response | assurance | blocker | applicable | manual |
| RES-001 | Engineer availability, backups, restoration, and continuity | both | high | applicable | mixed |
| TPR-001 | Assess vendors, SDKs, subprocessors, and shared responsibility | assurance | high | applicable | manual |
| HR-001 | Operate personnel security and role-based training | assurance | high | applicable | manual |
| PHY-001 | Document physical and environmental control inheritance | assurance | medium | applicable | external |
| IOS-001 | Pin and satisfy current Apple submission requirements | release | blocker | not_applicable | manual |
| IOS-002 | Verify final archive identity, signing, entitlements, and release configuration | release | blocker | not_applicable | mixed |
| IOS-003 | Verify iOS dependency and SDK supply chain | release | blocker | not_applicable | automated |
| IOS-004 | Make privacy manifests, labels, consent, ATT, and behavior consistent | release | blocker | not_applicable | mixed |
| IOS-005 | Protect iOS secrets and local data | release | blocker | not_applicable | mixed |
| IOS-006 | Secure iOS network, deep links, WebViews, and entry points | release | blocker | not_applicable | mixed |
| IOS-007 | Secure iOS authentication, biometrics, and account lifecycle | release | blocker | not_applicable | mixed |
| IOS-008 | Protect sensitive iOS UI, logging, diagnostics, and accessibility paths | release | high | not_applicable | mixed |
| IOS-009 | Inspect and dynamically test the final iOS release on real devices | release | blocker | not_applicable | mixed |
| IOS-010 | Apply threat-driven app integrity and fraud controls | release | high | not_applicable | mixed |
| AI-001 | Inventory and govern AI systems, models, data, and vendors | both | blocker | not_applicable | mixed |
| AI-002 | Test and monitor AI security, safety, and decision risks | both | blocker | not_applicable | mixed |
| PAY-001 | Minimize and isolate payment-card scope | both | blocker | applicable | mixed |
| HLTH-001 | Confirm regulated-health scope and protect ePHI | both | blocker | not_applicable | mixed |
| FIN-001 | Confirm regulated-finance scope and customer-information safeguards | both | blocker | pending | mixed |
| CHLD-001 | Protect children and verify parental controls where required | both | blocker | not_applicable | mixed |
| EDU-001 | Protect covered education records and institutional control | both | high | not_applicable | mixed |
| GOVT-001 | Define federal, defense, and CUI authorization boundaries | both | blocker | not_applicable | mixed |
| EU-001 | Confirm EU cybersecurity and market-access obligations | assurance | blocker | pending | manual |

Framework mappings are directional coverage aids, not proof of conformity.
