
export type Criterion = { id: string; name: string; what: string }
const AI_IDS = new Set(['C3', 'C5'])

// Rubric as cards that stagger in. C3 and C5 carry an "AI assisted" tag; the others are decided by tests.
export function RubricCards({ criteria }: { criteria: Criterion[] }) {
  return (
    <div className="rubric-grid" aria-label="Rubric">
      {criteria.map((c, i) => (
        <div key={c.id} className="rcard" style={{ animationDelay: `${i * 40}ms` }}>
          <span className="id">{c.id}</span>
          <b>{c.name}</b>
          <span className="muted">{c.what.replace(' (AI assisted)', '')}</span>
          {AI_IDS.has(c.id) ? <span className="chip ai" title="An AI model checks this criterion, three times. A person decides if the runs disagree.">AI assisted</span>
            : <span className="chip pending" title="Decided by automatic tests, not by AI.">Tests decide</span>}
        </div>
      ))}
    </div>
  )
}
