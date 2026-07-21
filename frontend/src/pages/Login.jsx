import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import client from '../api/client'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await client.post('/auth/login', { email, password })
      localStorage.setItem('token', res.data.access_token)
      navigate('/')
    } catch {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', background: '#0d0d0d',
    border: '1px solid #1e1e1e', color: '#fff',
    borderRadius: 3, padding: '10px 12px', fontSize: 13,
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }

  const labelStyle = {
    display: 'block', fontFamily: 'monospace', fontSize: 9,
    color: 'rgba(255,255,255,0.35)', letterSpacing: '0.16em',
    textTransform: 'uppercase', marginBottom: 6,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#090909', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: '#fff', marginBottom: 8 }}>JOB TRACKER</div>
          <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Sign in to your account</div>
        </div>

        <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 6, padding: '28px 24px' }}>

          {error && (
            <div style={{ border: '1px solid #2a1515', background: '#110a0a', color: 'rgba(255,100,100,0.8)', fontFamily: 'monospace', fontSize: 9, padding: '9px 12px', borderRadius: 3, marginBottom: 20, letterSpacing: '0.08em' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={{ ...inputStyle, '::placeholder': { color: 'rgba(255,255,255,0.18)' } }}
              />
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                fontFamily: 'monospace', fontSize: 9, fontWeight: 700,
                letterSpacing: '0.16em', textTransform: 'uppercase',
                padding: '11px', border: '1px solid #fff',
                background: '#fff', color: '#000', borderRadius: 3,
                cursor: 'pointer', marginTop: 4,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div style={{ height: 1, background: '#141414', margin: '20px 0' }} />

          <p style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em' }}>
            No account?{' '}
            <Link to="/register" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none', letterSpacing: '0.1em' }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}