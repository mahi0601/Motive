import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LogoMark } from '../components/ui/Logo';

const Section = ({ title, children }) => (
  <section className="mt-8">
    <h2 className="font-display text-xl font-bold text-light-text dark:text-white">{title}</h2>
    <div className="mt-2 space-y-2 text-light-muted dark:text-dark-muted">{children}</div>
  </section>
);

const Privacy = () => (
  <div className="min-h-screen bg-white px-6 py-12 dark:bg-dark-background">
    <div className="mx-auto max-w-2xl">
      <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-light-muted hover:text-brand-600 dark:text-dark-muted">
        <ArrowLeft size={16} /> Back to Motive
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <LogoMark size={36} />
        <h1 className="font-display text-display font-extrabold text-light-text dark:text-white">Privacy Policy</h1>
      </div>
      <p className="text-sm text-light-muted">Last updated: September 30, 2026</p>

      <p className="mt-6 text-light-muted dark:text-dark-muted">
        Motive (“we”, “us”) is a productivity workspace. This policy explains what data we
        collect, how we use it, and the choices you have. By using Motive you agree to this policy.
      </p>

      <Section title="Information we collect">
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Account details</strong> — your name and email address. Your password is stored only as a salted bcrypt hash; we never see or store it in plain text.</li>
          <li><strong>Sign-in with Google</strong> — if you choose it, your Google account’s name, email address, profile picture, and Google account identifier.</li>
          <li><strong>Content you create</strong> — the pages, blocks, tasks, comments, file attachments, workspaces, and templates you add to the app, and the email addresses of people you invite to a workspace.</li>
          <li><strong>Payment status</strong> — if you upgrade, Stripe processes your payment. We store only a customer identifier and whether your plan is active, never your card details.</li>
          <li><strong>Basic technical data</strong> — standard request logs and error reports (which can include your IP address and browser details) needed to operate and secure the service.</li>
        </ul>
        <p>We do not knowingly collect data from children, and we do not collect sensitive personal data.</p>
      </Section>

      <Section title="How we use your data">
        <p>Solely to provide the service: to authenticate you, store and display your content, and keep the app secure and reliable. We do not sell your data or use it for advertising.</p>
      </Section>

      <Section title="Where your data is stored">
        <p>Your data is stored in a managed PostgreSQL database (Neon) hosted in the cloud, and uploaded files in Cloudflare R2 object storage when enabled. Data is transmitted over encrypted HTTPS connections. See “Data sharing” below for the full list of providers.</p>
      </Section>

      <Section title="Cookies and local storage">
        <p>We use an <strong>httpOnly authentication cookie</strong> to keep you signed in (it holds a refresh token, not readable by scripts). While you sign in with Google we also set a short-lived, httpOnly cookie (about five minutes) that protects that sign-in from forgery; it is removed as soon as sign-in completes. We do <strong>not</strong> use third-party advertising or tracking cookies.</p>
        <p>The app also stores a few things in your browser’s local storage to work properly: your basic profile (so the interface loads instantly), your theme choice, which workspace you last opened, a notice that you’ve seen the welcome screen, and any task timers you start. None of this is sent to third parties.</p>
      </Section>

      <Section title="Shared status links">
        <p>A workspace owner can turn on a public status page. Anyone with its link can see, without signing in, the workspace’s name and each task’s title, status, and dates. The page does not show people’s names or emails, task descriptions, comments, or files. The owner can turn the link off or replace it at any time, and the old link then stops working immediately. Owners should avoid putting confidential information in task titles while a status link is active.</p>
      </Section>

      <Section title="Your choices & data deletion">
        <p>You can edit or delete your content at any time. You can permanently delete your account and all associated data from <strong>Settings → Danger Zone → Delete account</strong>. You confirm with your password, or by typing your account email if you signed in with Google. This is immediate and irreversible. If you own a workspace that has other members, remove them or transfer ownership first.</p>
      </Section>

      <Section title="Data sharing">
        <p>We do not sell or rent your personal data. We share data only with the service providers required to run Motive, and only as needed to operate it, or where required by law:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Neon</strong> — database hosting.</li>
          <li><strong>Render</strong> (and, for some deployments, Netlify) — application and website hosting.</li>
          <li><strong>Cloudflare R2</strong> — storage for files you attach.</li>
          <li><strong>Stripe</strong> — payment processing, if you upgrade.</li>
          <li><strong>Resend</strong> — sending invitation and password-reset emails.</li>
          <li><strong>Sentry</strong> and <strong>Better Stack (Logtail)</strong> — error reporting and logs, when enabled.</li>
          <li><strong>Google</strong> — sign-in if you choose it. The app also loads fonts from Google Fonts, which means Google receives your IP address when a page loads.</li>
          <li><strong>YouTube</strong> — only when you embed a video in a page and it is displayed.</li>
        </ul>
      </Section>

      <Section title="Contact">
        <p>Questions about this policy or your data? Email <a className="text-brand-600 hover:underline dark:text-brand-400" href="mailto:support@motive.app">support@motive.app</a>.</p>
      </Section>

      <p className="mt-10 rounded-lg border border-light-border bg-light-border/30 p-4 text-xs text-light-muted dark:border-dark-border dark:bg-dark-surface">
        This policy is provided as a starting template and is not legal advice. Please have it
        reviewed by a qualified professional before relying on it for your jurisdiction.
      </p>
    </div>
  </div>
);

export default Privacy;
