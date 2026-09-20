// recharts (and raw SVG gradients) need literal hex values, not Tailwind
// classes, so this mirrors the brand scale from tailwind.config.js for chart
// series instead of each chart hardcoding stock Tailwind hex (#6366f1,
// #8b5cf6, #a855f7, #c084fc — indigo/violet/purple-500/400, none of which is
// actually the brand color).

// Brand petrol scale (tailwind.config.js `brand`) — see PLAN "Petrol & Ink".
export const BRAND = {
  300: '#7FBDCB',
  400: '#4A9DB1',
  500: '#1B7A8C',
  600: '#166575',
  700: '#0E4C5C',
};

// Ordered series palette for multi-bar/pie charts — a monochrome petrol ramp
// by design. Anything that needs to mean a delivery STATE (shipped/at
// risk/overdue/etc.) must come from statusColors.js instead, never from
// here: brand hue is reserved for "this is Motive," never for "this needs
// attention."
export const CHART_SERIES = [BRAND[500], BRAND[300], BRAND[700], BRAND[400]];

// Single-series bar/line fill.
export const CHART_PRIMARY = BRAND[500];

// Axis/grid colors — recharts reads `stroke`/`tick.fill` as presentation
// attributes, not classes, so a `dark:` utility class silently does nothing
// here (confirmed in Statistics.jsx). Pass isDark from useTheme() instead.
export const chartAxisColor = (isDark) => (isDark ? '#8CA0AA' : '#5E6E77'); // dark.muted / light.muted
export const chartGridColor = (isDark) => (isDark ? '#23343C' : '#DDE4E7'); // dark.border / light.border
export const chartTooltipStyle = (isDark) => ({
  backgroundColor: isDark ? '#17272F' : '#FFFFFF', // dark.raised / light.surface
  border: `1px solid ${isDark ? '#23343C' : '#DDE4E7'}`,
  color: isDark ? '#E6EDF0' : '#0F1A20',
});
