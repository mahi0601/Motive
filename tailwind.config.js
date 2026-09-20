/** @type {import('tailwindcss').Config} */

// Motive brand palette — "Petrol & Ink". Replaces "Motive Violet" + "Spark"
// amber: the old brand accent (amber) collided with the "at risk" status
// color, and violet read as consumer/creative rather than a delivery
// instrument a client is meant to trust. Petrol is deliberately pulled off
// the status hue wheel (green/azure/amber/red/slate) so the brand never
// competes with the one thing this app actually needs to communicate at a
// glance: what state is this work in. See PLAN "Petrol & Ink" for the full
// color-psychology rationale.
const petrol = {
  50: '#EFF7F9',
  100: '#D7ECF0',
  200: '#B0D8E1',
  300: '#7FBDCB',
  400: '#4A9DB1',
  500: '#1B7A8C', // primary interactive — links, buttons, focus rings (~5:1 on white)
  600: '#166575',
  700: '#0E4C5C', // deep anchor — headings, dark-mode surfaces, wordmark
  800: '#0C3D4A',
  900: '#0B323C',
  950: '#061F26',
};

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand tokens — name unchanged so every existing `brand-*` class
        // across the app repaints automatically; only the scale's values
        // moved from violet to petrol.
        brand: petrol,
        // Semantic status colors — the map that didn't exist before. This is
        // the ONLY place hue should ever mean "state" (shipped/in
        // flight/at risk/overdue/not started). Never reused decoratively —
        // that's what `brand` is for.
        semantic: {
          success: { 50: '#ECFDF3', 200: '#ABEFC6', 500: '#16A34A', dark: '#4ADE80' },
          info: { 50: '#EFF6FF', 200: '#BFDBFE', 500: '#3B82F6', dark: '#60A5FA' },
          warning: { 50: '#FFFBEB', 200: '#FDE7B0', 500: '#E8A317', dark: '#FBBF24' },
          danger: { 50: '#FEF2F2', 200: '#FECACA', 500: '#D64545', dark: '#F87171' },
          idle: { 50: '#F1F5F9', 200: '#CBD5E1', 500: '#94A3B8', dark: '#64748B' },
        },
        dark: {
          // Blue-biased near-black (was a purple-black under the violet
          // system) so light and dark mode share one temperature family.
          background: '#0B1418',
          surface: '#111D23',
          raised: '#17272F',
          border: '#23343C',
          text: '#E6EDF0',
          muted: '#8CA0AA',
        },
        // Cool "instrument panel" light mode — replaces the warm cream
        // (#FAF6F0) that read as a personal/editorial workspace rather than
        // a delivery tool a client is being handed a link to.
        light: {
          background: '#F6F8F9',
          surface: '#FFFFFF',
          border: '#DDE4E7',
          text: '#0F1A20',
          muted: '#5E6E77',
        },
      },
      fontFamily: {
        // IBM Plex Sans over Sora: carries an engineering-credibility tone
        // that suits a delivery instrument, and ships a Devanagari
        // companion — a Hindi localization later won't fracture the type
        // system. Inter stays for body/UI/data (tabular figures matter on
        // Momentum).
        display: ['IBM Plex Sans', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        inter: ['Inter', 'system-ui', 'sans-serif'],
      },
      // A deliberate scale, not the Tailwind defaults — so a stat tile's
      // number and a task card's title differ on purpose instead of by
      // accident (see PLAN §4). Pair with `font-display` (IBM Plex Sans)
      // only at `display-xl`/`display`/`title`; everything else stays Inter.
      fontSize: {
        'display-xl': ['2.5rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        display: ['1.875rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        title: ['1.25rem', { lineHeight: '1.35' }],
        body: ['0.9375rem', { lineHeight: '1.65' }],
        label: ['0.8125rem', { lineHeight: '1.4', letterSpacing: '0.01em' }],
        caption: ['0.75rem', { lineHeight: '1.4' }],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #0E4C5C 0%, #1B7A8C 100%)',
        'brand-soft': 'linear-gradient(135deg, rgba(27,122,140,0.12) 0%, rgba(14,76,92,0.12) 100%)',
      },
      boxShadow: {
        brand: '0 8px 24px -6px rgba(27, 122, 140, 0.45)',
        'brand-sm': '0 2px 10px -2px rgba(27, 122, 140, 0.35)',
      },
    },
  },
  plugins: [],
};
