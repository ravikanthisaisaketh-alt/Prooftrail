import { useEffect, useState } from 'react'
import { Shell } from '../components/Shell'
import { useAuth } from '../components/Auth'
import { api } from '../lib'
import { courses } from '../seed'

type Progress = Record<string, { done: number; total: number }>

export default function Courses() {
  const { user } = useAuth()
  const [p, setP] = useState<Progress | null>(null)
  const [down, setDown] = useState(false)
  const load = () => { setDown(false); api(`/learners/${user.learner}/progress`).then((r) => (r.ok ? r.json() : Promise.reject())).then((d) => setP(d.courses)).catch(() => setDown(true)) }
  useEffect(() => { load() }, [])
  return (
    <Shell page="courses" title="Courses" subtitle="Finish the lessons, then prove what you can do. Pick a course to continue.">
      {down && <div role="alert" className="alert"><p style={{ margin: 0 }}>We cannot reach the server right now.</p><button className="ny-btn" style={{ marginTop: 8 }} onClick={load}>Try again</button></div>}
      {!p && !down && <div className="course-skeletons" role="status" aria-label="Loading courses" aria-busy="true">{courses.map((c) => <div key={c.id} className="ny-card" aria-hidden="true"><div className="skel" style={{ width: '65%' }} /><div className="skel" /><div className="skel" style={{ width: '40%' }} /></div>)}</div>}
      {p && courses.map((c, i) => {
        const { done, total } = p[c.id] ?? { done: 0, total: c.lessons.length }
        const pct = Math.round((100 * done) / total)
        return (
          <article className="ny-card" key={c.id} style={{ animationDelay: `${i * 40}ms` }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h2>{c.title}</h2>
              <span className="row"><span className="chip blue">{c.level}</span><span className="chip">{total} lessons</span>{pct === 100 && <span className="chip ok">Completed</span>}</span>
            </div>
            <p className="muted">{c.blurb}</p>
            <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${c.title} progress`}><span style={{ width: `${pct}%` }} /></div>
            <div className="row" style={{ justifyContent: 'space-between', marginTop: 10 }}>
              <span>{done} of {total} lessons · {pct}%</span>
              <a className="ny-btn" href={`/course/${c.id}`}>{pct === 100 ? 'Open course' : pct === 0 ? 'Start' : 'Continue'}</a>
            </div>
          </article>
        )
      })}
    </Shell>
  )
}
