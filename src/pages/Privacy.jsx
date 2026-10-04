import React from 'react';
import LegalPage, { LegalSection as Section, LegalLink } from '../components/ui/LegalPage';
import { SUPPORT_EMAIL } from '../config/legal';

const Privacy = () => (
  <LegalPage title="Privacy Policy">
    <p className="mt-6 text-light-muted dark:text-dark-muted">
      Clientglass (“we”, “us”) is project delivery software for agencies and small studios. This policy explains
      what data we collect, how we use it, and the choices you have. By using Clientglass you agree to this policy
      and to our <LegalLink to="/terms">Terms of Service</LegalLink>.
    </p>

    <Section title="Information we collect">
      <ul className="list-disc space-y-1 pl-5">
        <li><strong>Account details</strong> — your name and email address. Your password is stored only as a salted bcrypt hash; we never see or store it in plain text. We ask you to confirm your email address, and confirming it is required before you can invite people.</li>
        <li><strong>Sign-in with Google</strong> — if you choose it, your Google account’s name, email address, profile picture, and Google account identifier.</li>
        <li><strong>Agreement to the terms</strong> — the time you agreed to the Terms and Privacy Policy and which version you saw, recorded when you sign up with a password, or on your first visit after signing up with Google.</li>
        <li><strong>Content you create</strong> — the pages, blocks, tasks, comments, file attachments, workspaces, and templates you add to the app, and the email addresses of people you invite to a workspace. Uploaded files get a public, unguessable link: anyone who has the link can open the file without signing in.</li>
        <li><strong>Client responses</strong> — when someone uses a shared status page to approve a milestone, request changes or leave a comment, we store the name they typed (which we cannot verify), their message and the date. The workspace owner sees these and can export them.</li>
        <li><strong>Payment status</strong> — if you subscribe, Stripe processes your payment. We store only a customer identifier, which plan you are on and whether it is active, never your card details.</li>
        <li><strong>Security log</strong> — a record of sign-ins, failed sign-ins, password resets, membership and plan changes, data exports and deletions. It holds user ids and a shortened IP address (the network only, not the full address), and no email addresses.</li>
        <li><strong>Product events</strong> — a few events (sign-up, first task, status link created, status page viewed, client response, upgrade, and a visit from a status page’s “Powered by” link) stored as an event name and ids only. When a status page is viewed we also store a hash that changes every day and is derived from the visitor’s network and browser; it is used only to count unique viewers and cannot identify or follow anyone. There are no cookies or tracking scripts for this, and no third-party analytics.</li>
        <li><strong>Basic technical data</strong> — standard request logs and error reports (which can include your IP address and browser details) needed to operate and secure the service.</li>
      </ul>
      <p>Clientglass is for people 16 years old or older. We do not knowingly collect data from anyone younger, and we do not collect sensitive personal data.</p>
    </Section>

    <Section title="How we use your data">
      <p>Solely to provide the service: to authenticate you, store and display your content, keep the app secure and reliable, and understand whether the product is working. We do not sell your data or use it for advertising.</p>
    </Section>

    <Section title="Where your data is stored">
      <p>Your data is stored in a managed PostgreSQL database (Neon) hosted in the cloud, and uploaded files in Cloudflare R2 object storage when enabled. Data is transmitted over encrypted HTTPS connections. See “Data sharing” below for the full list of providers.</p>
    </Section>

    <Section title="How long we keep data">
      <ul className="list-disc space-y-1 pl-5">
        <li>Your content: until you delete it or your account.</li>
        <li>Read notifications: 90 days. Activity history: one year.</li>
        <li>Client responses on status pages: one year.</li>
        <li>Finished invitations: 30 days. Billing webhook records: 30 days.</li>
        <li>Security log: 180 days. Product events: 400 days.</li>
        <li>Sign-in sessions: until they expire or are ended.</li>
      </ul>
    </Section>

    <Section title="Cookies and local storage">
      <p>We use an <strong>httpOnly session cookie</strong> that keeps you signed in on this device for up to 30 days; signing out ends it. It holds a refresh token, not readable by scripts. While you sign in with Google we also set a short-lived, httpOnly cookie (about five minutes) that protects that sign-in from forgery; it is removed as soon as sign-in completes. We do <strong>not</strong> use third-party advertising or tracking cookies.</p>
      <p>The app also stores a few things in your browser’s local storage to work properly: your basic profile (so the interface loads instantly), your theme choice, which workspace you last opened, a notice that you’ve seen the welcome screen, and any task timers you start. None of this is sent to third parties.</p>
    </Section>

    <Section title="Shared status links">
      <p>A workspace owner can turn on a public status page. Anyone with its link can see, without signing in, the workspace’s name and each task’s title, status, and dates, plus whatever headline, summary and milestone the owner wrote. When a client has approved a milestone, the page shows only the date of the approval, not the name. The page does not show people’s names or emails, task descriptions, comments, or files. The owner can turn the link off or replace it at any time, and the old link then stops working immediately. Owners should avoid putting confidential information in task titles while a status link is active.</p>
    </Section>

    <Section title="Your choices & data deletion">
      <p>You can edit or delete your content at any time. <strong>Settings → Account → Download my data</strong> gives you a JSON copy of what we hold about you. You can permanently delete your account and all associated data from <strong>Settings → Danger Zone → Delete account</strong>; this also cancels a monthly subscription and removes the files you uploaded. You confirm with your password, or by typing your account email if you signed in with Google. This is immediate and irreversible. If you own a workspace that has other members, remove them or transfer ownership first.</p>
    </Section>

    <Section title="Data sharing">
      <p>We do not sell or rent your personal data. We share data only with the service providers required to run Clientglass, and only as needed to operate it, or where required by law:</p>
      <ul className="list-disc space-y-1 pl-5">
        <li><strong>Neon</strong> — database hosting.</li>
        <li><strong>Render</strong> (and, for some deployments, Vercel or Netlify) — application and website hosting.</li>
        <li><strong>Cloudflare R2</strong> — storage for files you attach.</li>
        <li><strong>Stripe</strong> — payment processing, if you subscribe.</li>
        <li><strong>Resend</strong> — sending invitation, confirmation and password-reset emails.</li>
        <li><strong>Sentry</strong> and <strong>Better Stack (Logtail)</strong> — error reporting and logs, when enabled. Tokens and query strings are removed before anything is sent.</li>
        <li><strong>Google</strong> — sign-in if you choose it. The app also loads fonts from Google Fonts, which means Google receives your IP address when a page loads.</li>
        <li><strong>YouTube</strong> — only when you embed a video in a page and it is displayed.</li>
      </ul>
    </Section>

    <Section title="Contact">
      <p>Questions about this policy or your data? Email <a className="text-brand-600 hover:underline dark:text-brand-400" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
    </Section>
  </LegalPage>
);

export default Privacy;
