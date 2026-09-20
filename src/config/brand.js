// Single source of truth for Motive's positioning copy. Before this file,
// Home.jsx and AuthLayout.jsx each hardcoded their own, different value
// prop — three competing taglines across two files ("Momentum you can
// actually see", the "no databases to configure" sub-paragraph, and "Turn
// intent into momentum."). The next copy change should be one edit here,
// not a hunt across the app.
//
// Positioning: B2B, agencies and small studios running client work — see
// PLAN "Motive → B2B" (business plan) and "Petrol & Ink" (visual redesign).

export const BRAND = {
  name: 'Motive',
  tagline: 'Client-ready project delivery for small agencies.',
  subhead: 'Run your work on a board. Your client gets a live status page. Stop writing update emails.',
  eyebrow: 'Built for agencies and studios',
};

export const VALUE_PROPS = [
  {
    title: 'Your clients see progress, not silence.',
    body: 'One link per client. Always current. No login friction, no WhatsApp chasing.',
  },
  {
    title: 'Know what\'s slipping before the client does.',
    body: 'Momentum flags at-risk and overdue work across every project, automatically.',
  },
  {
    title: 'Client seats are free, forever.',
    body: 'Pay for your team. Never for the people you\'re accountable to.',
  },
];
