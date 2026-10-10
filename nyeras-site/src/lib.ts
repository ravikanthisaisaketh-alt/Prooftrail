export const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
export const PROOFTRAIL = import.meta.env.VITE_PROOFTRAIL_URL ?? 'http://localhost:5174'
export const NYERAS = import.meta.env.VITE_NYERAS_URL ?? 'http://localhost:5173'
export const LEARNER_ID = import.meta.env.VITE_LEARNER_ID ?? 'L-001'
export const proveUrl = `${PROOFTRAIL}/start?learner=${LEARNER_ID}&source=nyeras-mock&return=${encodeURIComponent(`${NYERAS}/profile`)}`
