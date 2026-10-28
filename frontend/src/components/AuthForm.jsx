import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import client from '../api/client'
import useIsMobile from '../hooks/useIsMobile'
import { useTheme } from '../themeContext'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'

const COPY = {
  login: {
    title: 'Welcome back', sub: 'Sign in to see where your applications stand.',
    button: 'Sign in', busy: 'Signing in...', foot: 'New here?', link: 'Create an account', to: '/register',
    auto: 'current-password',
  },
  register: {
    title: 'Create your account', sub: 'Start tracking every application in one place.',
    button: 'Create account', busy: 'Creating account...', foot: 'Already have an account?', link: 'Sign in', to: '/login',
    auto: 'new-password',
  },
}

const POINTS = [
  'See which stage each application is in',
  'Spot who has not replied yet',
  'Keep notes and salary ranges together',
]

export default function AuthForm({ mode }) {
  const copy = COPY[mode]
  const { c, tone } = useTheme()
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'register') await client.post('/auth/register', { email, password })
      const res = await client.post('/auth/login', { email, password })
      localStorage.setItem('token', res.data.access_token)
      navigate('/')
    } catch (err) {
      setError(mode === 'register' ? (err.response?.data?.detail || 'Registration failed') : 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  /* fontSize 16 on mobile stops iOS Safari zooming the page when a field is focused */
  const inputStyle = {
    width: '100%', height: 46, padding: '0 14px', boxSizing: 'border-box',
    background: c.inputBg, color: c.text, border: `1px solid ${c.borderStrong}`,
    borderRadius: 10, fontSize: isMobile ? 16 : 15, fontFamily: 'inherit',
  }
  const labelStyle = { display: 'block', fontSize: 14, fontWeight: 500, color: c.textSoft, marginBottom: 6 }
  const offer = tone('Offer')

  return (
    <div className="min-h-screen-safe" style={{ position: 'relative', display: 'flex', background: c.surface, color: c.text }}>

      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 2 }}>
        <ThemeToggle />
      </div>

      <div style={{ flex: '1 1 420px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '72px 20px 32px' : '48px 32px', boxSizing: 'border-box' }}>
        <div style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 28 }}>
          <Logo />
          <div>
            <h1 style={{ margin: 0, fontSize: 28, lineHeight: '34px', fontWeight: 700, letterSpacing: '-0.02em' }}>{copy.title}</h1>
            <p style={{ margin: '8px 0 0', fontSize: 15, color: c.muted }}>{copy.sub}</p>
          </div>

          {error && (
            <div role="alert" style={{ border: `1px solid ${c.dangerLine}`, background: c.dangerSoft, color: c.danger, fontSize: 14, padding: '10px 12px', borderRadius: 10 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label htmlFor="email" style={labelStyle}>Email</label>
              <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" autoComplete="email" autoCapitalize="none" autoCorrect="off" style={inputStyle} />
            </div>
            <div>
              <label htmlFor="password" style={labelStyle}>Password</label>
              <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Enter your password" autoComplete={copy.auto} style={inputStyle} />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ height: 48, border: 'none', borderRadius: 10, background: c.primary, color: c.onPrimary, fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? copy.busy : copy.button}
            </button>
          </form>

          <p style={{ margin: 0, fontSize: 14, color: c.muted }}>
            {copy.foot}{' '}
            <Link to={copy.to} style={{ color: c.link, fontWeight: 600, textDecoration: 'none', padding: '4px 0' }}>{copy.link}</Link>
          </p>

        </div>
      </div>

      {!isMobile && (
        <div style={{ flex: '1 1 420px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 32px', boxSizing: 'border-box', background: c.accentSoft }}>
          <div style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <p style={{ margin: 0, fontSize: 22, lineHeight: '30px', fontWeight: 600, letterSpacing: '-0.01em', color: c.accentText }}>
              One place for every application, from the first email to the offer.
            </p>
            <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: c.subtle, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: c.textSoft }}>H</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Halcyon</div>
                  <div style={{ fontSize: 13, color: c.muted }}>Full Stack Engineer</div>
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, fontSize: 13, fontWeight: 600, background: offer.bg, color: offer.fg }}>
                  <span style={{ width: 8, height: 8, borderRadius: 4, background: offer.dot }} />Offer
                </span>
              </div>
              <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2 }}>
                {[['Applied', 4], ['Phone Screen', 2], ['Interview', 1], ['Offer', 1], ['Rejected', 1]].map(([s, n]) => (
                  <div key={s} style={{ flex: n, background: tone(s).dot }} />
                ))}
              </div>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, color: c.textSoft }}>
              {POINTS.map(p => (
                <li key={p} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.accentText} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
