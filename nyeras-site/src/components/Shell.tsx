import type { ReactNode } from 'react'
import { SimBanner } from './SimBanner'
import { learner } from '../seed'

export function Shell({ page, title, subtitle, children }: { page: 'course' | 'profile'; title: string; subtitle: string; children: ReactNode }) {
  return (
    <div>
      <SimBanner name="Nyeras" />
      <header className="ny-top"><div className="ny-wrap">
        <span className="ny-logo">Learning platform <span className="muted">(simulated)</span></span>
        <nav className="ny-nav" aria-label="Main">
          <a href="/course" aria-current={page === 'course' ? 'page' : undefined}>Course</a>
          <a href="/profile" aria-current={page === 'profile' ? 'page' : undefined}>My profile</a>
          <span className="chip blue">{learner.label}</span>
        </nav>
      </div></header>
      <section className="ny-hero"><div className="ny-wrap"><p>Simulated learning platform</p><h1>{title}</h1><p>{subtitle}</p></div></section>
      <main className="ny-wrap ny-main">{children}</main>
    </div>
  )
}
