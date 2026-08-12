import { useCallback, useEffect, useState } from 'react'

export function useIdleHints(total: number, active: boolean, resetKey: string, idleMs = 10_000) {
  const [revealed, setRevealed] = useState(0)
  const [activity, setActivity] = useState(0)
  const [hidden, setHidden] = useState(() => document.hidden)

  useEffect(() => {
    setRevealed(0)
    setActivity(0)
  }, [resetKey])

  useEffect(() => {
    const onVisibilityChange = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  useEffect(() => {
    if (!active || hidden || revealed >= total) return
    const timer = window.setTimeout(() => setRevealed((count) => count + 1), idleMs)
    return () => window.clearTimeout(timer)
  }, [active, hidden, revealed, total, activity, idleMs])

  const noteActivity = useCallback(() => setActivity((count) => count + 1), [])
  const revealNext = useCallback(() => setRevealed((count) => Math.min(count + 1, total)), [total])

  return { revealed, noteActivity, revealNext }
}
