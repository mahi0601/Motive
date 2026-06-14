import React, { useId } from 'react';

/**
 * Motive brand mark.
 * The glyph is a checkmark capped by an amber "spark" — tasks completed, motivation
 * ignited. Pure SVG: crisp at any size, theme-aware.
 *
 * Props:
 *   size      – icon size in px (default 32)
 *   showText  – render the wordmark next to the icon (default true)
 *   className – wrapper classes
 */
export const LogoMark = ({ size = 32, animated = true }) => {
  // Unique gradient id per instance — prevents collisions when multiple logos
  // render (a shared id can resolve to a display:none copy and render unfilled).
  const gradId = `motiveGrad-${useId()}`;
  return (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Motive"
  >
    <defs>
      <linearGradient id={gradId} x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7C5CF6" />
        <stop offset="0.55" stopColor="#9B5CFF" />
        <stop offset="1" stopColor="#C45BD6" />
      </linearGradient>
    </defs>

    {/* rounded squircle tile */}
    <rect x="2" y="2" width="44" height="44" rx="13" fill={`url(#${gradId})`} />

    {/* checkmark — "done" */}
    <path
      d="M13 25 L21 33 L35 16"
      stroke="white"
      strokeWidth="4.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />

    {/* spark — motivation */}
    <circle
      cx="37.5"
      cy="13"
      r="2.8"
      fill="#FFC04D"
      className={animated ? 'animate-spark-pulse' : ''}
      style={{ transformOrigin: '37.5px 13px' }}
    />
  </svg>
  );
};

const Logo = ({ size = 32, showText = true, className = '' }) => (
  <span className={`inline-flex items-center gap-2.5 ${className}`}>
    <LogoMark size={size} />
    {showText && (
      <span
        className="font-display font-bold tracking-tight text-gray-900 dark:text-white"
        style={{ fontSize: size * 0.62 }}
      >
        Motive
      </span>
    )}
  </span>
);

export default Logo;
