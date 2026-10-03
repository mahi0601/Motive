import React from 'react';
import LegalPage, { LegalSection, LegalLink } from '../components/ui/LegalPage';
import { SUPPORT_EMAIL } from '../config/legal';

// Plain-language terms that say only what is true of the product today. Refunds,
// governing law and limits of liability are decisions for the owner and a
// reviewer; they are deliberately not invented here.
const Terms = () => (
  <LegalPage title="Terms of Service">
    <p className="mt-6 text-light-muted dark:text-dark-muted">
      These terms are the agreement between you and Clientglass (“we”, “us”) for using the service.
      By creating an account or using Clientglass you agree to them and to our{' '}
      <LegalLink to="/privacy">Privacy Policy</LegalLink>.
    </p>

    <LegalSection title="Who can use Clientglass">
      <p>You must be 16 years old or older. If you use Clientglass for a company, agency or other organisation, you confirm that you can agree to these terms on its behalf.</p>
    </LegalSection>

    <LegalSection title="Your account">
      <p>Keep your password and sign-in methods to yourself. You are responsible for what happens under your account. If you think someone else has used it, change your password and tell us.</p>
    </LegalSection>

    <LegalSection title="Your content and your clients’ pages">
      <p>What you add to Clientglass stays yours. You let us store and show it only as needed to run the service for you, including showing a workspace’s status page to anyone who has its link when you turn that on.</p>
      <p>A status page shows each task’s title, status and dates. You are responsible for what you put in those titles and for having the right to share it. A client’s response on a status page is typed by whoever has the link; the name on it is not verified.</p>
    </LegalSection>

    <LegalSection title="Acceptable use">
      <ul className="list-disc space-y-1 pl-5">
        <li>Do not use Clientglass for anything unlawful, or to share content you have no right to share.</li>
        <li>Do not try to reach other people’s accounts or data, or to get around the limits and protections of the service.</li>
        <li>Do not upload malware, or send invitations or messages to people who have not asked for them.</li>
        <li>Do not overload the service. Some actions are rate limited to protect it.</li>
      </ul>
    </LegalSection>

    <LegalSection title="Plans and billing">
      <p>Clientglass has a Free plan and two paid plans, Studio and Agency. Plans are priced by the number of active client pages (workspaces with a live status link) and set how many team members a workspace can have. The limits and prices are shown in the pricing section of the home page.</p>
      <p>Paid plans are a monthly subscription, paid through Stripe. You can cancel at any time under Settings → Plan and billing → Manage billing; your plan then stays active until the end of the period you have paid for. If a payment fails, Stripe retries the card and your plan stays on while it does.</p>
      <p>If you move from Studio to Agency, the change is prorated: you pay the difference for the rest of the current period, then the Agency price each month. If you reach a plan limit, you can keep what you already have; you cannot add more until you move to a plan that allows it.</p>
      <p>People who bought the earlier one-time Pro upgrade keep lifetime Pro, with every Agency feature, and are not charged again.</p>
    </LegalSection>

    <LegalSection title="Ending your account">
      <p>You can delete your account at any time under Settings → Danger Zone. Deleting it also cancels a monthly subscription and removes your data as described in the <LegalLink to="/privacy">Privacy Policy</LegalLink>.</p>
      <p>We may suspend or close an account that breaks these terms or puts other people or the service at risk.</p>
    </LegalSection>

    <LegalSection title="Changes to these terms">
      <p>When these terms change, the “last updated” date at the top changes with them.</p>
    </LegalSection>

    <LegalSection title="Contact">
      <p>Questions about these terms? Email <a className="text-brand-600 hover:underline dark:text-brand-400" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
    </LegalSection>
  </LegalPage>
);

export default Terms;
