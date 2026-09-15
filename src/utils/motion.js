// Shared framer-motion variants for the "fade up, staggered by index" idiom
// that was hand-written inline ~8 times in Statistics.jsx alone (each with
// its own `initial`/`animate`/`transition` object). One definition.
export const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

// `transition={{ delay: staggerDelay(i) }}` alongside the variants above.
export const staggerDelay = (index, step = 0.05) => ({ delay: index * step });
