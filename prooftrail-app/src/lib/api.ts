// One place for every call to the back end. URLs come from .env, never hard-coded.
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail ?? `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

export type Mode = 'Open' | 'Focus'
export const api = {
  startAttempt: (learner: string, mode: Mode, tools: string) =>
    call<{ attempt_id: number; attempt_no: number }>('/attempts', {
      method: 'POST', body: JSON.stringify({ learner, mode, tools_declared: tools }) }),
  sendSignal: (id: number, event: 'tab_leave' | 'large_paste', value: number, note = '') =>
    call(`/attempts/${id}/signals`, { method: 'POST', body: JSON.stringify({ event, value, note }) }),
  submit: (id: number, code: string, text: string) =>
    call<Result>(`/attempts/${id}/submit`, { method: 'POST', body: JSON.stringify({ code, text }) }),
  profile: (learner: string) => call<{ skills: Skill[] }>(`/profile/${learner}`),
  consentState: (learner: string) =>
    call<{ on: boolean; history: { role: string; on_off: number; changed: string }[] }>(`/consent/${learner}/history`),
  verify: (id: string) => call<{ receipt_id: string; result: string; entries: number }>(`/verify/${id}`),
  challenge: (text: string) =>
    call<{ thin: boolean; instruction_like: boolean; ai: { result: string } | null; would_route_to: string }>(
      '/challenge/try', { method: 'POST', body: JSON.stringify({ text }) }),
  attemptsLeft: (learner: string) => call<{ used: number; cap: number; left: number }>(`/learners/${learner}/attempts`),
  resetLearner: (learner: string) => call(`/dev/reset/${learner}`, { method: 'POST' }),
  explainQuestions: (id: number) => call<{ questions: { id: string; text?: string; question?: string }[] }>(`/attempts/${id}/explainback`),
  explainSubmit: (id: number, answers: Record<string, string>) =>
    call<{ outcome: string; message: string }>(`/attempts/${id}/explainback`, { method: 'POST', body: JSON.stringify({ answers }) }),
  reviewQueue: () => call<{ queue: { review_id: number; criterion: string; text: string }[] }>('/review/queue'),
  decide: (rid: number, reviewer: string, decision: 'yes' | 'no', reason: string) =>
    call<{ level: string }>(`/review/${rid}/decide`, { method: 'POST', body: JSON.stringify({ reviewer, decision, reason }) }),
  appeal: (attempt_id: number, criterion: 'C3' | 'C5') => call<{ review_id: number }>('/appeals', { method: 'POST', body: JSON.stringify({ attempt_id, criterion }) }),
  audit: () => call<{ rows: { id: number; event: string; attempt: number | null; actor: string; created: string; fingerprint: string }[] }>('/audit'),
  quality: () => call<{ checked: number; sent_to_review: number; review_rate_pct: number | null; note: string }>('/quality/review-rate'),
  setConsent: (learner: string, role: string, on: boolean) =>
    call('/consent', { method: 'POST', body: JSON.stringify({ learner, role, on }) }),
}

export type Result = {
  debugging: string; insight: string; status: string; confidence: string
  flags: string[]; feedback: Record<string, string>; receipt_id: string
}

export type Skill = { skill: string; level: string; status: string; confidence: string; mode: string; last_attempt: string; attempt: number }
export const ROLE = 'jr-data-analyst'
export const useLearner = () => new URLSearchParams(window.location.search).get('learner')
  ?? (import.meta.env.VITE_LEARNER_ID as string | undefined) ?? null

export const NYERAS_URL = (import.meta.env.VITE_NYERAS_URL as string | undefined) ?? 'http://localhost:5173'
export const NXTMOVE_URL = (import.meta.env.VITE_NXTMOVE_URL as string | undefined) ?? 'http://localhost:5175'
// Only allow returning to the Nyeras site (no open redirect).
export function useReturnUrl(): string {
  const r = new URLSearchParams(window.location.search).get('return')
  return r && r.startsWith(NYERAS_URL) ? r : `${NYERAS_URL}/profile`
}
