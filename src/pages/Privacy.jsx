import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LogoMark } from '../components/Logo';

const Section = ({ title, children }) => (
  <section className="mt-8">
    <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
    <div className="mt-2 space-y-2 text-gray-600 dark:text-gray-300">{children}</div>
  </section>
);

const Privacy = () => (
  <div className="min-h-screen bg-white px-6 py-12 dark:bg-[#0e0d12]">
    <div className="mx-auto max-w-2xl">
      <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-600 dark:text-gray-400">
        <ArrowLeft size={16} /> Back to Motive
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <LogoMark size={36} />
        <h1 className="font-display text-3xl font-extrabold text-gray-900 dark:text-white">Privacy Policy</h1>
      </div>
      <p className="text-sm text-gray-400">Last updated: June 15, 2026</p>

      <p className="mt-6 text-gray-600 dark:text-gray-300">
        Motive (“we”, “us”) is a productivity workspace. This policy explains what data we
        collect, how we use it, and the choices you have. By using Motive you agree to this policy.
      </p>

      <Section title="Information we collect">
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Account details</strong> — your name and email address. Your password is stored only as a salted bcrypt hash; we never see or store it in plain text.</li>
          <li><strong>Content you create</strong> — the pages, blocks, tasks, events, workspaces, and templates you add to the app.</li>
          <li><strong>Basic technical data</strong> — standard request logs needed to operate and secure the service.</li>
        </ul>
        <p>We do not knowingly collect data from children, and we do not collect sensitive personal data.</p>
      </Section>

      <Section title="How we use your data">
        <p>Solely to provide the service: to authenticate you, store and display your content, and keep the app secure and reliable. We do not sell your data or use it for advertising.</p>
      </Section>

      <Section title="Where your data is stored">
        <p>Your data is stored in a managed MongoDB database (MongoDB Atlas) hosted in the cloud. Data is transmitted over encrypted HTTPS connections.</p>
      </Section>

      <Section title="Cookies">
        <p>We use a single <strong>httpOnly authentication cookie</strong> to keep you signed in (it holds a refresh token, not readable by scripts). We do <strong>not</strong> use third-party advertising or tracking cookies.</p>
      </Section>

      <Section title="Your choices & data deletion">
        <p>You can edit or delete your content at any time. You can permanently delete your account and all associated data from <strong>Settings → Danger Zone → Delete account</strong>. This is immediate and irreversible.</p>
      </Section>

      <Section title="Data sharing">
        <p>We do not sell or rent your personal data. We may share data only with the infrastructure providers required to run the service (e.g. our hosting and database providers), and only as needed to operate it, or where required by law.</p>
      </Section>

      <Section title="Contact">
        <p>Questions about this policy or your data? Email <a className="text-brand-600 hover:underline dark:text-brand-400" href="mailto:support@motive.app">support@motive.app</a>.</p>
      </Section>

      <p className="mt-10 rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs text-gray-500 dark:border-[#2A2733] dark:bg-[#17151D]">
        This policy is provided as a starting template and is not legal advice. Please have it
        reviewed by a qualified professional before relying on it for your jurisdiction.
      </p>
    </div>
  </div>
);

export default Privacy;
