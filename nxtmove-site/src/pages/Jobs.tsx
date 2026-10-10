import { Link } from 'react-router-dom'
import { Shell } from '../components/Shell'
import { JOBS, LIVE_JOB } from '../lib'

export default function Jobs() {
  return (
    <Shell>
      <h1 style={{ margin: 0 }}>Open roles</h1>
      <p className="muted" style={{ margin: 0 }}>All roles are sample data. Candidates are available for the Junior Data Analyst role only.</p>
      {JOBS.map((j, i) => (
        <Link key={j.id} to={`/jobs/${j.id}`} className="nm-card hover" style={{ color: 'inherit', textDecoration: 'none', animationDelay: `${i * 80}ms` }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h2>{j.title}</h2>
            <span className="row"><span className="chip">sample</span>{j.id === LIVE_JOB && <span className="chip or">Candidates available</span>}</span>
          </div>
          <p className="muted">{j.company} · {j.place}</p>
          <p>{j.blurb}</p>
        </Link>
      ))}
    </Shell>
  )
}
