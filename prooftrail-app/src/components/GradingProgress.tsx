import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ease, time } from '../motion'

export type AiState = 'agree' | 'differ' | 'off' | 'skipped'
type Props = { done: boolean; ai: AiState; status?: string }

const STEPS = ['Hidden tests', 'Data check', 'AI check run 1/3', 'AI check run 2/3', 'AI check run 3/3', 'Routing'] as const
const GAP = 40            // ms between steps completing once the answer is in (6 steps: about 0.5s)

// Vertical stepper. While the server works, the first step spins. When the answer arrives, steps complete in a quick cascade.
export function GradingProgress({ done, ai, status }: Props) {
  const [finished, setFinished] = useState(0)
  const reduce = useReducedMotion()
  useEffect(() => {
    if (!done) { setFinished(0); return }
    if (reduce) { setFinished(STEPS.length); return }     // no cascade for people who ask for less motion
    let n = 0
    const id = setInterval(() => { n += 1; setFinished(n); if (n >= STEPS.length) clearInterval(id) }, GAP)
    return () => clearInterval(id)
  }, [done])

  const dotClass = ai === 'agree' ? 'g' : ai === 'differ' ? 'a' : ''
  const aiNote = ai === 'agree' ? 'run agreed' : ai === 'differ' ? 'runs did not all agree' : ai === 'off' ? 'AI unavailable: Pending' : 'skipped: answer too short'

  return (
    <section className="card" aria-label="Grading progress" aria-live="polite">
      <h2>{done && finished >= STEPS.length ? 'How this was graded' : 'Checking your answer, 3 reviews running'}</h2>
      {STEPS.map((name, i) => {
        const isAi = i >= 2 && i <= 4
        const complete = i < finished
        const running = !complete && i === finished && (!done || finished < STEPS.length)
        const skipped = complete && isAi && (ai === 'off' || ai === 'skipped')
        return (
          <div className="gstep" key={name}>
            <span className={`gdot ${complete ? (skipped ? 'skipped' : 'done') : running ? 'running' : ''}`} aria-hidden="true">
              <AnimatePresence mode="wait" initial={false}>
                {complete ? (
                  <motion.svg key="c" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <motion.path d={skipped ? 'M3 7h8' : 'M2.5 7.5l3 3 6-7'} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: time.fast, ease }} />
                  </motion.svg>
                ) : running ? <span key="r" className="working-dot" /> : <span key="n">{i + 1}</span>}
              </AnimatePresence>
            </span>
            <div>
              <b>{name}</b>
              {isAi && complete && <>
                <span className="dots" aria-hidden="true"><motion.i className={dotClass} initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ duration: time.fast, ease }} /></span>
                <span className="muted"> {aiNote}</span>
              </>}
              {i === 5 && complete && status && <span className="muted"> {status === 'Evidenced' ? 'Result is automatic.' : status === 'Needs human review' ? 'A person will look at this.' : status}</span>}
            </div>
          </div>
        )
      })}
      {done && finished >= STEPS.length && ai === 'differ' && <p className="chip warn" role="status">Needs human review: the three AI runs did not all agree.</p>}
      {done && finished >= STEPS.length && ai === 'agree' && <p className="chip ok" role="status">3 of 3 runs agreed.</p>}
    </section>
  )
}
