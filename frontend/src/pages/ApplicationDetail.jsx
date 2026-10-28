import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import client from '../api/client'
import useIsMobile from '../hooks/useIsMobile'
import { useTheme } from '../themeContext'
import { STATUSES } from '../constants'
import { daysSince, fullDate, formatSalary } from '../utils/format'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import StatusBadge from '../components/StatusBadge'
import DeleteDialog from '../components/DeleteDialog'

function toPayload(data) {
  return {
    company:      data.company,
    role:         data.role,
    status:       data.status,
    date_applied: data.date_applied,
    job_url:      data.job_url,
    salary_min:   data.salary_min ? parseInt(data.salary_min) : null,
    salary_max:   data.salary_max ? parseInt(data.salary_max) : null,
    notes:        data.notes,
  }
}

export default function ApplicationDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { c, tone } = useTheme()
  const [app, setApp]           = useState(null)
  const [form, setForm]         = useState({})
  const [loading, setLoading]   = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => { fetchApp() }, [id])

  async function fetchApp() {
    try {
      const res = await client.get(`/applications/${id}`)
      setApp(res.data)
      setForm(res.data)
    } catch {
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  async function save(data, afterSave) {
    setSaving(true); setError(''); setSaved(false)
    try {
      const res = await client.put(`/applications/${id}`, toPayload(data))
      afterSave(res.data)
      setSaved(true)
    } catch {
      setError('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  function handleSave(e) {
    e.preventDefault()
    save(form, data => { setApp(data); setForm(data) })
  }

  function moveToStage(status) {
    if (status === app.status || saving) return
    save({ ...app, status }, data => { setApp(data); setForm(f => ({ ...f, status: data.status })) })
  }

  async function handleDelete() {
    try {
      await client.delete(`/applications/${id}`)
      navigate('/')
    } catch {
      setDeleting(false)
      setError('Failed to delete')
    }
  }

  function update(field, value) { setSaved(false); setForm(f => ({ ...f, [field]: value })) }

  if (loading) {
    return (
      <div className="min-h-screen-safe" style={{ background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 14, color: c.muted }}>Loading...</span>
      </div>
    )
  }

  const dirty = JSON.stringify(toPayload(form)) !== JSON.stringify(toPayload(app))
  const currentIndex = STATUSES.indexOf(app.status)
  const t = tone(app.status)

  const card = { background: c.surface, border: `1px solid ${c.border}`, borderRadius: 14 }
  const cardTitle = { margin: 0, fontSize: 15, fontWeight: 600, color: c.text }

  /* fontSize 16 on mobile stops iOS Safari zooming the page when a field is focused */
  const inputStyle = {
    width: '100%', height: 44, padding: '0 12px', boxSizing: 'border-box',
    background: c.inputBg, color: c.text, border: `1px solid ${c.borderStrong}`,
    borderRadius: 10, fontSize: isMobile ? 16 : 14, fontFamily: 'inherit',
  }
  const labelStyle = { display: 'block', fontSize: 14, fontWeight: 500, color: c.textSoft, marginBottom: 6 }
  const grid = { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0,1fr))', gap: 16 }

  return (
    <div className="min-h-screen-safe" style={{ background: c.bg, color: c.text }}>

      <header style={{ background: c.surface, borderBottom: `1px solid ${c.border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '10px 16px' : '12px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/" style={{ textDecoration: 'none', flex: 1 }}><Logo size={isMobile ? 30 : 32} /></Link>
          <ThemeToggle />
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '12px 16px 48px' : '24px 32px 64px', display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 24 }}>

        <Link to="/" style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 44, fontSize: 14, fontWeight: 600, color: c.muted, textDecoration: 'none' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
          All applications
        </Link>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
          <div style={{ width: isMobile ? 48 : 56, height: isMobile ? 48 : 56, borderRadius: 14, background: c.surface, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: isMobile ? 20 : 22, color: c.textSoft, flexShrink: 0 }}>
            {app.company.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: '1 1 220px', minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: isMobile ? 22 : 28, lineHeight: 1.2, fontWeight: 700, letterSpacing: '-0.02em', wordBreak: 'break-word' }}>{app.company}</h1>
            <p style={{ margin: '4px 0 0', fontSize: 15, color: c.muted }}>{app.role} · Applied {fullDate(app.date_applied)}</p>
          </div>
          <StatusBadge status={app.status} large />
        </div>

        {error && (
          <div role="alert" style={{ border: `1px solid ${c.dangerLine}`, background: c.dangerSoft, color: c.danger, fontSize: 14, padding: '10px 12px', borderRadius: 10 }}>{error}</div>
        )}

        <section aria-label="Progress" style={{ ...card, padding: isMobile ? 16 : '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
            <h2 style={cardTitle}>Progress</h2>
            <span style={{ fontSize: 13, color: c.muted }}>Click a stage to move this application</span>
          </div>
          <div style={{ display: 'flex', flexWrap: isMobile ? 'nowrap' : 'wrap', gap: 8, overflowX: isMobile ? 'auto' : 'visible' }} className="filter-strip">
            {STATUSES.map((s, i) => {
              const current = s === app.status
              const done = i < currentIndex && app.status !== 'Rejected' && s !== 'Rejected'
              const st = tone(s)
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => moveToStage(s)}
                  aria-current={current ? 'step' : undefined}
                  disabled={saving}
                  style={{
                    flex: isMobile ? '0 0 auto' : '1 1 140px', minHeight: 48, padding: '0 16px', borderRadius: 10, cursor: 'pointer', whiteSpace: 'nowrap',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: current ? 700 : 600,
                    border: current ? `2px solid ${st.fg}` : done ? `1px solid ${c.borderStrong}` : `1px dashed ${c.faint}`,
                    background: current ? st.bg : done ? c.subtle : c.surface,
                    color: current ? st.fg : done ? c.textSoft : c.muted,
                  }}
                >
                  {done && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={tone('Offer').dot} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                  )}
                  {s}
                </button>
              )
            })}
          </div>
        </section>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>

          <form onSubmit={handleSave} style={{ ...card, flex: '999 1 560px', minWidth: 0, padding: isMobile ? 16 : 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <h2 style={cardTitle}>Details</h2>
            <div style={grid}>
              <div><label htmlFor="d-company" style={labelStyle}>Company</label><input id="d-company" style={inputStyle} value={form.company || ''} onChange={e => update('company', e.target.value)} required /></div>
              <div><label htmlFor="d-role" style={labelStyle}>Role</label><input id="d-role" style={inputStyle} value={form.role || ''} onChange={e => update('role', e.target.value)} required /></div>
              <div><label htmlFor="d-date" style={labelStyle}>Date applied</label><input id="d-date" type="date" style={inputStyle} value={form.date_applied || ''} onChange={e => update('date_applied', e.target.value)} /></div>
              <div><label htmlFor="d-url" style={labelStyle}>Job link</label><input id="d-url" style={inputStyle} value={form.job_url || ''} onChange={e => update('job_url', e.target.value)} placeholder="https://" /></div>
              <div><label htmlFor="d-min" style={labelStyle}>Salary from (£)</label><input id="d-min" type="number" style={inputStyle} value={form.salary_min || ''} onChange={e => update('salary_min', e.target.value)} /></div>
              <div><label htmlFor="d-max" style={labelStyle}>Salary to (£)</label><input id="d-max" type="number" style={inputStyle} value={form.salary_max || ''} onChange={e => update('salary_max', e.target.value)} /></div>
            </div>
            <div>
              <label htmlFor="d-notes" style={labelStyle}>Notes</label>
              <textarea id="d-notes" rows={5} style={{ ...inputStyle, height: 'auto', padding: '10px 12px', lineHeight: 1.6, resize: 'vertical' }} value={form.notes || ''} onChange={e => update('notes', e.target.value)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
              {saved && !dirty && <span role="status" style={{ marginRight: 'auto', fontSize: 14, color: tone('Offer').fg }}>Saved</span>}
              <button type="button" onClick={() => { setForm(app); setSaved(false) }} disabled={!dirty} style={{ height: 44, padding: '0 18px', border: `1px solid ${c.borderStrong}`, borderRadius: 10, background: c.surface, color: c.textSoft, fontSize: 14, fontWeight: 600, cursor: dirty ? 'pointer' : 'default', opacity: dirty ? 1 : 0.5 }}>Discard changes</button>
              <button type="submit" disabled={!dirty || saving} style={{ height: 44, padding: '0 18px', border: 'none', borderRadius: 10, background: c.primary, color: c.onPrimary, fontSize: 14, fontWeight: 600, cursor: dirty ? 'pointer' : 'default', opacity: dirty && !saving ? 1 : 0.5 }}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>

          <aside style={{ flex: '1 1 280px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ ...card, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h2 style={cardTitle}>At a glance</h2>
              <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '10px 16px', fontSize: 14 }}>
                <dt style={{ color: c.muted }}>Status</dt><dd style={{ margin: 0, textAlign: 'right', fontWeight: 600, color: t.fg }}>{app.status}</dd>
                <dt style={{ color: c.muted }}>Applied</dt><dd style={{ margin: 0, textAlign: 'right', fontWeight: 600 }}>{daysSince(app.date_applied) <= 0 ? 'Today' : `${daysSince(app.date_applied)} days ago`}</dd>
                <dt style={{ color: c.muted }}>Salary range</dt><dd style={{ margin: 0, textAlign: 'right', fontWeight: 600 }}>{formatSalary(app.salary_min, app.salary_max)}</dd>
              </dl>
              {app.job_url && (
                <a href={app.job_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 44, fontSize: 14, fontWeight: 600, color: c.link, textDecoration: 'none' }}>
                  Open job posting
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" /></svg>
                </a>
              )}
            </div>

            <div style={{ ...card, border: `1px solid ${c.dangerLine}`, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h2 style={{ ...cardTitle, color: c.danger }}>Delete this application</h2>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: c.muted }}>This removes {app.company} and its notes for good. It cannot be undone.</p>
              <button type="button" onClick={() => setDeleting(true)} style={{ height: 44, border: `1px solid ${c.dangerBorder}`, borderRadius: 10, background: c.surface, color: c.danger, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Delete application</button>
            </div>
          </aside>
        </div>
      </main>

      {deleting && <DeleteDialog app={app} onCancel={() => setDeleting(false)} onConfirm={handleDelete} />}
    </div>
  )
}
