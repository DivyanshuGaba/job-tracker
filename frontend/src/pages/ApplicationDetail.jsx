import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import client from '../api/client'
import useIsMobile from '../hooks/useIsMobile'

const STATUSES = ['Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected']

const STATUS_STYLE = {
  'Applied':      { color: 'rgba(255,255,255,0.55)', border: 'rgba(255,255,255,0.2)' },
  'Phone Screen': { color: 'rgba(255,255,255,0.65)', border: 'rgba(255,255,255,0.28)' },
  'Interview':    { color: 'rgba(255,255,255,0.92)', border: 'rgba(255,255,255,0.5)' },
  'Offer':        { color: '#fff',                   border: 'rgba(255,255,255,0.85)' },
  'Rejected':     { color: 'rgba(255,255,255,0.28)', border: 'rgba(255,255,255,0.12)' },
}

export default function ApplicationDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [app, setApp]           = useState(null)
  const [loading, setLoading]   = useState(true)
  const [editing, setEditing]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm]         = useState({})
  const [saving, setSaving]     = useState(false)
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

  async function handleSave() {
    setSaving(true); setError('')
    try {
      const res = await client.put(`/applications/${id}`, {
        company:      form.company,
        role:         form.role,
        status:       form.status,
        date_applied: form.date_applied,
        job_url:      form.job_url,
        salary_min:   form.salary_min ? parseInt(form.salary_min) : null,
        salary_max:   form.salary_max ? parseInt(form.salary_max) : null,
        notes:        form.notes,
      })
      setApp(res.data)
      setEditing(false)
    } catch {
      setError('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    try {
      await client.delete(`/applications/${id}`)
      navigate('/')
    } catch {
      setError('Failed to delete')
    }
  }

  function update(field, value) { setForm(f => ({ ...f, [field]: value })) }

  /* fontSize 16 on mobile stops iOS Safari zooming the page when a field is focused */
  const inputStyle = {
    width: '100%', background: '#0d0d0d', border: '1px solid #1e1e1e',
    color: '#fff', borderRadius: 3,
    padding: isMobile ? '10px' : '8px 10px',
    fontSize: isMobile ? 16 : 13,
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }

  // UNIFORM CONTRAST TOKENS
  // nav secondary:  rgba(255,255,255,0.35)
  // field labels:   rgba(255,255,255,0.32)
  // secondary text: rgba(255,255,255,0.52)
  // tertiary text:  rgba(255,255,255,0.38)
  // cancel button:  rgba(255,255,255,0.52), border #333
  // delete button:  rgba(255,255,255,0.45), border #333

  const labelStyle = {
    display: 'block', fontFamily: 'monospace', fontSize: 9,
    color: 'rgba(255,255,255,0.32)', letterSpacing: '0.14em',
    textTransform: 'uppercase', marginBottom: 5,
  }

  const fieldValue = { fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, wordBreak: 'break-word' }

  const actionButton = {
    fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.14em',
    textTransform: 'uppercase',
    padding: isMobile ? '12px 20px' : '9px 20px',
    borderRadius: 3, cursor: 'pointer',
    flex: isMobile ? 1 : 'none',
  }

  if (loading) {
    return (
      <div className="min-h-screen-safe" style={{ background: '#090909', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em' }}>LOADING...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen-safe" style={{ background: '#090909', color: '#fff' }}>

      <nav style={{ borderBottom: '1px solid #1a1a1a', padding: isMobile ? '13px 16px' : '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: '#fff' }}>JOB TRACKER</span>
        <button
          onClick={() => navigate('/')}
          style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
        >
          ← Back
        </button>
      </nav>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: isMobile ? '22px 14px 40px' : '32px 24px' }}>

        <div style={{ marginBottom: isMobile ? 22 : 28 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: isMobile ? 10 : 16, marginBottom: 8 }}>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: isMobile ? 21 : 26, fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', marginBottom: 4, wordBreak: 'break-word' }}>{app.company}</h1>
              <div style={{ fontSize: isMobile ? 13 : 14, color: 'rgba(255,255,255,0.52)' }}>{app.role}</div>
            </div>
            <span style={{
              fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.14em',
              textTransform: 'uppercase', padding: '5px 12px', borderRadius: 3,
              border: `1px solid ${STATUS_STYLE[app.status]?.border || 'rgba(255,255,255,0.2)'}`,
              color: STATUS_STYLE[app.status]?.color || 'rgba(255,255,255,0.5)',
              flexShrink: 0, marginTop: 4, whiteSpace: 'nowrap',
            }}>
              {app.status}
            </span>
          </div>

          <div style={{ display: 'flex', gap: isMobile ? 10 : 16, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.08em' }}>Applied {app.date_applied}</span>
            {app.salary_min && (
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em' }}>
                £{app.salary_min.toLocaleString()}{app.salary_max ? ` – £${app.salary_max.toLocaleString()}` : '+'}
              </span>
            )}
            {app.job_url && (
              <a href={app.job_url} target="_blank" rel="noreferrer" style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', textDecoration: 'none' }}>
                View Job Posting ↗
              </a>
            )}
          </div>
        </div>

        <div style={{ height: 1, background: '#1a1a1a', marginBottom: isMobile ? 22 : 28 }} />

        {error && (
          <div style={{ border: '1px solid #2e1a1a', background: '#150d0d', color: 'rgba(255,120,120,0.8)', fontFamily: 'monospace', fontSize: 9, padding: '8px 10px', borderRadius: 3, marginBottom: 20, letterSpacing: '0.08em' }}>
            {error}
          </div>
        )}

        {!editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? 16 : 20 }}>
              <div><div style={labelStyle}>Company</div><div style={fieldValue}>{app.company}</div></div>
              <div><div style={labelStyle}>Role</div><div style={fieldValue}>{app.role}</div></div>
              <div><div style={labelStyle}>Status</div><div style={fieldValue}>{app.status}</div></div>
              <div><div style={labelStyle}>Date Applied</div><div style={fieldValue}>{app.date_applied}</div></div>
              <div><div style={labelStyle}>Min Salary</div><div style={fieldValue}>{app.salary_min ? `£${app.salary_min.toLocaleString()}` : '—'}</div></div>
              <div><div style={labelStyle}>Max Salary</div><div style={fieldValue}>{app.salary_max ? `£${app.salary_max.toLocaleString()}` : '—'}</div></div>
            </div>

            {app.job_url && (
              <div>
                <div style={labelStyle}>Job URL</div>
                <a href={app.job_url} target="_blank" rel="noreferrer" style={{ ...fieldValue, color: 'rgba(255,255,255,0.52)', textDecoration: 'none', display: 'block' }}>{app.job_url}</a>
              </div>
            )}

            {app.notes && (
              <div>
                <div style={labelStyle}>Notes</div>
                <div style={{ ...fieldValue, whiteSpace: 'pre-wrap', background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 3, padding: '12px 14px', lineHeight: 1.7 }}>{app.notes}</div>
              </div>
            )}

            <div style={{ height: 1, background: '#1a1a1a' }} />

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setEditing(true)}
                style={{ ...actionButton, fontWeight: 700, border: '1px solid #fff', background: '#fff', color: '#000' }}
              >
                Edit
              </button>
              <button
                onClick={() => setDeleting(true)}
                style={{ ...actionButton, border: '1px solid #333', background: 'transparent', color: 'rgba(255,255,255,0.45)' }}
              >
                Delete
              </button>
            </div>
          </div>

        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
              <div><label style={labelStyle}>Company *</label><input style={inputStyle} value={form.company || ''} onChange={e => update('company', e.target.value)} /></div>
              <div><label style={labelStyle}>Role *</label><input style={inputStyle} value={form.role || ''} onChange={e => update('role', e.target.value)} /></div>
              <div>
                <label style={labelStyle}>Status</label>
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.status || 'Applied'} onChange={e => update('status', e.target.value)}>
                  {STATUSES.map(s => <option key={s} value={s} style={{ background: '#0d0d0d' }}>{s}</option>)}
                </select>
              </div>
              <div><label style={labelStyle}>Date Applied</label><input type="date" style={inputStyle} value={form.date_applied || ''} onChange={e => update('date_applied', e.target.value)} /></div>
              <div><label style={labelStyle}>Min Salary (£)</label><input type="number" style={inputStyle} value={form.salary_min || ''} onChange={e => update('salary_min', e.target.value)} /></div>
              <div><label style={labelStyle}>Max Salary (£)</label><input type="number" style={inputStyle} value={form.salary_max || ''} onChange={e => update('salary_max', e.target.value)} /></div>
            </div>
            <div><label style={labelStyle}>Job URL</label><input style={inputStyle} value={form.job_url || ''} onChange={e => update('job_url', e.target.value)} /></div>
            <div>
              <label style={labelStyle}>Notes</label>
              <textarea style={{ ...inputStyle, resize: 'none', height: 100 }} value={form.notes || ''} onChange={e => update('notes', e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                onClick={() => setEditing(false)}
                style={{ ...actionButton, border: '1px solid #333', background: 'transparent', color: 'rgba(255,255,255,0.52)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ ...actionButton, fontWeight: 700, border: '1px solid #fff', background: '#fff', color: '#000', opacity: saving ? 0.5 : 1 }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>

      {deleting && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 6, width: '100%', maxWidth: 360, padding: isMobile ? 20 : 24 }}>
            <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: 10 }}>Delete Application</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 6, lineHeight: 1.6 }}>
              Remove <span style={{ color: '#fff', fontWeight: 600 }}>{app.company}</span> — <span style={{ color: 'rgba(255,255,255,0.6)' }}>{app.role}</span>?
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.1em', marginBottom: 22 }}>This cannot be undone.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setDeleting(false)}
                style={{ flex: 1, fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '11px', border: '1px solid #333', background: 'transparent', color: 'rgba(255,255,255,0.52)', borderRadius: 3, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                style={{ flex: 1, fontFamily: 'monospace', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '11px', border: '1px solid rgba(255,255,255,0.7)', background: 'transparent', color: 'rgba(255,255,255,0.8)', borderRadius: 3, cursor: 'pointer' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}