export function SimBanner({ name }: { name: string }) {
  return (
    <div role="note" className="sticky top-0 bg-yellow-300 text-black text-center text-sm font-semibold py-1">
      SIMULATED SCREEN. Not the real {name}.
    </div>
  )
}
