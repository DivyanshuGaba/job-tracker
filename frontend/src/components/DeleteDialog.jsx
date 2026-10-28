import { useEffect } from 'react'
import { useTheme } from '../themeContext'

export default function DeleteDialog({ app, onCancel, onConfirm }) {
  const { c } = useTheme()

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div style={{ position: 'fixed', inset: 0, background: c.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="delete-title" style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16, boxShadow: c.shadow, width: '100%', maxWidth: 400, padding: 24 }}>
        <h2 id="delete-title" style={{ margin: 0, fontSize: 18, fontWeight: 700, color: c.text }}>Delete this application?</h2>
        <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.6, color: c.muted }}>
          <strong style={{ color: c.text }}>{app.company}</strong>, {app.role}, and its notes will be removed for good. This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button onClick={onCancel} style={{ flex: 1, height: 44, border: `1px solid ${c.borderStrong}`, borderRadius: 10, background: c.surface, color: c.textSoft, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, height: 44, border: `1px solid ${c.dangerBorder}`, borderRadius: 10, background: c.dangerSoft, color: c.danger, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Delete</button>
        </div>
      </div>
    </div>
  )
}
