import { Shell } from '../components/Shell'
import { course } from '../seed'
import { proveUrl } from '../lib'

export default function Course() {
  return (
    <Shell page="course" title={course.title} subtitle="Course completed">
      <section className="ny-card">
        <div className="row" style={{ justifyContent: 'space-between' }}><b>Progress 100%</b><span className="chip ok">Course completed</span></div>
        <div className="progress" style={{ margin: '10px 0 16px' }}><span /></div>
        <ul className="mods">
          {course.modules.map((m, i) => <li key={m} style={{ animationDelay: `${i * 120}ms` }}><span className="tick">✓</span>{m}</li>)}
        </ul>
        <p className="muted" style={{ marginTop: 14 }}>A completion badge shows you finished the lessons. It does not show what you can do.</p>
      </section>
      <section className="ny-card">
        <h2>Prove your skill</h2>
        <p>Try a short, realistic task. You get feedback on each criterion, and you choose who sees the result.</p>
        <a className="ny-btn" href={proveUrl}>Start a ProofTrail task</a>
        <p className="muted" style={{ marginTop: 10 }}>ProofTrail is the real prototype. This page is simulated.</p>
      </section>
    </Shell>
  )
}
