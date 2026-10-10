import { Link, Navigate, useParams } from 'react-router-dom'
import { Shell } from '../components/Shell'
import { JOBS, LIVE_JOB } from '../lib'

export default function JobDetail() {
  const { id } = useParams()
  const job = JOBS.find((j) => j.id === id)
  if (!job) return <Navigate to="/jobs" replace />
  if (job.id === LIVE_JOB) return <Navigate to="/job" replace />
  return (
    <Shell>
      <p><Link className="nm-link" to="/jobs">Back to roles</Link></p>
      <div className="nm-head">
        <div className="nm-co">{job.company[0]}</div>
        <div><h1>{job.title} <span className="chip">sample</span></h1><div className="muted">{job.company} · {job.place}</div></div>
      </div>
      <div className="nm-card"><h2>About the role</h2><p>{job.blurb}</p>
        <p className="muted">Sample listing. Candidate search is only available for the Junior Data Analyst role in this demo.</p>
        <Link className="nm-btn" to="/job">See Junior Data Analyst candidates</Link></div>
    </Shell>
  )
}
