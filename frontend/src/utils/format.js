export function parseDate(str) {
  const [y, m, d] = String(str).split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function fullDate(str) {
  return parseDate(str).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function daysSince(str) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((today - parseDate(str)) / 86400000)
}

export function relativeDate(str) {
  const n = daysSince(str)
  if (n < 0 || n > 30) return fullDate(str)
  if (n === 0) return 'Today'
  if (n === 1) return 'Yesterday'
  return `${n} days ago`
}

export function formatSalary(min, max) {
  if (min && max) return `£${min.toLocaleString()} – £${max.toLocaleString()}`
  if (min) return `£${min.toLocaleString()}+`
  return '—'
}

export function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}
