import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

const STATUSES = ['Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected']

const STATUS_STYLE = {
  'Applied':      { color: 'rgba(255,255,255,0.55)', border: 'rgba(255,255,255,0.2)' },
  'Phone Screen': { color: 'rgba(255,255,255,0.65)', border: 'rgba(255,255,255,0.28)' },
  'Interview':    { color: 'rgba(255,255,255,0.92)', border: 'rgba(255,255,255,0.5)' },
  'Offer':        { color: '#fff',                   border: 'rgba(255,255,255,0.85)' },
  'Rejected':     { color: 'rgba(255,255,255,0.28)', border: 'rgba(255,255,255,0.12)' },
}

const PIE_GRAYS = [
  'rgba(255,255,255,0.8)',
  'rgba(255,255,255,0.55)',
  'rgba(255,255,255,0.35)',
  'rgba(255,255,255,0.2)',
  'rgba(255,255,255,0.1)',
]

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

export default function Dashboard() {
  const [applications, setApplications] = useState([])
  const [stats, setStats]               = useState(null)
  const [loading, setLoading]           = useState(true)
  const [showModal, setShowModal]       = useState(false)
  const [filterStatus, setFilterStatus] = useState('All')
  const navigate = useNavigate()

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    try {
      const [appsRes, statsRes] = await Promise.all([
        client.get('/applications/'),
        client.get('/applications/stats/summary'),
      ])
      setApplications(appsRes.data)
      setStats(statsRes.data)
    } catch {
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const filtered = filterStatus === 'All'
    ? applications
    : applications.filter(a => a.status === filterStatus)

  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1
    return acc
  }, {})

  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

  const weekCounts = applications.reduce((acc, app) => {
    const date = new Date(app.date_applied)
    const week = `W${String(getWeekNumber(date)).padStart(2, '0')}`
    acc[week] = (acc[week] || 0) + 1
    return acc
  }, {})

  const barData = Object.entries(weekCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, count]) => ({ week, count }))

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#090909', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em' }}>LOADING...</span>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#090909', color: '#fff' }}>

      <nav style={{ borderBottom: '1px solid #1a1a1a', padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: '#fff' }}>JOB TRACKER</span>
        <button onClick={logout} style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer' }}>
          Sign out
        </button>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>

        {/* Stat cards */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: '#1a1a1a', border: '1px solid #1a1a1a', borderRadius: 6, overflow: 'hidden', marginBottom: 1 }}>
            {[
              { label: 'APPLIED',   value: stats.total },
              { label: 'RESPONSE',  value: `${stats.response_rate}%` },
              { label: 'INTERVIEW', value: `${stats.interview_rate}%` },
              { label: 'OFFERS',    value: `${stats.offer_rate}%` },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: '#0e0e0e', padding: '16px 18px' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#fff', lineHeight: 1, letterSpacing: '-0.04em' }}>{value}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,0.32)', marginTop: 6, letterSpacing: '0.16em' }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Charts */}
        {applications.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#1a1a1a', border: '1px solid #1a1a1a', borderTop: 'none', borderRadius: '0 0 6px 6px', overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ background: '#0b0b0b', padding: '16px 18px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,0.32)', letterSpacing: '0.16em', marginBottom: 12 }}>WEEKLY VOLUME</div>
              <ResponsiveContainer width="100%" height={90}>
                <BarChart data={barData} barSize={14}>
                  <XAxis dataKey="week" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 9, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                  <YAxis hide allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: 4, fontFamily: 'monospace', fontSize: 10 }}
                    labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
                    itemStyle={{ color: '#fff' }}
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  />
                  <Bar dataKey="count" fill="rgba(255,255,255,0.7)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: '#0b0b0b', padding: '16px 18px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,0.32)', letterSpacing: '0.16em', marginBottom: 10 }}>PIPELINE</div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <ResponsiveContainer width={80} height={80}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={24} outerRadius={36} dataKey="value" paddingAngle={2}>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_GRAYS[i % PIE_GRAYS.length]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                  {pieData.map((entry, i) => (
                    <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 5, height: 5, background: PIE_GRAYS[i % PIE_GRAYS.length], borderRadius: 1, flexShrink: 0 }} />
                      <span style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.1em', flex: 1 }}>{entry.name.toUpperCase()}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {['All', ...STATUSES].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  fontFamily: 'monospace',
                  fontSize: 9,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  padding: '4px 11px',
                  borderRadius: 3,
                  border: filterStatus === s ? '1px solid #fff' : '1px solid #242424',
                  background: filterStatus === s ? '#fff' : 'transparent',
                  color: filterStatus === s ? '#000' : 'rgba(255,255,255,0.42)',
                  cursor: 'pointer',
                  fontWeight: filterStatus === s ? 700 : 400,
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{ fontFamily: 'monospace', fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', padding: '6px 16px', borderRadius: 3, border: '1px solid #fff', background: '#fff', color: '#000', cursor: 'pointer' }}
          >
            + ADD
          </button>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.16em' }}>
            {applications.length === 0 ? 'NO APPLICATIONS YET' : `NO ${filterStatus.toUpperCase()} APPLICATIONS`}
          </div>
        ) : (
          <div style={{ border: '1px solid #1a1a1a', borderRadius: 6, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1a1a1a', background: '#0a0a0a' }}>
                  {['Company', 'Role', 'Status', 'Date Applied', 'Salary'].map(h => (
                    <th key={h} style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,0.32)', letterSpacing: '0.16em', textTransform: 'uppercase', textAlign: 'left', padding: '9px 16px', fontWeight: 400 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((app, i) => (
                  <tr key={app.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #111' : 'none', background: i % 2 === 0 ? '#0d0d0d' : '#0b0b0b' }}>
                    <td style={{ padding: '11px 16px', fontWeight: 600, color: '#fff', letterSpacing: '-0.015em' }}>{app.company}</td>
                    <td style={{ padding: '11px 16px', color: 'rgba(255,255,255,0.52)' }}>{app.role}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{
                        fontFamily: 'monospace', fontSize: 9,
                        letterSpacing: '0.12em', textTransform: 'uppercase',
                        padding: '3px 8px',
                        border: `1px solid ${STATUS_STYLE[app.status]?.border || 'rgba(255,255,255,0.15)'}`,
                        color: STATUS_STYLE[app.status]?.color || 'rgba(255,255,255,0.5)',
                        borderRadius: 3, display: 'inline-block',
                      }}>
                        {app.status}
                      </span>
                    </td>
                    <td style={{ padding: '11px 16px', fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.38)' }}>{app.date_applied}</td>
                    <td style={{ padding: '11px 16px', fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>
                      {app.salary_min && app.salary_max
                        ? `£${app.salary_min.toLocaleString()} – £${app.salary_max.toLocaleString()}`
                        : app.salary_min ? `£${app.salary_min.toLocaleString()}+` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <AddModal
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchAll() }}
        />
      )}
    </div>
  )
}

function AddModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    company: '', role: '', status: 'Applied',
    date_applied: new Date().toISOString().split('T')[0],
    job_url: '', salary_min: '', salary_max: '', notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  function update(field, value) { setForm(f => ({ ...f, [field]: value })) }

  async function handleSave() {
    if (!form.company || !form.role) { setError('Company and role are required'); return }
    setLoading(true); setError('')
    try {
      await client.post('/applications/', {
        ...form,
        salary_min: form.salary_min ? parseInt(form.salary_min) : null,
        salary_max: form.salary_max ? parseInt(form.salary_max) : null,
      })
      onSave()
    } catch { setError('Failed to save') } finally { setLoading(false) }
  }

  const inputStyle = {
    width: '100%', background: '#0d0d0d',
    border: '1px solid #1e1e1e', color: '#fff',
    borderRadius: 3, padding: '8px 10px', fontSize: 12,
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }

  const labelStyle = {
    display: 'block', fontFamily: 'monospace', fontSize: 9,
    color: 'rgba(255,255,255,0.35)', letterSpacing: '0.14em',
    textTransform: 'uppercase', marginBottom: 5,
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
      <div style={{ background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 6, width: '100%', maxWidth: 480, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>Add Application</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
        </div>

        {error && (
          <div style={{ border: '1px solid #2e1a1a', background: '#150d0d', color: 'rgba(255,120,120,0.8)', fontFamily: 'monospace', fontSize: 9, padding: '8px 10px', borderRadius: 3, marginBottom: 14, letterSpacing: '0.08em' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={labelStyle}>Company *</label><input style={inputStyle} value={form.company} onChange={e => update('company', e.target.value)} placeholder="Google" /></div>
            <div><label style={labelStyle}>Role *</label><input style={inputStyle} value={form.role} onChange={e => update('role', e.target.value)} placeholder="Software Engineer" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.status} onChange={e => update('status', e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s} style={{ background: '#0d0d0d' }}>{s}</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>Date Applied</label><input type="date" style={inputStyle} value={form.date_applied} onChange={e => update('date_applied', e.target.value)} /></div>
          </div>
          <div><label style={labelStyle}>Job URL</label><input style={inputStyle} value={form.job_url} onChange={e => update('job_url', e.target.value)} placeholder="https://..." /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={labelStyle}>Min Salary (£)</label><input type="number" style={inputStyle} value={form.salary_min} onChange={e => update('salary_min', e.target.value)} placeholder="40000" /></div>
            <div><label style={labelStyle}>Max Salary (£)</label><input type="number" style={inputStyle} value={form.salary_max} onChange={e => update('salary_max', e.target.value)} placeholder="60000" /></div>
          </div>
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea style={{ ...inputStyle, resize: 'none', height: 72 }} value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Notes about this application..." />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '9px', border: '1px solid #222', background: 'transparent', color: 'rgba(255,255,255,0.4)', borderRadius: 3, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={loading} style={{ flex: 1, fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '9px', border: '1px solid #fff', background: '#fff', color: '#000', borderRadius: 3, cursor: 'pointer', fontWeight: 700, opacity: loading ? 0.5 : 1 }}>
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}