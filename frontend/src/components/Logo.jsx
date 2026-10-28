import { useTheme } from '../themeContext'

export default function Logo({ size = 32 }) {
  const { c } = useTheme()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: size, height: size, borderRadius: 8, background: c.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none" stroke={c.onPrimary} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </div>
      <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em', color: c.text }}>Job Tracker</span>
    </div>
  )
}
