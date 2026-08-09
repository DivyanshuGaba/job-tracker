import { useState, useEffect } from 'react'

/**
 * Tracks whether the viewport is at or below a breakpoint.
 *
 * The app styles components with inline style objects rather than CSS classes,
 * so CSS media queries have nothing to target. This hook exposes the same
 * breakpoint information to JavaScript, letting each component pick mobile or
 * desktop values inline.
 *
 * Uses matchMedia rather than a resize listener, so it fires only when the
 * breakpoint is actually crossed instead of on every pixel of a resize.
 */
export default function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
  )

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const handler = e => setIsMobile(e.matches)

    setIsMobile(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [breakpoint])

  return isMobile
}