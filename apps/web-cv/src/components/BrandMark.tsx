import { useId } from 'react';

/**
 * The VA monogram: one zig-zag stroke reads as a V running into an A (the
 * crossbar closes the A), set in a tile with the site accent - the same blue
 * as the `</>` motif on the landing page. Decorative: callers label the link.
 */
export const BrandMark = ({ size = 48, className }: { size?: number; className?: string }) => {
  const id = useId();
  const stroke = `${id}-stroke`;
  const edge = `${id}-edge`;

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={stroke} x1="12" y1="18" x2="52" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7fd3ff" />
          <stop offset="1" stopColor="#1b8afe" />
        </linearGradient>
        <linearGradient id={edge} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#49c6ff" stopOpacity="0.85" />
          <stop offset="0.5" stopColor="#1b8afe" stopOpacity="0.25" />
          <stop offset="1" stopColor="#1b8afe" stopOpacity="0.7" />
        </linearGradient>
      </defs>

      <rect x="1.5" y="1.5" width="61" height="61" rx="16" fill="#0d1621" stroke={`url(#${edge})`} strokeWidth="1.5" />

      <path
        d="M12 19 L22.5 45 L32 21 L41.5 45"
        stroke={`url(#${stroke})`}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M28.6 36 H38" stroke={`url(#${stroke})`} strokeWidth="4" strokeLinecap="round" />

      {/* the cursor after the name */}
      <rect x="46.5" y="40.5" width="6" height="4.5" rx="1.2" fill="#49c6ff" />
    </svg>
  );
};
