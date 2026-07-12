import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, metaFor } from "@/components/legal-page";
import { LEGAL_CONFIG } from "@/config/legal";

const D = LEGAL_CONFIG.documents.terms;

export const Route = createFileRoute("/terms")({
  head: () => metaFor({
    title: "Terms of Service — Streamwalkers Corporation",
    description: "Terms of Service governing access to and use of AstralnautStudios.com and the Astralnaut Studios and Real World Comics imprints.",
    path: "/terms",
  }),
  component: TermsPage,
});

function TermsPage() {
  const addr = LEGAL_CONFIG.mailingAddress;
  return (
    <LegalPage
      title="Terms of Service"
      eyebrow="Streamwalkers Corporation"
      effective={D.effective}
      updated={D.updated}
      version={D.version}
      canonical="/terms"
    >
      <h2>1. Agreement and contracting party</h2>
      <p>These Terms of Service (“Terms”) govern access to and use of AstralnautStudios.com, Real World Comics, related web readers, member areas, forums, shops, promotions, and associated services (collectively, the “Service”). The Service is operated by <strong>Streamwalkers Corporation</strong>, a Delaware corporation (“Streamwalkers,” “we,” “us,” or “our”). Astralnaut Studios and Real World Comics are imprints and brands of Streamwalkers Corporation, not separate contracting parties.</p>
      <p>By accessing the Service, creating an account, starting a subscription, making a purchase, or otherwise indicating acceptance, you agree to these Terms. If you do not agree, do not use the Service.</p>
      <p>Our Privacy Policy, Subscription and Billing Policy, Community Guidelines, Copyright and DMCA Policy, Cookie Policy, and any promotion-specific official rules are incorporated into these Terms by reference.</p>

      <h2>2. The Service</h2>
      <p>The Service provides access to digital comics, motion-enhanced pages, audio elements, creator commentary, community features, polls, canon voting, member benefits, merchandise, and promotional activities. Some pages may be available without an account. Full issues and certain features require an active subscription.</p>
      <p>The Service provides access, not ownership. Except for physical merchandise expressly purchased from us, no comic page, file, issue, character, artwork, recording, or other content is sold or transferred to a member. Subscriber content is intended for online viewing through authorized interfaces. Downloading is not offered unless we expressly label a feature as downloadable.</p>
      <p>We may add, remove, delay, replace, revise, or discontinue content, features, release schedules, subscription plans, or supported devices. Statements such as “five new pages a week” describe our intended release cadence and are not a guarantee that a particular page, issue, or series will be released on a specific date.</p>

      <h2>3. Eligibility and minors</h2>
      <p>You must be at least 18 years old and legally capable of entering a contract to create an account, purchase a subscription, make a purchase, enter a sweepstakes, participate in an external community such as Discord, or submit information for a potential cameo.</p>
      <p>A parent or legal guardian may permit a minor to view age-appropriate content through the adult’s account and under the adult’s direct supervision. The adult account owner is responsible for the minor’s use and for determining whether content is appropriate. The Service is not directed to children under 13, and children under 13 may not create accounts or provide personal information.</p>

      <h2>4. Accounts and account security</h2>
      <p>You must provide accurate, current information and keep it updated. You are responsible for maintaining the confidentiality of your credentials and for activity occurring through your account. Notify {LEGAL_CONFIG.contacts.support} promptly if you suspect unauthorized access.</p>
      <p>Accounts and subscriptions are personal, noncommercial, and nontransferable. Unless a plan expressly says otherwise, you may not sell, sublicense, share, or provide account access outside your household. We may apply reasonable device, session, or concurrent-access limits to prevent abuse and unauthorized distribution.</p>
      <p>We may require identity, age, payment, shipping, or eligibility verification when reasonably necessary to protect users, administer promotions, prevent fraud, or comply with law.</p>

      <h2>5. Subscriptions, automatic renewal, and billing</h2>
      <p>Paid subscriptions automatically renew until canceled. Before enrollment, we will disclose the plan, price, billing interval, material benefits, any promotional period, the date or frequency of charges, and how to cancel. You authorize us and our payment processor to charge the payment method associated with your account for recurring fees, applicable taxes, and authorized purchases.</p>
      <p>You must cancel before the next renewal charge to avoid being charged for the next period. You may cancel online from the Account page. Cancellation becomes effective at the end of the current paid period, and access ordinarily continues until then.</p>
      <p>If payment fails, we may retry the charge, request an updated payment method, suspend paid access, downgrade the account, or cancel the subscription. You remain responsible for authorized, unpaid amounts.</p>
      <p>Except where applicable law requires otherwise, subscription payments are nonrefundable, and we do not provide prorated refunds or credits for partially used billing periods. We may issue a discretionary credit or refund, but doing so once does not obligate us to do so again.</p>
      <p>We may change prices or plans. For existing subscribers, we will provide legally required advance notice before a material price increase or adverse plan change takes effect. Continued subscription after the effective date authorizes the new recurring amount. You may cancel before the change takes effect.</p>
      <p>Additional details appear in the Subscription and Billing Policy.</p>

      <h2>6. Subscription tiers and member benefits</h2>
      <p>Benefits may vary by plan and may include earlier page access, digital variant covers, commentary, community access, canon voting, signed physical prints, or eligibility to be considered for a cameo. Benefits are subject to stated eligibility dates, production schedules, inventory, shipping restrictions, and these Terms.</p>
      <p>“Cameo eligibility” means only that an eligible member may be considered. It does not guarantee selection, publication, a particular depiction, compensation, approval rights, or continued inclusion. Any selected participant must sign a separate appearance and publicity release before Streamwalkers uses the participant’s name, image, or likeness.</p>
      <p>Physical member benefits require a valid shipping address and may be limited to supported territories. We may substitute an item of reasonably comparable value if production or supply makes the advertised item unavailable. Taxes, duties, address errors, and delivery restrictions are governed by the Subscription and Billing Policy and Shipping and Returns Policy.</p>

      <h2>7. Limited license</h2>
      <p>Subject to your compliance with these Terms and payment of applicable fees, Streamwalkers grants you a limited, revocable, nonexclusive, nontransferable, nonsublicensable license to access and privately view content made available to your account through the Service for personal, noncommercial use.</p>
      <p>No title, ownership interest, copyright, trademark right, publicity right, or other intellectual-property right is transferred. All rights not expressly granted are reserved by Streamwalkers.</p>

      <h2>8. Intellectual property ownership</h2>
      <p>The Service and its contents—including comics, stories, scripts, characters, fictional worlds, artwork, layouts, logos, names, trademarks, motion effects, audio, commentary, software, interfaces, databases, and site design—are owned by Streamwalkers Corporation or used with permission and are protected by intellectual-property laws.</p>
      <p>Without prior written permission, you may not copy, capture for redistribution, archive, download, reproduce, publish, transmit, sell, license, publicly display, publicly perform, modify, translate, create derivative works from, or commercially exploit protected content. Limited quotations or screenshots may be used only to the extent permitted by applicable law and must not substitute for access to the original work.</p>

      <h2>9. Prohibited conduct</h2>
      <p>You may not:</p>
      <ul>
        <li>bypass or attempt to bypass a paywall, access control, device limit, watermark, or security feature;</li>
        <li>scrape, crawl, index, harvest, mirror, or systematically capture the Service or its content;</li>
        <li>use bots, scripts, browser automation, or other means to obtain protected pages or account data;</li>
        <li>use content or data from the Service to train, fine-tune, test, benchmark, validate, or supply any artificial-intelligence or machine-learning system without written permission;</li>
        <li>reproduce or distribute member-only pages, screenshots, recordings, digital covers, commentary, or other protected material;</li>
        <li>reverse engineer, decompile, disassemble, or attempt to derive source code except where such restriction is prohibited by law;</li>
        <li>interfere with operation, introduce malicious code, probe vulnerabilities outside the published security policy, or overload the Service;</li>
        <li>impersonate another person, misrepresent affiliation, commit fraud, or use another person’s payment method without authorization;</li>
        <li>post unlawful, infringing, threatening, deceptive, hateful, sexually exploitative, doxing, harassing, or abusive material;</li>
        <li>use the Service for commercial exhibition, public performance, resale, or unauthorized promotion; or</li>
        <li>assist another person in doing any of the foregoing.</li>
      </ul>

      <h2>10. Community content</h2>
      <p>Forums, comments, letters, polls, Discord access, and similar features may allow you to submit text, images, usernames, votes, or other material (“User Content”). You retain rights you already hold in User Content, but you grant Streamwalkers a worldwide, nonexclusive, royalty-free license to host, store, reproduce, format, moderate, display, and distribute it as reasonably necessary to operate, secure, promote, and improve the Service.</p>
      <p>You represent that you have the rights needed to submit User Content and that its use as permitted by these Terms will not violate another person’s rights. Do not submit confidential material, story pitches, scripts, character concepts, or other creative ideas through community channels. User Content is governed by the Community Guidelines and Unsolicited Submissions Policy.</p>
      <p>We may remove, restrict, preserve, or disclose User Content when reasonably necessary to enforce policies, protect users or rights, investigate misconduct, or comply with law. We are not obligated to publish, retain, monitor, or restore User Content.</p>

      <h2>11. Canon voting</h2>
      <p>Canon voting is an entertainment and engagement feature. Unless a poll expressly states otherwise, results are advisory. Streamwalkers retains exclusive editorial and creative control and may modify, combine, disregard, postpone, rerun, or cancel a vote for production, continuity, safety, legal, technical, or creative reasons.</p>
      <p>Voting does not make a participant an author, coauthor, owner, employee, partner, joint venturer, producer, or contributor to the underlying intellectual property. No royalties, accounting, credit, approval, compensation, or ownership rights arise from voting.</p>

      <h2>12. Sweepstakes and promotions</h2>
      <p>Sweepstakes, contests, giveaways, and promotions are governed by separate Official Rules. If promotion-specific rules conflict with these Terms, the promotion-specific rules control for that promotion.</p>
      <p>No purchase is necessary to enter a sweepstakes, and a purchase must not increase the chance of winning. Subscription payments buy access and stated membership benefits, not chances to win. Streamwalkers may disqualify entries affected by fraud, automation, manipulation, eligibility failures, or rule violations.</p>

      <h2>13. Merchandise and physical products</h2>
      <p>Physical products are governed by the terms presented at checkout and the Shipping and Returns Policy. Product photographs and colors may vary by screen or production run. Delivery estimates are estimates, not guarantees. Risk of loss and title pass as provided by applicable law and the checkout terms.</p>

      <h2>14. Third-party services</h2>
      <p>The Service may integrate or link to third parties such as Stripe, Shopify, Google, Discord, social networks, shipping carriers, or app stores. Those services have their own terms and privacy practices. Streamwalkers is not responsible for a third party’s independent service, content, availability, or conduct, but nothing in this section limits rights that cannot legally be limited.</p>

      <h2>15. Content advisories and viewing conditions</h2>
      <p>Some comics may contain violence, frightening imagery, war, death, supernatural themes, mature language, flashing or pulsing effects, or audio. Content advisories and age recommendations are informational and may not identify every potentially sensitive element.</p>
      <p>Use available motion and audio controls. Users with photosensitive epilepsy, migraine sensitivity, or other relevant conditions should enable reduced-motion settings and consult appropriate professional guidance when needed. Stop viewing if you experience discomfort.</p>

      <h2>16. Suspension and termination</h2>
      <p>You may stop using the Service at any time and may cancel a subscription as described above. We may suspend, restrict, or terminate access if you violate these Terms, create legal or security risk, engage in fraud or piracy, fail to pay, abuse other users, or if continued operation is no longer commercially or technically reasonable.</p>
      <p>If we terminate an account for material breach, you may lose access immediately and may not receive a refund except where required by law. Provisions concerning ownership, licenses already granted, restrictions, disclaimers, liability, disputes, and other terms that logically should survive will survive termination.</p>

      <h2>17. Service availability and changes</h2>
      <p>The Service is provided on an “as available” basis. Maintenance, outages, network failures, security events, device changes, third-party failures, force-majeure events, or production delays may interrupt access. We do not guarantee uninterrupted service, error-free operation, perpetual availability of any title, or compatibility with every browser, device, assistive technology, or connection.</p>
      <p>If Streamwalkers permanently discontinues the paid Service, we will provide notice and any remedy required by applicable law.</p>

      <h2>18. Disclaimer of warranties</h2>
      <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SERVICE AND ALL CONTENT, FEATURES, AND SOFTWARE ARE PROVIDED “AS IS” AND “AS AVAILABLE,” WITH ALL FAULTS AND WITHOUT EXPRESS OR IMPLIED WARRANTIES, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, ACCURACY, QUIET ENJOYMENT, OR UNINTERRUPTED OPERATION. SOME JURISDICTIONS DO NOT ALLOW CERTAIN DISCLAIMERS, SO PART OF THIS SECTION MAY NOT APPLY TO YOU.</p>

      <h2>19. Limitation of liability</h2>
      <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, STREAMWALKERS CORPORATION AND ITS DIRECTORS, OFFICERS, EMPLOYEES, CONTRACTORS, AND AGENTS WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, PUNITIVE, OR CONSEQUENTIAL DAMAGES; LOSS OF DATA, PROFITS, REVENUE, GOODWILL, OR OPPORTUNITY; OR DAMAGES ARISING FROM UNAUTHORIZED ACCESS, SERVICE INTERRUPTION, THIRD-PARTY SERVICES, OR RELIANCE ON USER CONTENT.</p>
      <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, STREAMWALKERS’ TOTAL AGGREGATE LIABILITY ARISING FROM OR RELATING TO THE SERVICE OR THESE TERMS WILL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID DIRECTLY TO STREAMWALKERS FOR THE SERVICE DURING THE 12 MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM OR (B) US $100.</p>
      <p>These limitations do not apply to liability that cannot be excluded or limited under applicable law.</p>

      <h2>20. Indemnification</h2>
      <p>To the extent permitted by law, you agree to defend, indemnify, and hold harmless Streamwalkers Corporation and its directors, officers, employees, contractors, and agents from third-party claims, liabilities, damages, judgments, and reasonable costs arising from your unlawful use of the Service, your User Content, or your material violation of these Terms. This obligation does not apply to the extent a claim results from Streamwalkers’ own unlawful conduct.</p>

      <h2>21. Informal dispute resolution and governing law</h2>
      <p>Before filing a lawsuit other than an eligible small-claims matter or a request for urgent injunctive relief, you and Streamwalkers agree to attempt in good faith to resolve the dispute for at least 30 days. A notice must identify the account, describe the dispute and relevant facts, and state the requested resolution. Notices to Streamwalkers must be sent to {LEGAL_CONFIG.contacts.legal} and to the mailing address in the Corporate Information page.</p>
      <p>These Terms are governed by the laws of the State of Texas, without regard to conflict-of-law rules, except that mandatory consumer-protection rights of your place of residence continue to apply. Subject to those mandatory rights, disputes not resolved informally will be brought in the state or federal courts serving Bexar County, Texas.</p>
      <p><strong>Attorney decision required:</strong> Do not add mandatory arbitration, a jury-trial waiver, or a class-action waiver merely by copying Netflix. If Streamwalkers wants those provisions, counsel should draft them for Streamwalkers’ size, chosen arbitration administrator, fee obligations, mass-arbitration exposure, opt-out process, and clickwrap implementation.</p>

      <h2>22. Changes to these Terms</h2>
      <p>We may revise these Terms. For material changes affecting existing paid members, we will provide reasonable advance notice by email, account notice, or another legally permitted method. The notice will identify the effective date. If you do not agree to a material change, you must cancel before it becomes effective and stop using the Service.</p>

      <h2>23. General terms</h2>
      <p>These Terms and incorporated policies are the entire agreement concerning the Service. If any provision is unenforceable, it will be enforced to the maximum lawful extent and the remainder will continue. Failure to enforce a provision is not a waiver. You may not assign your account or rights under these Terms without our consent. Streamwalkers may assign these Terms in connection with a merger, reorganization, financing, sale of assets, or transfer of the Service. Headings are for convenience only. Electronic notices satisfy writing requirements to the extent permitted by law.</p>

      <h2>24. Contact</h2>
      <address>
        Streamwalkers Corporation<br />
        Attn: Astralnaut Studios Legal<br />
        {addr.line1}<br />
        {addr.city}, {addr.state} {addr.zip}<br />
        {LEGAL_CONFIG.contacts.legal}
      </address>
    </LegalPage>
  );
}
