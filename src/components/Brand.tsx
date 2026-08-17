/*
 * The NHQB brand mark — a compliance shield with a check, in the brand
 * gradient. One inline SVG, reused in the header, the help sheet and (as a
 * static file) the app icon, so the identity is the same everywhere.
 */

export function BrandMark({ size = 36, className }: { size?: number; className?: string }) {
  // A unique gradient id per instance would be ideal, but a single fixed id is
  // fine here — the app never renders two marks with different palettes.
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
      <defs>
        <linearGradient id="nhqb-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4f8bff" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="116" fill="#0b1220" />
      <path
        d="M256 84 396 136 V266 c0 100 -62 164 -140 196 c-78 -32 -140 -96 -140 -196 V136 Z"
        fill="url(#nhqb-mark)"
      />
      <path
        d="M200 262 244 306 320 214"
        fill="none"
        stroke="#ffffff"
        strokeWidth="30"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
