import type { SVGAttributes } from 'react';

export type LogoProps = SVGAttributes<SVGSVGElement>;

/**
 * Full wordmark — inherits color via `currentColor`.
 * Use `text-foreground` on light/dark backgrounds.
 * Use `text-white` (or `className="text-white"`) on solid primary/blue panels.
 */
export const BrandingLogo = ({ ...props }: LogoProps) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 200" {...props}>
      {/* Tusk mark — stylized pen-nib / tusk arc */}
      <g>
        {/* Outer arc — the tusk curve */}
        <path
          fill="none"
          d="M20 160 C20 80 60 20 100 20 C120 20 136 34 136 54 C136 74 122 86 104 86 C92 86 84 78 84 66 C84 54 92 46 104 46 C110 46 114 50 114 56"
          stroke="currentColor"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Signature underline dot */}
        <circle cx="20" cy="172" r="8" fill="currentColor" />
        {/* Vertical stem */}
        <line
          x1="20"
          y1="160"
          x2="20"
          y2="100"
          stroke="currentColor"
          strokeWidth="14"
          strokeLinecap="round"
        />
      </g>

      {/* SIGNTUSK wordmark */}
      <text
        x="160"
        y="142"
        fontFamily="system-ui, -apple-system, 'Geist Sans', sans-serif"
        fontSize="88"
        fontWeight="700"
        letterSpacing="-3"
        fill="currentColor"
      >
        SIGNTUSK
      </text>
    </svg>
  );
};

/**
 * Full wordmark forced to white — for solid primary/blue backgrounds.
 */
export const BrandingLogoWhite = ({ ...props }: LogoProps) => {
  return <BrandingLogo {...props} style={{ color: '#ffffff', ...props.style }} />;
};

/**
 * Icon-only mark — inherits color via `currentColor`.
 */
export const BrandingLogoIcon = ({ ...props }: LogoProps) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" {...props}>
      <path
        d="M8 40 C8 20 16 6 26 6 C31 6 35 10 35 15 C35 20 31 23 27 23 C24 23 22 21 22 18 C22 15 24 13 27 13"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="8" cy="43" r="3" fill="currentColor" />
      <line
        x1="8"
        y1="40"
        x2="8"
        y2="26"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
};
