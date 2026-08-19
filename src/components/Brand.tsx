/*
 * The brand — two forms of the NHQB identity:
 *
 *  · BrandLogo — the organisation's actual logo (rooflines + stacked
 *    "New Homes Quality Board" wordmark), the exact asset from nhqb.org.uk.
 *    It is white artwork, so it only lives on navy — the app header.
 *  · BrandMark — the rooflines redrawn on a navy tile, for light surfaces
 *    (help sheet, buyer welcome) where the white logo would vanish.
 *
 * The app icon (public/icon.svg) embeds the official logo on the navy tile.
 */

export function BrandLogo({ height = 44, className }: { height?: number; className?: string }) {
  return (
    <img
      className={className}
      src="./nhqb-logo.png"
      alt="New Homes Quality Board"
      style={{ height, width: 'auto', display: 'block' }}
    />
  )
}

export function BrandMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <span
      className={className}
      role="img"
      aria-label="NHQB"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.226,
        background: '#2c3a4c',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: '0 0 auto',
      }}
    >
      <img
        src="./nhqb-logo.png"
        alt=""
        style={{ width: '74%', height: '70%', objectFit: 'contain', display: 'block' }}
      />
    </span>
  )
}
