import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { chartTooltipStyle } from '../../utils/chartColors';

// Recharts' <Tooltip content={...}> render prop, driven by the shared
// chartTooltipStyle() token map instead of each chart hand-rolling its own
// (chartTooltipStyle used to be exported from chartColors.js and unused —
// Statistics.jsx had its own inline CustomTooltip instead). One definition.
const ChartTooltip = ({ active, payload, label }) => {
  const { isDark } = useTheme();
  if (!active || !payload?.length) return null;
  const style = chartTooltipStyle(isDark);
  return (
    <div
      className="rounded-lg border px-3 py-2 text-sm shadow-lg"
      style={{ backgroundColor: style.backgroundColor, border: style.border, color: style.color }}
    >
      {label != null && <p className="mb-1 font-semibold">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

export default ChartTooltip;
