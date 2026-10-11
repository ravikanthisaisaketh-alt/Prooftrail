import type { ReactNode } from 'react'
import { SimBanner } from './SimBanner'
import { useAuth } from './Auth'

export function Shell({ page, title, subtitle, steps, children }: { page: 'courses' | 'profile'; title: string; subtitle: string; steps?: string[]; children: ReactNode }) {
  const { user, logout } = useAuth()
  return (
    <div>
      <SimBanner name="Nyeras" />
      <header className="ny-top"><div className="ny-wrap">
        <span className="ny-logo">Nyeras <span className="muted">Learning platform · simulated</span></span>
        <nav className="ny-nav" aria-label="Main">
          <a href="/courses" aria-current={page === 'courses' ? 'page' : undefined}>Courses</a>
          <a href="/profile" aria-current={page === 'profile' ? 'page' : undefined}>My profile</a>
          <span className="chip blue" title={`Signed in as ${user.learner}`}>{user.name}</span>
          <button className="ny-link" onClick={logout} style={{ minHeight: 36, padding: '0 8px' }}>Log out</button>
        </nav>
      </div></header>
      <section className="ny-hero"><div className="ny-wrap"><p>Simulated learning platform</p><h1>{title}</h1><p>{subtitle}</p>{steps && <ol className="steps" aria-label="Your path">{steps.map((s, i) => <li key={s}>{i + 1}. {s}</li>)}</ol>}</div></section>
      <main className="ny-wrap ny-main">{children}</main>
    </div>
  )
}
