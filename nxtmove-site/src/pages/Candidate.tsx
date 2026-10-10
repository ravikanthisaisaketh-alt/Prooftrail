import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { SimBanner } from '../components/SimBanner'
import { EvidenceDrawer, type Receipt } from '../components/EvidenceDrawer'
import { API } from '../lib'

type Skill = { skill: string; level: string; status: string; confidence: string; last_attempt: string; mode: string }

export default function Candidate() {
  const { learner = '' } = useParams()
  const [skills, setSkills] = useState<Skill[] | null>(null)
  const [error, setError] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [rError, setRError] = useState('')

  // Consent is re-checked by the back end on every request. No consent means no profile.
  useEffect(() => {
    fetch(`${API}/candidates?min_level=Not%20yet`).then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setSkills(d.candidates.find((c: { learner: string }) => c.learner === learner)?.skills ?? []))
      .catch(() => setError('Candidate data unavailable.'))
  }, [learner])

  useEffect(() => {
    setReceipt(null); setRError('')
    if (!open) return
    fetch(`${API}/candidates/${learner}/receipt?skill=${encodeURIComponent(open)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setReceipt).catch(() => setRError('Receipt not available. The learner may have turned sharing off.'))
  }, [open, learner])

  return (
    <div>
      <SimBanner name="NxtMove" />
      <main className="mx-auto max-w-2xl p-6 space-y-4">
        <p><Link className="underline" to="/job">Back to candidates</Link></p>
        <h1 className="text-2xl font-bold">Candidate {learner}</h1>
        <p className="text-xs">Experimental scores. Not validated hiring predictors. AI assisted some criteria.</p>
        {error && <p role="alert">{error}</p>}
        {skills && skills.length === 0 && <p>This profile is not available. The learner has not shared it, or has turned sharing off.</p>}
        {skills?.map((s) => (
          <p key={s.skill}>
            <button className="underline" onClick={() => setOpen(s.skill)}>{s.skill}</button>
            : {s.level}, {s.status}, confidence {s.confidence}, last attempt {s.last_attempt}, conditions {s.mode}
          </p>
        ))}
        {open && <EvidenceDrawer receipt={receipt} error={rError} onClose={() => setOpen(null)} />}
      </main>
    </div>
  )
}
