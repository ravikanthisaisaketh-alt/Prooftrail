import type { ReactNode } from 'react'
import { NYERAS_URL, useLearner } from '../lib/api'

export function Layout({ children }: { children: ReactNode }) {
  const l = useLearner()
  const q = l ? `?learner=${l}` : ''
  return (
    <>
      <header className="pt-header">
        <div className="pt-wrap">
          <div className="pt-brand"><h1>ProofTrail</h1><p>Real skill evidence</p></div>
          <nav className="pt-nav" aria-label="ProofTrail">
            <a href={`${NYERAS_URL}/profile`}>Nyeras</a>
            <a href={`/start${q}`}>Attempt</a>
            <a href={`/profile${q}`}>Profile</a>
            <a href={`/consent${q}`}>Consent</a>
            <a href="/verify">Verify</a>
            <a href="/challenge">Attack the Grader</a>
            <a href="/review">Review</a>
            <a href="/audit">Audit</a>
            <a href="/quality">Quality</a>
          </nav>
        </div>
      </header>
      <div className="pt-wrap pt-main">{children}</div>
    </>
  )
}
