import { useTheme } from '../themeContext'

export default function StatusBadge({ status, large = false }) {
  const { tone } = useTheme()
  const t = tone(status)
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
      padding: large ? '6px 14px' : '4px 10px', borderRadius: 999,
      fontSize: large ? 14 : 13, fontWeight: 600, background: t.bg, color: t.fg,
    }}>
      <span style={{ width: 8, height: 8, borderRadius: 4, background: t.dot, flexShrink: 0 }} />
      {status}
    </span>
  )
}
