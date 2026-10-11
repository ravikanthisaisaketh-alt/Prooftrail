import { StatusChip } from './Ui'

export function CriterionChip({ value, delay = 0 }: { value: string; delay?: number }) {
  return <span className="criterion-chip" style={{ animationDelay: `${delay}ms` }}>
    {value === 'pass' ? <span className="chip ok">Met</span>
      : value.startsWith('Pending') ? <StatusChip value="Pending" />
      : <span className="chip warn" title="Not met yet. See the note for what to fix.">Not met yet</span>}
  </span>
}
