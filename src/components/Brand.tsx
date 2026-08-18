/*
 * The brand mark — the NHQB rooflines: two overlapping gables with a chimney,
 * white on the Board's navy, matching the organisation's own logo. One inline
 * SVG reused in the header, the help sheet and the buyer app, so the identity
 * is identical everywhere (the app icon is the same drawing in public/icon.svg).
 */

export function BrandMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 512 512"
      role="img"
      aria-label="NHQB"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="512" height="512" rx="116" fill="#2c3a4c" />
      <g fill="none" stroke="#ffffff" strokeWidth="30" strokeLinecap="butt">
        <path d="M62 350 L242 168 L422 350" />
        <path d="M300 226 L364 162 L468 268" />
        <path d="M368 230 L428 292" />
      </g>
      <g fill="#ffffff">
        <rect x="130" y="196" width="42" height="86" />
        <rect x="120" y="176" width="62" height="22" />
      </g>
    </svg>
  )
}
