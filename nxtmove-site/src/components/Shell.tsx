import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { SimBanner } from './SimBanner'

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div>
      <SimBanner name="NxtMove" />
      <header className="nm-top"><div className="nm-wrap">
        <span className="nm-logo">NxtMove <small>Recruiter portal · simulated</small></span>
        <nav className="nm-nav" aria-label="Main">
          <NavLink to="/jobs">Jobs</NavLink>
          <NavLink to="/job">Candidates</NavLink>
        </nav>
      </div></header>
      <main className="nm-wrap nm-main">{children}</main>
    </div>
  )
}
