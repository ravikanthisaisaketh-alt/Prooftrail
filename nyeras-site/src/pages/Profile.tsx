import { useEffect, useState } from 'react'
import { SimBanner } from '../components/SimBanner'
import { learner } from '../seed'
import { API, proveUrl } from '../lib'

type Summary = {
  verified: boolean; shared_with_nxtmove: boolean; date?: string; receipt_id?: string
  skills: { skill: string; level: string; status: string }[]
}

export default function Profile() {
  const [s, setS] = useState<Summary | null>(null)
  const [down, setDown] = useState(false)
  useEffect(() => {
    fetch(`${API}/profile/${learner.id}/summary`).then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setS).catch(() => setDown(true))
  }, [])
  async function resetDemo() {
    await fetch(`${API}/dev/reset/${learner.id}`, { method: 'POST' }).catch(() => {})
    window.location.reload()
  }
  return (
    <div>
      <SimBanner name="Nyeras" />
      <main className="mx-auto max-w-xl p-6 space-y-4">
        <p className="text-sm text-gray-600">Learning platform (simulated) · {learner.label}</p>
        <h1 className="text-2xl font-bold">My profile</h1>
        <p><a className="underline" href="/course">Course page</a></p>
        <section className="rounded border p-4 space-y-2" aria-label="Latest result">
          <h2 className="font-semibold">Latest result</h2>
          {down && <p>Result unavailable right now.</p>}
          {s && !s.verified && <p>Not yet verified</p>}
          {s?.verified && <>
            {s.skills.map((k) => <p key={k.skill}>{k.skill}: <b>{k.level}</b> · {k.status}</p>)}
            <p>Date: {s.date} · Receipt {s.receipt_id}</p>
            <p>Shared with NxtMove: <b>{s.shared_with_nxtmove ? 'Yes' : 'No'}</b></p>
          </>}
          <a className="inline-block rounded bg-black px-4 py-2 text-white" href={proveUrl}>Prove your skill</a>
          <p className="text-xs text-gray-600">ProofTrail is the real prototype. This page is simulated.</p>
          <button className="text-xs underline" onClick={resetDemo}>Reset demo (clears {learner.id})</button>
        </section>
      </main>
    </div>
  )
}
