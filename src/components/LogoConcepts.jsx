import React from 'react';

/**
 * Three brand-mark concepts for Motive, each mapped to a core idea of the product.
 * All share the signature violet→magenta squircle + amber spark so the family is cohesive.
 */

const Tile = ({ id, children }) => (
  <>
    <defs>
      <linearGradient id={id} x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7C5CF6" />
        <stop offset="0.55" stopColor="#9B5CFF" />
        <stop offset="1" stopColor="#C45BD6" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="44" height="44" rx="13" fill={`url(#${id})`} />
    {children}
  </>
);

const Spark = ({ cx, cy, r = 3, animated }) => (
  <circle
    cx={cx}
    cy={cy}
    r={r}
    fill="#FFC04D"
    className={animated ? 'animate-spark-pulse' : ''}
    style={{ transformOrigin: `${cx}px ${cy}px` }}
  />
);

const svgProps = (size) => ({
  width: size,
  height: size,
  viewBox: '0 0 48 48',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
  role: 'img',
});

/* A — MOMENTUM: an ascending zig-zag "M" — intent turning into upward motion. */
export const MarkMomentum = ({ size = 48, animated = true }) => (
  <svg {...svgProps(size)} aria-label="Motive — Momentum">
    <Tile id="gMomentum">
      <path
        d="M12 34 L17 15 L24 26 L31 15 L36 34"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Spark cx="37.5" cy="12.5" animated={animated} />
    </Tile>
  </svg>
);

/* B — BLOCKS / GROWTH: three rising rounded bars — organized blocks building progress. */
export const MarkBlocks = ({ size = 48, animated = true }) => (
  <svg {...svgProps(size)} aria-label="Motive — Blocks">
    <Tile id="gBlocks">
      <rect x="11" y="27" width="6.5" height="9" rx="2.2" fill="white" />
      <rect x="20.75" y="21" width="6.5" height="15" rx="2.2" fill="white" />
      <rect x="30.5" y="15" width="6.5" height="21" rx="2.2" fill="white" />
      <Spark cx="33.75" cy="11" r="2.6" animated={animated} />
    </Tile>
  </svg>
);

/* C — DONE: a checkmark with a spark — tasks completed, motivation sparked. */
export const MarkDone = ({ size = 48, animated = true }) => (
  <svg {...svgProps(size)} aria-label="Motive — Done">
    <Tile id="gDone">
      <path
        d="M13 25 L21 33 L35 16"
        stroke="white"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Spark cx="37.5" cy="13" r="2.8" animated={animated} />
    </Tile>
  </svg>
);

export const CONCEPTS = [
  {
    key: 'momentum',
    name: 'Momentum',
    Mark: MarkMomentum,
    idea: 'An ascending “M” — intent turning into forward motion. Most abstract & ownable.',
  },
  {
    key: 'blocks',
    name: 'Blocks / Growth',
    Mark: MarkBlocks,
    idea: 'Rising blocks — your ideas as modular pieces that build into progress (Notion-style).',
  },
  {
    key: 'done',
    name: 'Done',
    Mark: MarkDone,
    idea: 'A checkmark + spark — tasks completed, motivation ignited. Most literal/productivity.',
  },
];
