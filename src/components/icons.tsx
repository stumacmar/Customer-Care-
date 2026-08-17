/*
 * The icon set. One consistent family of stroke-based line icons (24×24,
 * round joins, currentColor) so the app looks like considered software rather
 * than a scatter of colourful emoji. Every icon inherits its colour and size
 * from context, so the same <Icon> works in a tab bar, a button or a heading.
 */

import type { CSSProperties, ReactNode } from 'react'

export type IconName =
  | 'help'
  | 'settings'
  | 'home'
  | 'book'
  | 'wrench'
  | 'megaphone'
  | 'alert'
  | 'plus'
  | 'check'
  | 'check-circle'
  | 'mail'
  | 'calendar'
  | 'file'
  | 'chart'
  | 'edit'
  | 'reopen'
  | 'printer'
  | 'copy'
  | 'camera'
  | 'mic'
  | 'paperclip'
  | 'building'
  | 'arrow-right'
  | 'trash'

const PATHS: Record<IconName, ReactNode> = {
  help: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M9.2 9.3a2.9 2.9 0 0 1 5.6 1c0 1.9-2.8 2.4-2.8 4" />
      <path d="M12 17.4h.01" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12.2 2.5h-.4a1.8 1.8 0 0 0-1.8 1.8 1.8 1.8 0 0 1-.9 1.55l-.55.32a1.8 1.8 0 0 1-1.8 0l-.13-.06a1.8 1.8 0 0 0-2.46.66l-.2.35a1.8 1.8 0 0 0 .66 2.45l.13.08a1.8 1.8 0 0 1 .9 1.55v.64a1.8 1.8 0 0 1-.9 1.56l-.13.07a1.8 1.8 0 0 0-.66 2.46l.2.34a1.8 1.8 0 0 0 2.46.66l.13-.06a1.8 1.8 0 0 1 1.8 0l.55.32a1.8 1.8 0 0 1 .9 1.55 1.8 1.8 0 0 0 1.8 1.8h.4a1.8 1.8 0 0 0 1.8-1.8 1.8 1.8 0 0 1 .9-1.55l.55-.32a1.8 1.8 0 0 1 1.8 0l.13.06a1.8 1.8 0 0 0 2.46-.66l.2-.35a1.8 1.8 0 0 0-.66-2.45l-.13-.07a1.8 1.8 0 0 1-.9-1.56v-.64a1.8 1.8 0 0 1 .9-1.55l.13-.08a1.8 1.8 0 0 0 .66-2.45l-.2-.35a1.8 1.8 0 0 0-2.46-.66l-.13.06a1.8 1.8 0 0 1-1.8 0l-.55-.32a1.8 1.8 0 0 1-.9-1.55 1.8 1.8 0 0 0-1.8-1.8z" />
    </>
  ),
  home: (
    <>
      <path d="M3 10.2 12 3l9 7.2" />
      <path d="M5.2 9v10.5a1 1 0 0 0 1 1h11.6a1 1 0 0 0 1-1V9" />
      <path d="M9.5 20.5V14h5v6.5" />
    </>
  ),
  book: (
    <>
      <path d="M2.5 5.4c2-1 4.6-1.4 6.6-.8 1.3.4 2.2 1.1 2.9 2 .7-.9 1.6-1.6 2.9-2 2-.6 4.6-.2 6.6.8v13.2c-2-1-4.6-1.4-6.6-.8-1.3.4-2.2 1.1-2.9 2-.7-.9-1.6-1.6-2.9-2-2-.6-4.6-.2-6.6.8z" />
      <path d="M12 6.6v13" />
    </>
  ),
  wrench: (
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  ),
  megaphone: (
    <>
      <path d="M3 11 21 6v12L3 14z" />
      <path d="M11.6 16.9a3 3 0 0 1-5.8-1.5" />
      <path d="M3 11v3" />
    </>
  ),
  alert: (
    <>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4.5" />
      <path d="M12 17.5h.01" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  check: <path d="M20 6.5 9.5 17.5 4.5 12.5" />,
  'check-circle': (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M8 12.2 11 15.2 16.2 9" />
    </>
  ),
  mail: (
    <>
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.2" />
      <path d="m3 6.5 9 5.5 9-5.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4.5" width="18" height="16.5" rx="2.2" />
      <path d="M3 9.5h18" />
      <path d="M8 2.5v4" />
      <path d="M16 2.5v4" />
    </>
  ),
  file: (
    <>
      <path d="M14 2.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8z" />
      <path d="M14 2.5V8h5.5" />
      <path d="M8.5 13.5h7" />
      <path d="M8.5 17h7" />
    </>
  ),
  chart: (
    <>
      <path d="M3 3v18h18" />
      <path d="M7.5 15.5v-3" />
      <path d="M12 15.5v-7" />
      <path d="M16.5 15.5v-5" />
    </>
  ),
  edit: (
    <>
      <path d="M12 20.5h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7.5 18.5l-4 1 1-4z" />
    </>
  ),
  reopen: (
    <>
      <path d="M3 12a9 9 0 1 0 2.6-6.3L3 8" />
      <path d="M3 3v5h5" />
    </>
  ),
  printer: (
    <>
      <path d="M6.5 9V2.5h11V9" />
      <path d="M6.5 18H4.5a2 2 0 0 1-2-2v-4.5a2 2 0 0 1 2-2h15a2 2 0 0 1 2 2V16a2 2 0 0 1-2 2h-2" />
      <rect x="6.5" y="14" width="11" height="7.5" rx="1" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="12.5" height="12.5" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </>
  ),
  camera: (
    <>
      <path d="M14.5 4.5h-5l-2.2 2.5H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-3.3z" />
      <circle cx="12" cy="13.5" r="3.2" />
    </>
  ),
  mic: (
    <>
      <path d="M12 2.5a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0v-6a3 3 0 0 0-3-3z" />
      <path d="M19 10.5v1a7 7 0 0 1-14 0v-1" />
      <path d="M12 18.5v3" />
    </>
  ),
  paperclip: (
    <path d="M21.4 11.1 12.2 20.3a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.9-2.8l8.5-8.5" />
  ),
  building: (
    <>
      <path d="M3.5 21h17" />
      <path d="M5.5 21V6.2a1.2 1.2 0 0 1 .8-1.13l6-2.14a1.2 1.2 0 0 1 1.6 1.13V21" />
      <path d="M18.5 21V10.5a1.2 1.2 0 0 0-.8-1.13L13.9 8" />
      <path d="M9 8h1.5" />
      <path d="M9 11.5h1.5" />
      <path d="M9 15h1.5" />
    </>
  ),
  'arrow-right': (
    <>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  trash: (
    <>
      <path d="M3.5 6h17" />
      <path d="M8.5 6V4.5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2V6" />
      <path d="M6.5 6v13a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2V6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </>
  ),
}

export function Icon({
  name,
  size = 20,
  strokeWidth = 1.9,
  className,
  style,
}: {
  name: IconName
  size?: number
  strokeWidth?: number
  className?: string
  style?: CSSProperties
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  )
}
