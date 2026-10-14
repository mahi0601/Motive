// Single source of truth for Clientglass's positioning copy. Before this file,
// Home.jsx and AuthLayout.jsx each hardcoded their own, different value
// prop — three competing taglines across two files ("Momentum you can
// actually see", the "no databases to configure" sub-paragraph, and "Turn
// intent into momentum."). The next copy change should be one edit here,
// not a hunt across the app.
//
// Positioning: B2B, agencies and small studios running client work.

export const BRAND = {
  name: 'Clientglass',
  tagline: 'Stop answering "status?" on WhatsApp.',
  subhead: 'One live link per client, built from the board your studio already works on. No login, no update to write, and every sign-off dated on record.',
  eyebrow: 'Built for agencies and studios',
};

export const VALUE_PROPS = [
  {
    title: 'The update writes itself.',
    body: 'Your client\'s page is built from your own task board, so there is nothing to type each week.',
  },
  {
    title: 'Your clients never need an account.',
    body: 'They open one link on their phone: no sign-up, no seat to buy. Your plan counts your team and your active client pages, never the people you\'re accountable to.',
  },
  {
    title: 'Sign-offs on record, not lost in chat.',
    body: 'Approvals are dated and comments stay on the same link, so "I never approved that" has an answer.',
  },
];
