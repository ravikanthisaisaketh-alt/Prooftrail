// One place for every call to the back end. URLs come from .env, never hard-coded.
// Site and API addresses come from VITE_ env vars. The localhost fallbacks apply to `npm run dev` only.
const fromEnv = (v: string | undefined, devDefault: string): string => v || devDefault
const API = fromEnv(import.meta.env.VITE_API_URL, import.meta.env.DEV ? 'http://localhost:8000' : '')
if (import.meta.env.PROD && !API) console.error('Set VITE_API_URL for this build.')

import { getToken, clearSession } from './session'

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const t = getToken()
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) },
    ...init,
  })
  if (res.status === 401) {
    clearSession()
    throw new Error('Your session has ended. Please sign in again from Nyeras.')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail ?? `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

export type Mode = 'Open' | 'Focus'
export const api = {
  startAttempt: (learner: string, mode: Mode, tools: string, task = 't1') =>
    call<{ attempt_id: number; attempt_no: number }>('/attempts', {
      method: 'POST', body: JSON.stringify({ learner, mode, tools_declared: tools, task }) }),
  taskVariant: (learner: string, task: string) =>
    call<{ task: string; objective: string; starter: string; criteria: { id: string; name: string; what: string }[] }>(`/tasks/${task}/variant?learner=${learner}`),
  sendSignal: (id: number, event: 'tab_leave' | 'large_paste', value: number, note = '') =>
    call(`/attempts/${id}/signals`, { method: 'POST', body: JSON.stringify({ event, value, note }) }),
  submit: (id: number, code: string, text: string) =>
    call<Result>(`/attempts/${id}/submit`, { method: 'POST', body: JSON.stringify({ code, text }) }),
  profile: (learner: string) => call<{ skills: Skill[] }>(`/profile/${learner}`),
  consentState: (learner: string, task = 't1') =>
    call<{ on: boolean; history: { role: string; on_off: number; changed: string }[] }>(`/consent/${learner}/history?task=${task}`),
  verify: (id: string) => call<{ receipt_id: string; result: string; entries: number }>(`/verify/${id}`),
  challenge: (text: string) =>
    call<{ thin: boolean; instruction_like: boolean; ai: { result: string } | null; would_route_to: string }>(
      '/challenge/try', { method: 'POST', body: JSON.stringify({ text }) }),
  attemptsLeft: (learner: string, task = 't1') => call<{ used: number; cap: number; left: number }>(`/learners/${learner}/attempts?task=${task}`),
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
  setConsent: (learner: string, role: string, on: boolean, task = 't1') =>
    call('/consent', { method: 'POST', body: JSON.stringify({ learner, role, on, task }) }),
}

export type Result = {
  debugging: string; insight: string; status: string; confidence: string
  flags: string[]; feedback: Record<string, string>; receipt_id: string
}

export type Skill = { skill: string; level: string; status: string; confidence: string; mode: string; last_attempt: string; attempt: number }
export const ROLE = 'jr-data-analyst'
export const TASK_NAMES: Record<string, string> = { t1: 'Debugging with pandas', t2: 'Text cleaning', t3: 'Data structures' }
export const SKILL_LABEL: Record<string, string> = {
  Debugging: 'Debugging with pandas', 'Insight Communication': 'Explanation: pandas',
  'Text cleaning': 'Text cleaning', 'Insight: Text cleaning': 'Explanation: text cleaning',
  'Data structures': 'Data structures', 'Insight: Data structures': 'Explanation: data structures',
}
// Which exam? ?task= from Nyeras, remembered for the tab. Default is the pandas task.
export function useTask(): string {
  const p = new URLSearchParams(window.location.search).get('task')
  try { if (p) sessionStorage.setItem('pt_task', p); return p ?? sessionStorage.getItem('pt_task') ?? 't1' } catch { return p ?? 't1' }
}

export const NYERAS_URL = fromEnv(import.meta.env.VITE_NYERAS_URL, import.meta.env.DEV ? 'http://localhost:5173' : '')
export const NXTMOVE_URL = fromEnv(import.meta.env.VITE_NXTMOVE_URL, import.meta.env.DEV ? 'http://localhost:5175' : '')
// Only allow returning to the Nyeras site (same origin as VITE_NYERAS_URL). No open redirect, and no redirect if it is unset.
export function useReturnUrl(): string {
  const fallback = `${NYERAS_URL}/profile`
  const r = new URLSearchParams(window.location.search).get('return')
  try { return r && NYERAS_URL && new URL(r).origin === new URL(NYERAS_URL).origin ? r : fallback } catch { return fallback }
}
