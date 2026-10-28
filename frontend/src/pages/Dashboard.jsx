import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import client from '../api/client'
import useIsMobile from '../hooks/useIsMobile'
import { useTheme } from '../themeContext'
import { STATUSES } from '../constants'
import { relativeDate, fullDate, daysSince, formatSalary, getWeekNumber } from '../utils/format'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import StatusBadge from '../components/StatusBadge'
import AddModal from '../components/AddModal'
import DeleteDialog from '../components/DeleteDialog'

const FOLLOW_UP_DAYS = 7

export default function Dashboard() {
  const { c, tone } = useTheme()
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const [applications, setApplications] = useState([])
  const [stats, setStats]               = useState(null)
  const [loading, setLoading]           = useState(true)
  const [showModal, setShowModal]       = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [filterStatus, setFilterStatus] = useState('All')
  const [query, setQuery]               = useState('')

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

  async function confirmDelete() {
    try {
      await client.delete(`/applications/${deleteTarget.id}`)
      setDeleteTarget(null)
      fetchAll()
    } catch {
      setDeleteTarget(null)
    }
  }

  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1
    return acc
  }, {})

  const q = query.trim().toLowerCase()
  const filtered = applications.filter(a =>
    (filterStatus === 'All' || a.status === filterStatus) &&
    (!q || a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q))
  )

  const weekCounts = applications.reduce((acc, app) => {
    const week = `W${String(getWeekNumber(new Date(app.date_applied))).padStart(2, '0')}`
    acc[week] = (acc[week] || 0) + 1
    return acc
  }, {})
  const barData = Object.entries(weekCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([week, count]) => ({ week, count }))

  const followUps = applications
    .filter(a => a.status === 'Applied' && daysSince(a.date_applied) >= FOLLOW_UP_DAYS)
    .sort((a, b) => daysSince(b.date_applied) - daysSince(a.date_applied))
    .slice(0, 3)

  const card = { background: c.surface, border: `1px solid ${c.border}`, borderRadius: 14 }
  const cardTitle = { margin: 0, fontSize: 15, fontWeight: 600, color: c.text }
  const sub = { fontSize: 13, color: c.muted }

  if (loading) {
    return (
      <div className="min-h-screen-safe" style={{ background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 14, color: c.muted }}>Loading...</span>
      </div>
    )
  }

  const addButton = (
    <button
      onClick={() => setShowModal(true)}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 40, padding: '0 16px', border: 'none', borderRadius: 10, background: c.primary, color: c.onPrimary, fontSize: 14, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
      {isMobile ? 'Add' : 'Add application'}
    </button>
  )

  const statCards = stats ? [
    { label: 'Applied', value: stats.total, note: 'Applications sent' },
    { label: 'Response rate', value: `${stats.response_rate}%`, note: 'Heard back' },
    { label: 'Interview rate', value: `${stats.interview_rate}%`, note: 'Reached an interview' },
    { label: 'Offers', value: `${stats.offer_rate}%`, note: 'Offers received' },
  ] : []

  const cols = 'minmax(0,2.2fr) minmax(0,2fr) minmax(0,1.4fr) minmax(0,1.2fr) minmax(0,1.4fr) 84px'

  return (
    <div className="min-h-screen-safe" style={{ background: c.bg, color: c.text }}>

      <header style={{ background: c.surface, borderBottom: `1px solid ${c.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '10px 16px' : '12px 32px', display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 16 }}>
          <Link to="/" style={{ textDecoration: 'none', marginRight: isMobile ? 0 : 8 }}><Logo size={isMobile ? 30 : 32} /></Link>
          <div style={{ flex: 1 }} />
          {addButton}
          <ThemeToggle />
          <button onClick={logout} style={{ height: 40, padding: '0 6px', border: 'none', background: 'none', color: c.muted, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Sign out</button>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '20px 16px 48px' : '32px 32px 64px', display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 24 }}>

        <div>
          <h1 style={{ margin: 0, fontSize: isMobile ? 24 : 28, lineHeight: 1.2, fontWeight: 700, letterSpacing: '-0.02em' }}>Your applications</h1>
          <p style={{ margin: '6px 0 0', fontSize: 15, color: c.muted }}>
            {applications.length === 0 ? 'Nothing here yet. Add your first one.' : `${applications.length} ${applications.length === 1 ? 'application' : 'applications'} so far.`}
          </p>
        </div>

        {stats && (
          <section aria-label="Summary" style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, minmax(0,1fr))' : 'repeat(4, minmax(0,1fr))', gap: isMobile ? 12 : 16 }}>
            {statCards.map(s => (
              <div key={s.label} style={{ ...card, padding: isMobile ? 14 : 20, display: 'flex', flexDirection: 'column', gap: isMobile ? 4 : 8 }}>
                <div style={{ ...sub, fontWeight: 500 }}>{s.label}</div>
                <div style={{ fontSize: isMobile ? 26 : 34, lineHeight: 1.1, fontWeight: 700, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
                {!isMobile && <div style={sub}>{s.note}</div>}
              </div>
            ))}
          </section>
        )}

        {applications.length > 0 && (
          <section style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0,1fr))', gap: 16 }}>

            <div style={{ ...card, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h2 style={cardTitle}>Applications per week</h2>
                <span style={sub}>Latest {barData.length}</span>
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={barData} barSize={isMobile ? 24 : 22}>
                  <XAxis dataKey="week" tick={{ fill: c.muted, fontSize: 12 }} axisLine={{ stroke: c.border }} tickLine={false} />
                  <YAxis hide allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 8, fontSize: 13 }}
                    labelStyle={{ color: c.muted }}
                    itemStyle={{ color: c.text }}
                    cursor={{ fill: c.hover }}
                  />
                  <Bar dataKey="count" name="Applications" radius={[6, 6, 0, 0]}>
                    {barData.map((d, i) => <Cell key={d.week} fill={i === barData.length - 1 ? c.chartBarNow : c.chartBar} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ ...card, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h2 style={cardTitle}>Where they are now</h2>
                <span style={sub}>{applications.length} total</span>
              </div>
              <div style={{ display: 'flex', height: 14, borderRadius: 7, overflow: 'hidden', gap: 2 }}>
                {STATUSES.filter(s => statusCounts[s]).map(s => (
                  <div key={s} title={s} style={{ flex: statusCounts[s], background: tone(s).dot }} />
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {STATUSES.map(s => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 5, background: tone(s).dot, flexShrink: 0 }} />
                    <span style={{ flex: 1, color: c.textSoft }}>{s}</span>
                    <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{statusCounts[s] || 0}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ ...card, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                <h2 style={cardTitle}>Time to follow up</h2>
                <span style={sub}>No reply after {FOLLOW_UP_DAYS} days</span>
              </div>
              {followUps.length === 0 ? (
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: c.muted }}>You are all caught up. Nothing has been waiting longer than a week.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {followUps.map(a => (
                    <Link key={a.id} to={`/application/${a.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: `1px solid ${c.border}`, borderRadius: 10, textDecoration: 'none', color: c.text }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: c.subtle, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: c.textSoft, flexShrink: 0 }}>{a.company.charAt(0).toUpperCase()}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.company}</div>
                        <div style={{ ...sub, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.role}</div>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: c.warnFg, background: c.warnBg, borderRadius: 999, padding: '4px 10px', whiteSpace: 'nowrap' }}>{daysSince(a.date_applied)} days</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        <section style={{ ...card, overflow: 'hidden' }}>
          <div style={{ padding: isMobile ? '16px 16px 0' : '16px 20px 0', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ ...cardTitle, fontSize: 16 }}>All applications</h2>
            <label style={{ flex: isMobile ? '1 1 100%' : '0 1 300px', display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 12px', border: `1px solid ${c.borderStrong}`, borderRadius: 10, background: c.inputBg, boxSizing: 'border-box' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.faint} strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search company or role"
                aria-label="Search applications"
                style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: c.text, fontSize: isMobile ? 16 : 14, fontFamily: 'inherit' }}
              />
            </label>
          </div>

          <div
            role="tablist"
            aria-label="Filter by status"
            className="filter-strip"
            style={{ display: 'flex', gap: isMobile ? 8 : 4, padding: isMobile ? '12px 16px' : '12px 20px 0', borderBottom: isMobile ? 'none' : `1px solid ${c.border}`, overflowX: 'auto' }}
          >
            {['All', ...STATUSES].map(s => {
              const active = filterStatus === s
              const n = s === 'All' ? applications.length : (statusCounts[s] || 0)
              return (
                <button
                  key={s}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilterStatus(s)}
                  style={isMobile ? {
                    flexShrink: 0, height: 40, padding: '0 14px', borderRadius: 20, fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                    border: active ? 'none' : `1px solid ${c.borderStrong}`,
                    background: active ? c.primary : c.surface, color: active ? c.onPrimary : c.textSoft,
                  } : {
                    flexShrink: 0, padding: '10px 12px', border: 'none', background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap',
                    fontSize: 14, fontWeight: 600, marginBottom: -1,
                    borderBottom: `2px solid ${active ? c.primary : 'transparent'}`,
                    color: active ? c.accentText : c.muted,
                  }}
                >
                  {s}
                  <span style={{ marginLeft: 6, fontSize: 12, padding: '2px 7px', borderRadius: 999, fontVariantNumeric: 'tabular-nums', background: active && !isMobile ? c.accentSoft : (isMobile && active ? 'rgba(128,128,128,0.25)' : c.subtle), color: active && !isMobile ? c.accentText : 'inherit' }}>{n}</span>
                </button>
              )
            })}
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px 20px', color: c.muted, fontSize: 15 }}>
              {applications.length === 0
                ? 'No applications yet. Use Add application to start your list.'
                : q ? `Nothing matches "${query.trim()}".` : `No ${filterStatus} applications.`}
            </div>
          ) : isMobile ? (
            <ul style={{ margin: 0, padding: '0 16px 16px', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(app => (
                <li key={app.id}>
                  <Link to={`/application/${app.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, border: `1px solid ${c.border}`, borderRadius: 12, background: c.surface, textDecoration: 'none', color: c.text }}>
                    <span style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 10, background: c.subtle, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: c.textSoft }}>{app.company.charAt(0).toUpperCase()}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.company}</span>
                      <span style={{ display: 'block', fontSize: 13, color: c.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.role} · {relativeDate(app.date_applied)}</span>
                    </span>
                    <StatusBadge status={app.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="table-scroll" style={{ overflowX: 'auto' }}>
              <div role="table" style={{ minWidth: 860 }}>
                <div role="row" style={{ display: 'grid', gridTemplateColumns: cols, gap: 16, padding: '12px 20px', background: c.subtle, borderBottom: `1px solid ${c.border}`, borderTop: `1px solid ${c.border}`, fontSize: 12, fontWeight: 600, color: c.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {['Company', 'Role', 'Status', 'Applied', 'Salary', ''].map((h, i) => <div key={i} role="columnheader">{h}</div>)}
                </div>
                {filtered.map(app => (
                  <div
                    key={app.id}
                    role="row"
                    className="row-hover"
                    onClick={() => navigate(`/application/${app.id}`)}
                    style={{ display: 'grid', gridTemplateColumns: cols, gap: 16, padding: '0 20px', minHeight: 60, alignItems: 'center', borderBottom: `1px solid ${c.border}`, fontSize: 14, cursor: 'pointer' }}
                  >
                    <div role="cell" style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <span style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 9, background: c.subtle, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: c.textSoft }}>{app.company.charAt(0).toUpperCase()}</span>
                      <Link to={`/application/${app.id}`} onClick={e => e.stopPropagation()} style={{ fontWeight: 600, color: c.text, textDecoration: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.company}</Link>
                    </div>
                    <div role="cell" style={{ color: c.textSoft, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.role}</div>
                    <div role="cell"><StatusBadge status={app.status} /></div>
                    <div role="cell" title={fullDate(app.date_applied)} style={{ color: c.textSoft, whiteSpace: 'nowrap' }}>{relativeDate(app.date_applied)}</div>
                    <div role="cell" style={{ color: c.textSoft, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{formatSalary(app.salary_min, app.salary_max)}</div>
                    <div role="cell" style={{ textAlign: 'right' }}>
                      <button
                        onClick={e => { e.stopPropagation(); setDeleteTarget(app) }}
                        aria-label={`Delete ${app.company}`}
                        style={{ height: 36, padding: '0 12px', border: `1px solid ${c.borderStrong}`, background: 'transparent', color: c.muted, borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ padding: '12px 20px', fontSize: 13, color: c.muted, borderTop: isMobile ? `1px solid ${c.border}` : 'none' }}>
            Showing {filtered.length} of {applications.length}
          </div>
        </section>
      </main>

      {showModal && (
        <AddModal
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchAll() }}
          existing={null}
        />
      )}

      {deleteTarget && (
        <DeleteDialog app={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
      )}
    </div>
  )
}
