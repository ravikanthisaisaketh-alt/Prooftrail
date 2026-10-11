// Shared motion language. Short, ease-out, and skipped for people who ask for less motion
// (the app is wrapped in <MotionConfig reducedMotion="user">).
export const time = { fast: 0.18, base: 0.28, page: 0.28 } as const
export const ease = [0.22, 1, 0.36, 1] as const

export const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: time.base, ease } },
}
export const fade = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: time.fast, ease } },
}
export const pop = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: time.base, ease } },
}
// Parent that staggers its children. Keep gap * count under about 0.5s.
export const stagger = (gap = 0.04, delay = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren: Math.min(gap, 0.04), delayChildren: delay } },
})
export const page = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: time.page, ease } },
  exit: { opacity: 0, y: -4, transition: { duration: time.fast, ease } },
}
