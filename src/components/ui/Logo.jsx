import React, { useId } from 'react';
import { BRAND_COLORS, MARK, WORDMARK } from '../../config/brandMark';

/**
 * Clientglass brand mark.
 *
 * A check whose long arm rises into an arrow — "done, and moving" — in white on
 * a petrol tile. Deliberately quiet: petrol is the brand hue and is kept off the
 * status colours (hue means *state* in this app, see utils/statusColors.js), and
 * there is no second accent because amber already means "at risk".
 *
 * The geometry and colours live in config/brandMark.js and are shared with the
 * asset generator (`npm run brand`), which produces the favicon, PWA/Android
 * icons, social image and README banner from the same numbers — so this
 * component and those files cannot drift apart.
 *
 * LogoMark props:
 *   size       – icon size in px (default 32)
 *   decorative – hide from assistive tech; use when the name "Clientglass" is already
 *                present as text next to it (Logo does this when showText)
 *
 * Logo props:
 *   size      – mark size in px (default 32); wordmark and gap scale with it
 *   showText  – render the wordmark next to the mark (default true)
 *   tone      – 'default' (adapts to light/dark theme) | 'light' (white wordmark,
 *               for use on the petrol gradient panel)
 *   className – wrapper classes
 */
export const LogoMark = ({ size = 32, decorative = false }) => {
  // Unique gradient id per instance — prevents collisions when multiple logos
  // render (a shared id can resolve to a display:none copy and render unfilled).
  const gradId = `motiveGrad-${useId()}`;
  const { tile, gradient } = MARK;
  const a11y = decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': WORDMARK.text };
  const stroke = {
    stroke: 'white',
    strokeWidth: MARK.strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    fill: 'none',
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${MARK.viewBox} ${MARK.viewBox}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...a11y}
    >
      <defs>
        <linearGradient
          id={gradId}
          x1={gradient.x1}
          y1={gradient.y1}
          x2={gradient.x2}
          y2={gradient.y2}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={BRAND_COLORS.deep} />
          <stop offset="1" stopColor={BRAND_COLORS.base} />
        </linearGradient>
      </defs>

      {/* rounded squircle tile */}
      <rect x={tile.x} y={tile.y} width={tile.size} height={tile.size} rx={tile.radius} fill={`url(#${gradId})`} />

      {/* the check… */}
      <path d={MARK.check} {...stroke} />
      {/* …rising into an arrowhead */}
      <path d={MARK.head} {...stroke} />
    </svg>
  );
};

// The wordmark is live text (theme-aware, selectable, no extra request) set in
// the app's display face, IBM Plex Sans Bold, with tracking/size/gap taken from
// brandMark.js so it matches the outlined lockups used in images and email.
const Logo = ({ size = 32, showText = true, tone = 'default', className = '' }) => (
  <span className={`inline-flex items-center ${className}`} style={{ gap: size * WORDMARK.gapRatio }}>
    <LogoMark size={size} decorative={showText} />
    {showText && (
      <span
        className={`font-display ${tone === 'light' ? 'text-white' : 'text-light-text dark:text-dark-text'}`}
        style={{
          fontSize: size * WORDMARK.sizeRatio,
          fontWeight: WORDMARK.weight,
          letterSpacing: `${WORDMARK.letterSpacingEm}em`,
          lineHeight: 1,
        }}
      >
        {WORDMARK.text}
      </span>
    )}
  </span>
);

export default Logo;
