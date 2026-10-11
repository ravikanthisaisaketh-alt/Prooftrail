export function Switch({ on, onChange, label, disabled = false }: { on: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return <button type="button" disabled={disabled} aria-busy={disabled} role="switch" aria-checked={on} aria-label={label} className="switch" onClick={() => onChange(!on)} />
}
