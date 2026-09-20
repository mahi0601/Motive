import React, { useId } from 'react';

/**
 * Motive brand mark.
 * A checkmark on a petrol squircle — deliberately quiet (see PLAN "Petrol &
 * Ink"): the old mark's amber "spark" dot was a second brand accent
 * competing with amber's other job in this app, meaning "at risk." The mark
 * carries the brand alone now; state is never expressed here.
 *
 * Props:
 *   size      – icon size in px (default 32)
 *   showText  – render the wordmark next to the icon (default true)
 *   className – wrapper classes
 */
export const LogoMark = ({ size = 32 }) => {
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
        <stop stopColor="#0E4C5C" />
        <stop offset="1" stopColor="#1B7A8C" />
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
  </svg>
  );
};

const Logo = ({ size = 32, showText = true, className = '' }) => (
  <span className={`inline-flex items-center gap-2.5 ${className}`}>
    <LogoMark size={size} />
    {showText && (
      <span
        className="font-display font-bold tracking-tight text-light-text dark:text-dark-text"
        style={{ fontSize: size * 0.62 }}
      >
        Motive
      </span>
    )}
  </span>
);

export default Logo;
