import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import DashboardLayout from '../layout/DashboardLayout';
import TemplateGallery from '../components/TemplateGallery';

const Templates = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl px-2 py-6">
        {/* Hero */}
        <div className="relative mb-8 overflow-hidden rounded-2xl bg-brand-gradient p-8 text-white">
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <Sparkles size={13} /> Templates
            </span>
            <h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">
              Start faster with a template
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/85">
              Pick a ready-made layout to spin up a page in one click — or open any page and choose
              <span className="font-semibold"> “Save as template” </span> to reuse your own.
            </p>
          </div>
        </div>

        <TemplateGallery onUse={(page) => page && navigate(`/page/${page._id}`)} />
      </div>
    </DashboardLayout>
  );
};

export default Templates;
