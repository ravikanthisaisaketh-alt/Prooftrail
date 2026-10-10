import { useEffect, useRef, useState } from 'react'
import { api } from './api'

// Focus mode only. Open, never blocks, never changes a level. Counts and seconds only: no keystrokes.
export function useFocusLog(attemptId: number | null, enabled: boolean) {
  const [leaves, setLeaves] = useState(0)
  const [pastes, setPastes] = useState(0)
  const leftAt = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled || attemptId === null) return
    const onVisibility = () => {
      if (document.hidden) {
        leftAt.current = Date.now()
      } else if (leftAt.current) {
        const seconds = Math.round((Date.now() - leftAt.current) / 1000)
        leftAt.current = null
        setLeaves((n) => n + 1)
        api.sendSignal(attemptId, 'tab_leave', seconds).catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [attemptId, enabled])

  // Call this from the editor's paste handler. Only large pastes (over 200 characters) are logged.
  const onPaste = (text: string, note?: string) => {
    if (!enabled || attemptId === null || text.length < 200) return
    setPastes((n) => n + 1)
    api.sendSignal(attemptId, 'large_paste', text.length, note ?? '').catch(() => {})
  }
  return { leaves, pastes, onPaste }
}
