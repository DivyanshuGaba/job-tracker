import { useState, useEffect } from 'react'
import client from '../api/client'
import useIsMobile from '../hooks/useIsMobile'
import { useTheme } from '../themeContext'
import { STATUSES } from '../constants'

export default function AddModal({ onClose, onSave, existing }) {
  const { c } = useTheme()
  const isMobile = useIsMobile()
  const [form, setForm] = useState({
    company:      existing?.company      || '',
    role:         existing?.role         || '',
    status:       existing?.status       || 'Applied',
    date_applied: existing?.date_applied || new Date().toISOString().split('T')[0],
    job_url:      existing?.job_url      || '',
    salary_min:   existing?.salary_min   || '',
    salary_max:   existing?.salary_max   || '',
    notes:        existing?.notes        || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function update(field, value) { setForm(f => ({ ...f, [field]: value })) }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.company || !form.role) { setError('Company and role are required'); return }
    setLoading(true); setError('')
    try {
      const payload = {
        ...form,
        salary_min: form.salary_min ? parseInt(form.salary_min) : null,
        salary_max: form.salary_max ? parseInt(form.salary_max) : null,
      }
      if (existing) {
        await client.put(`/applications/${existing.id}`, payload)
      } else {
        await client.post('/applications/', payload)
      }
      onSave()
    } catch { setError('Failed to save') } finally { setLoading(false) }
  }

  /* fontSize 16 on mobile stops iOS Safari zooming the page when a field is focused */
  const inputStyle = {
    width: '100%', height: 44, padding: '0 12px', boxSizing: 'border-box',
    background: c.inputBg, color: c.text, border: `1px solid ${c.borderStrong}`,
    borderRadius: 10, fontSize: isMobile ? 16 : 14, fontFamily: 'inherit',
  }
  const labelStyle = { display: 'block', fontSize: 14, fontWeight: 500, color: c.textSoft, marginBottom: 6 }
  const optional = <span style={{ fontWeight: 400, color: c.muted }}> (optional)</span>
  const pair = { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }

  return (
    <div style={{ position: 'fixed', inset: 0, background: c.overlay, display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'center', zIndex: 50, padding: isMobile ? 12 : 24, overflowY: 'auto' }}>
      <div role="dialog" aria-modal="true" aria-labelledby="add-title" style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16, boxShadow: c.shadow, width: '100%', maxWidth: 560, maxHeight: isMobile ? 'none' : '92vh', overflowY: isMobile ? 'visible' : 'auto' }}>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, padding: '24px 24px 0' }}>
          <div>
            <h2 id="add-title" style={{ margin: 0, fontSize: 20, lineHeight: '28px', fontWeight: 700, color: c.text }}>{existing ? 'Edit application' : 'Add application'}</h2>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: c.muted }}>Company and role are enough to start. Fill in the rest any time.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" style={{ flexShrink: 0, width: 40, height: 40, border: 'none', borderRadius: 8, background: 'transparent', color: c.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <form onSubmit={handleSave} style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div role="alert" style={{ border: `1px solid ${c.dangerLine}`, background: c.dangerSoft, color: c.danger, fontSize: 14, padding: '10px 12px', borderRadius: 10 }}>{error}</div>
          )}
          <div style={pair}>
            <div><label htmlFor="f-company" style={labelStyle}>Company</label><input id="f-company" style={inputStyle} value={form.company} onChange={e => update('company', e.target.value)} placeholder="Google" /></div>
            <div><label htmlFor="f-role" style={labelStyle}>Role</label><input id="f-role" style={inputStyle} value={form.role} onChange={e => update('role', e.target.value)} placeholder="Software Engineer" /></div>
          </div>
          <div style={pair}>
            <div>
              <label htmlFor="f-status" style={labelStyle}>Status</label>
              <select id="f-status" style={{ ...inputStyle, cursor: 'pointer' }} value={form.status} onChange={e => update('status', e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label htmlFor="f-date" style={labelStyle}>Date applied</label><input id="f-date" type="date" style={inputStyle} value={form.date_applied} onChange={e => update('date_applied', e.target.value)} /></div>
          </div>
          <div><label htmlFor="f-url" style={labelStyle}>Job link{optional}</label><input id="f-url" style={inputStyle} value={form.job_url} onChange={e => update('job_url', e.target.value)} placeholder="https://" /></div>
          <div style={pair}>
            <div><label htmlFor="f-min" style={labelStyle}>Salary from (£){optional}</label><input id="f-min" type="number" style={inputStyle} value={form.salary_min} onChange={e => update('salary_min', e.target.value)} placeholder="40000" /></div>
            <div><label htmlFor="f-max" style={labelStyle}>Salary to (£){optional}</label><input id="f-max" type="number" style={inputStyle} value={form.salary_max} onChange={e => update('salary_max', e.target.value)} placeholder="60000" /></div>
          </div>
          <div>
            <label htmlFor="f-notes" style={labelStyle}>Notes{optional}</label>
            <textarea id="f-notes" rows={3} style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical' }} value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Recruiter name, referral, things to remember" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 4 }}>
            <button type="button" onClick={onClose} style={{ height: 44, padding: '0 18px', border: `1px solid ${c.borderStrong}`, borderRadius: 10, background: c.surface, color: c.textSoft, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ height: 44, padding: '0 18px', border: 'none', borderRadius: 10, background: c.primary, color: c.onPrimary, fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
              {loading ? 'Saving...' : existing ? 'Save changes' : 'Save application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
