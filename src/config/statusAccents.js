// The accent colours an owner can pick for their public status page. The keys
// match the server's preset list (motive-backend src/utils/statusAccents.js);
// the colours live here. `light` is used on the page's light surfaces and `dark`
// on its dark ones, and each is checked for 4.5:1 text contrast in
// statusAccents.test.js, so no choice can make the page hard to read.
export const STATUS_ACCENTS = {
  teal: { label: 'Teal', light: '#0E6B7C', dark: '#5FC3D4' },
  blue: { label: 'Blue', light: '#1D4ED8', dark: '#93C5FD' },
  violet: { label: 'Violet', light: '#6D28D9', dark: '#C4B5FD' },
  rose: { label: 'Rose', light: '#BE123C', dark: '#FDA4AF' },
  amber: { label: 'Amber', light: '#92400E', dark: '#FCD34D' },
  slate: { label: 'Slate', light: '#475569', dark: '#CBD5E1' },
};

export const ACCENT_KEYS = Object.keys(STATUS_ACCENTS);

// An unknown key (an older or newer server) falls back to teal.
export const accentFor = (key) => STATUS_ACCENTS[key] || STATUS_ACCENTS.teal;
