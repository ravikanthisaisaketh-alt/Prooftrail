import { SimBanner } from '../components/SimBanner'
import { course, learner } from '../seed'
import { proveUrl } from '../lib'

export default function Course() {
  return (
    <div>
      <SimBanner name="Nyeras" />
      <main className="mx-auto max-w-xl p-6 space-y-4">
        <p className="text-sm text-gray-600">Learning platform (simulated) · {learner.label} · <a className="underline" href="/profile">My profile</a></p>
        <h1 className="text-2xl font-bold">{course.title}</h1>
        <div className="rounded bg-green-100 p-2">Progress 100% · Course completed</div>
        <ul className="list-disc pl-6">{course.modules.map((m) => <li key={m}>✓ {m}</li>)}</ul>
        <p className="text-sm">A completion badge shows you finished the lessons. It does not show what you can do.</p>
        <section className="rounded border p-4 space-y-2">
          <h2 className="font-semibold">Prove your skill</h2>
          <p>Try a short, realistic task. You get feedback on each criterion, and you choose who sees the result.</p>
          <a className="inline-block rounded bg-black px-4 py-2 text-white"
             href={proveUrl}>Start a ProofTrail task</a>
          <p className="text-xs text-gray-600">ProofTrail is the real prototype. This page is simulated.</p>
        </section>
      </main>
    </div>
  )
}
