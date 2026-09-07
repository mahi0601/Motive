// recharts (and raw SVG gradients) need literal hex values, not Tailwind
// classes, so this mirrors the brand/spark scale from tailwind.config.js
// for chart series instead of each chart hardcoding stock Tailwind hex
// (#6366f1, #8b5cf6, #a855f7, #c084fc — indigo/violet/purple-500/400,
// none of which is actually the brand color).

// Brand violet scale (tailwind.config.js `brand`)
export const BRAND = {
  300: '#BFA9FF',
  400: '#A07DFB',
  500: '#7C5CF6',
  600: '#6B46E8',
  700: '#5A37C9',
};

// Spark amber scale (tailwind.config.js `spark`)
export const SPARK = {
  300: '#FFC966',
  400: '#FFC04D',
  500: '#F5A524',
  600: '#DB8A0E',
};

// Ordered series palette for multi-bar/pie charts: violet does most of the
// work, spark marks the one series that should stand out (e.g. today's bar,
// the top-priority slice).
export const CHART_SERIES = [BRAND[500], BRAND[300], SPARK[500], BRAND[700]];

// Single-series bar/line fill.
export const CHART_PRIMARY = BRAND[500];

// Axis/grid colors — recharts reads `stroke`/`tick.fill` as presentation
// attributes, not classes, so a `dark:` utility class silently does nothing
// here (confirmed in Statistics.jsx). Pass isDark from useTheme() instead.
export const chartAxisColor = (isDark) => (isDark ? '#9C99A8' : '#8B8479'); // dark.muted / light.muted
export const chartGridColor = (isDark) => (isDark ? '#2A2733' : '#E7E0D4'); // dark.border / light.border
export const chartTooltipStyle = (isDark) => ({
  backgroundColor: isDark ? '#211E29' : '#FFFFFF', // dark.raised / light.surface
  border: `1px solid ${isDark ? '#2A2733' : '#E7E0D4'}`,
  color: isDark ? '#E9E7EF' : '#23201B',
});
