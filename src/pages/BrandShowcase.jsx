import React from 'react';
import { CONCEPTS } from '../components/LogoConcepts';

const Panel = ({ dark, concept }) => {
  const { Mark, name } = concept;
  return (
    <div
      className={`flex-1 rounded-2xl border p-8 ${
        dark ? 'dark bg-[#0E0D12] border-[#2A2733]' : 'bg-[#FAFAFA] border-gray-200'
      }`}
    >
      <p className={`mb-6 text-xs uppercase tracking-widest ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
        {dark ? 'Dark' : 'Light'}
      </p>

      {/* lockup */}
      <div className="flex items-center gap-3 mb-8">
        <Mark size={44} />
        <span
          className="font-display font-bold tracking-tight"
          style={{ fontSize: 28, color: dark ? '#fff' : '#1b1924' }}
        >
          Motive
        </span>
      </div>

      {/* size scale */}
      <div className="flex items-end gap-5">
        <Mark size={48} />
        <Mark size={32} />
        <Mark size={24} />
        <Mark size={16} animated={false} />
      </div>
    </div>
  );
};

const BrandShowcase = () => (
  <div className="min-h-screen bg-white dark:bg-[#0b0a0f] px-6 py-12 font-sans">
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-4xl font-extrabold text-gray-900 dark:text-white">
        Motive — Logo Concepts
      </h1>
      <p className="mt-2 mb-10 text-gray-500 dark:text-gray-400">
        Three directions, same brand family (violet→magenta squircle + amber spark). Pick one and
        I’ll set it as the official mark everywhere.
      </p>

      <div className="space-y-12">
        {CONCEPTS.map((concept) => (
          <section key={concept.key}>
            <div className="mb-4 flex items-baseline gap-3">
              <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
                {concept.name}
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">{concept.idea}</span>
            </div>
            <div className="flex flex-col gap-4 md:flex-row">
              <Panel dark={false} concept={concept} />
              <Panel dark concept={concept} />
            </div>
          </section>
        ))}
      </div>
    </div>
  </div>
);

export default BrandShowcase;
