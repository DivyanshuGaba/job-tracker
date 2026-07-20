import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'

const STATUS_COLORS = {
  'Applied':      'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Phone Screen': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'Interview':    'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Offer':        'bg-green-500/10 text-green-400 border-green-500/20',
  'Rejected':     'bg-red-500/10 text-red-400 border-red-500/20',
}

const STATUSES = ['Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected']

export default function Dashboard() {
  const [applications, setApplications] = useState([])
  const [stats, setStats]               = useState(null)
  const [loading, setLoading]           = useState(true)
  const [showModal, setShowModal]       = useState(false)
  const [filterStatus, setFilterStatus] = useState('All')
  const navigate = useNavigate()

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    try {
      const [appsRes, statsRes] = await Promise.all([
        client.get('/applications/'),
        client.get('/applications/stats/summary'),
      ])
      setApplications(appsRes.data)
      setStats(statsRes.data)
    } catch {
      // token expired — redirect to login
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <h1 className="font-bold text-lg tracking-tight">Job Tracker</h1>
        <button
          onClick={logout}
          className="text-sm text-gray-500 hover:text-white transition-colors"
        >
          Sign out
        </button>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Stat cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Applied"    value={stats.total} />
            <StatCard label="Response Rate"    value={`${stats.response_rate}%`} />
            <StatCard label="Interview Rate"   value={`${stats.interview_rate}%`} />
            <StatCard label="Offer Rate"       value={`${stats.offer_rate}%`} />
          </div>
        )}

        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            {['All', ...STATUSES].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  filterStatus === s
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Add Application
          </button>
        </div>

        {/* Applications table */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-600">
            {applications.length === 0
              ? 'No applications yet — add your first one'
              : `No applications with status "${filterStatus}"`}
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Company</th>
                  <th className="text-left px-5 py-3">Role</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Date Applied</th>
                  <th className="text-left px-5 py-3">Salary</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app, i) => (
                  <tr
                    key={app.id}
                    className={`border-b border-gray-800/50 hover:bg-gray-800/40 transition-colors ${
                      i === filtered.length - 1 ? 'border-b-0' : ''
                    }`}
                  >
                    <td className="px-5 py-3.5 font-medium text-white">{app.company}</td>
                    <td className="px-5 py-3.5 text-gray-400">{app.role}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full border ${STATUS_COLORS[app.status] || 'bg-gray-700 text-gray-300'}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400">{app.date_applied}</td>
                    <td className="px-5 py-3.5 text-gray-400">
                      {app.salary_min && app.salary_max
                        ? `£${app.salary_min.toLocaleString()} – £${app.salary_max.toLocaleString()}`
                        : app.salary_min
                        ? `From £${app.salary_min.toLocaleString()}`
                        : 'Not specified'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Application Modal */}
      {showModal && (
        <AddModal
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchAll(); }}
        />
      )}
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
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

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    if (!form.company || !form.role) { setError('Company and role are required'); return; }
    setLoading(true)
    setError('')
    try {
      await client.post('/applications/', {
        ...form,
        salary_min: form.salary_min ? parseInt(form.salary_min) : null,
        salary_max: form.salary_max ? parseInt(form.salary_max) : null,
      })
      onSave()
    } catch {
      setError('Failed to save application')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-semibold text-white">Add Application</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Company *" value={form.company} onChange={v => update('company', v)} placeholder="Google" />
            <Field label="Role *" value={form.role} onChange={v => update('role', v)} placeholder="Software Engineer" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={e => update('status', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <Field label="Date Applied" type="date" value={form.date_applied} onChange={v => update('date_applied', v)} />
          </div>

          <Field label="Job URL" value={form.job_url} onChange={v => update('job_url', v)} placeholder="https://..." />

          <div className="grid grid-cols-2 gap-4">
            <Field label="Min Salary (£)" type="number" value={form.salary_min} onChange={v => update('salary_min', v)} placeholder="40000" />
            <Field label="Max Salary (£)" type="number" value={form.salary_max} onChange={v => update('salary_max', v)} placeholder="60000" />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => update('notes', e.target.value)}
              rows={3}
              placeholder="Any notes about this application..."
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 placeholder-gray-600 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-700 text-gray-400 hover:text-white rounded-lg py-2 text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 placeholder-gray-600"
      />
    </div>
  )
}