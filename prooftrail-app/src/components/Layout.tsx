import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { NYERAS_URL } from '../lib/api'

const GROUPS: { label: string; links: [string, string][] }[] = [
  { label: 'Learner', links: [['/start', 'Attempt'], ['/profile', 'Profile'], ['/consent', 'Consent']] },
  { label: 'Reviewer', links: [['/review', 'Review']] },
  { label: 'Trust', links: [['/verify', 'Verify'], ['/audit', 'Audit'], ['/quality', 'Doubt panel']] },
]

function TrustMenu({ links, active }: { links: [string, string][]; active: boolean }) {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const panel = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const close = () => {
    setClosing(true)
    timer.current = setTimeout(() => { setOpen(false); setClosing(false); trigger.current?.focus() }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 160)
  }
  useEffect(() => {
    if (!open) return
    panel.current?.querySelector<HTMLAnchorElement>('a')?.focus()
    const outside = (e: PointerEvent) => { if (!panel.current?.contains(e.target as Node) && !trigger.current?.contains(e.target as Node)) close() }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  return <div className="trust-menu">
    <button ref={trigger} className="navlink" aria-expanded={open} aria-controls="trust-links" data-active={active} onClick={() => open ? close() : setOpen(true)}>Trust <span aria-hidden="true">⌄</span></button>
    {open && <div ref={panel} id="trust-links" className={`trust-panel ${closing ? 'closing' : ''}`} onKeyDown={(e) => {
      const links = Array.from(panel.current?.querySelectorAll<HTMLAnchorElement>('a') ?? [])
      if (e.key === 'Escape') { e.preventDefault(); close() }
      if (['Tab', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
        e.preventDefault()
        const index = links.indexOf(document.activeElement as HTMLAnchorElement)
        const next = e.key === 'Home' ? 0 : e.key === 'End' ? links.length - 1 : (index + (e.key === 'ArrowUp' || e.shiftKey ? -1 : 1) + links.length) % links.length
        links[next]?.focus()
      }
    }}>{links.map(([to, label]) => <Link key={to} to={to} className="navlink" onClick={close}>{label}</Link>)}</div>}
  </div>
}

// Persistent top bar. The orange pill slides between tabs because it keeps its layoutId across pages.
export function AppShell() {
  const { pathname } = useLocation()
  const on = (p: string) => pathname === p || pathname.startsWith(p + '/')
  return (
    <header className="pt-header">
      <div className="pt-wrap">
        <Link to="/start" className="pt-brand" aria-label="ProofTrail home"><span className="brand-name">ProofTrail</span><p>Real skill evidence</p></Link>
        <nav className="pt-nav" aria-label="ProofTrail">
          {GROUPS.map((g) => g.label === 'Trust' ? <TrustMenu key={g.label} links={g.links} active={g.links.some(([p]) => on(p))} /> : (
            <div className="navgroup" role="group" aria-label={g.label} key={g.label}>
              <span className="navlabel">{g.label}</span>
              {g.links.map(([to, name]) => (
                <Link key={to} to={to} className="navlink" aria-current={on(to) ? 'page' : undefined}>
                  {on(to) && <span className="pill" />}
                  <span>{name}</span>
                </Link>
              ))}
            </div>
          ))}
          <Link to="/challenge" className="demo-btn" aria-current={on('/challenge') ? 'page' : undefined} title="Live demo: try to trick the grader">⚡ Attack the Grader</Link>
          <a className="navlink" href={`${NYERAS_URL}/profile`}><span>Nyeras ↗</span></a>
        </nav>
      </div>
    </header>
  )
}

// One page: title, one-line description, content. Fades in with an 8px slide.
export function Layout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="pt-wrap pt-main">
      <div className="pt-title"><h1>{title}</h1><p>{subtitle}</p></div>
      {children}
    </main>
  )
}
