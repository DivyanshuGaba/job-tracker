import { useEffect, useState } from 'react'
import { ThemeContext } from './themeContext'

const LIGHT = {
  bg: '#F4F5F7', surface: '#FFFFFF', subtle: '#F9FAFB', hover: '#F9FAFB',
  border: '#E4E7EC', borderStrong: '#D0D5DD', inputBg: '#FFFFFF',
  text: '#101828', textSoft: '#344054', muted: '#475467', faint: '#667085',
  primary: '#3538CD', onPrimary: '#FFFFFF', accentSoft: '#EEF0FF', accentText: '#2A2DA8', link: '#3538CD',
  overlay: 'rgba(16,24,40,0.55)', shadow: '0 24px 48px rgba(16,24,40,0.25)',
  danger: '#B42318', dangerBorder: '#D92D20', dangerSoft: '#FEF3F2', dangerLine: '#FECDCA',
  warnBg: '#FFF6ED', warnFg: '#93370D', warnLine: '#FDDCAB',
  chartBar: '#C7D0F8', chartBarNow: '#3538CD',
}

const DARK = {
  bg: '#000000', surface: '#0d0d0d', subtle: '#0a0a0a', hover: '#141414',
  border: '#1e1e1e', borderStrong: '#2e2e2e', inputBg: '#0d0d0d',
  text: '#FFFFFF', textSoft: '#D4D4D4', muted: '#A3A3A3', faint: '#8A8A8A',
  primary: '#FFFFFF', onPrimary: '#000000', accentSoft: '#1a1a1a', accentText: '#FFFFFF', link: '#E5E5E5',
  overlay: 'rgba(0,0,0,0.88)', shadow: 'none',
  danger: '#F97066', dangerBorder: '#F97066', dangerSoft: '#2a0e0b', dangerLine: '#5c1a14',
  warnBg: '#2a1a05', warnFg: '#FDB022', warnLine: '#5c3a0a',
  chartBar: '#3a3a3a', chartBarNow: '#FFFFFF',
}

const TONES = {
  light: {
    'Applied':      { fg: '#344054', bg: '#F2F4F7', dot: '#667085' },
    'Phone Screen': { fg: '#1849A9', bg: '#EFF4FF', dot: '#2E90FA' },
    'Interview':    { fg: '#93370D', bg: '#FFF6ED', dot: '#F79009' },
    'Offer':        { fg: '#05603A', bg: '#ECFDF3', dot: '#12B76A' },
    'Rejected':     { fg: '#B42318', bg: '#FEF3F2', dot: '#F04438' },
  },
  dark: {
    'Applied':      { fg: '#D4D4D4', bg: '#1a1a1a', dot: '#8A8A8A' },
    'Phone Screen': { fg: '#84CAFF', bg: '#0b1b2e', dot: '#2E90FA' },
    'Interview':    { fg: '#FDB022', bg: '#2a1a05', dot: '#F79009' },
    'Offer':        { fg: '#47CD89', bg: '#05200f', dot: '#12B76A' },
    'Rejected':     { fg: '#F97066', bg: '#2a0e0b', dot: '#F04438' },
  },
}

function readStored() {
  try { return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light' } catch { return 'light' }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readStored)
  const c = theme === 'dark' ? DARK : LIGHT

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme
    root.style.background = c.bg
    root.style.colorScheme = theme
    root.style.setProperty('--row-hover', c.hover)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', c.bg)
    try { localStorage.setItem('theme', theme) } catch { /* storage blocked, theme just will not persist */ }
  }, [theme, c])

  const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))
  const tone = status => TONES[theme][status] || TONES[theme]['Applied']

  return <ThemeContext.Provider value={{ theme, c, toggle, tone }}>{children}</ThemeContext.Provider>
}
