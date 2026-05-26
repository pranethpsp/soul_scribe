import type { Entry, InsightItem, Pattern, Person, ConfidenceReport, AuthUser } from './types'

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000'
const ADMIN_SECRET = (import.meta.env.VITE_ADMIN_SECRET as string | undefined) ?? 'dev_admin_secret'

function getToken(): string | null {
  return localStorage.getItem('soul_token')
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {}

  // Only set Content-Type for JSON — let browser set it for FormData (with boundary)
  if (!(init?.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...headers, ...(init?.headers || {}) },
  })

  if (res.status === 401) {
    localStorage.removeItem('soul_token')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status}: ${text}`)
  }

  return res.json() as Promise<T>
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export function login(username: string, password: string) {
  return request<{ token: string; user: AuthUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function register(username: string, password: string, display_name: string) {
  return request<{ token: string; user: AuthUser }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password, display_name }),
  })
}

export function getMe() {
  return request<AuthUser>('/api/auth/me')
}

// ── Entries ───────────────────────────────────────────────────────────────────

export function listEntries(params?: { limit?: number; offset?: number; entry_type?: string }) {
  const q = new URLSearchParams()
  if (params?.limit != null) q.set('limit', String(params.limit))
  if (params?.offset != null) q.set('offset', String(params.offset))
  if (params?.entry_type) q.set('entry_type', params.entry_type)
  return request<Entry[]>(`/api/entries?${q}`)
}

export function createEntry(raw_content: string) {
  return request<Record<string, unknown>>('/api/entries', {
    method: 'POST',
    body: JSON.stringify({ raw_content }),
  })
}

// ── Oracle / Chat ─────────────────────────────────────────────────────────────

export function chat(text: string, conversationId: string) {
  return request<Record<string, unknown>>('/api/oracle/chat', {
    method: 'POST',
    body: JSON.stringify({ question: text, conversation_id: conversationId }),
  })
}

// ── Insights ──────────────────────────────────────────────────────────────────

export function getInsights() {
  return request<InsightItem[]>('/api/insights')
}

export function getPatterns() {
  return request<Pattern[]>('/api/insights/patterns')
}

export function getPsychologyProfile() {
  return request<Record<string, unknown>>('/api/insights/psychology')
}

// ── People ────────────────────────────────────────────────────────────────────

export function listPeople() {
  return request<Person[]>('/api/people')
}

export function createPerson(body: {
  name: string
  relationship_type: string
  birthday?: string
  notes?: string
}) {
  return request<Person>('/api/people', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function getPersonBrief(personId: string) {
  return request<Record<string, unknown>>(`/api/people/${personId}/brief`)
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export function listVault() {
  return request<Record<string, unknown>[]>(`/api/admin/vault?x_admin_secret=${ADMIN_SECRET}`)
}

export function uploadVault(formData: FormData) {
  formData.set('x_admin_secret', ADMIN_SECRET)
  return request<Record<string, unknown>>('/api/admin/vault', {
    method: 'POST',
    body: formData,
  })
}

export function removeFromVault(sourceId: string) {
  return request<Record<string, unknown>>(
    `/api/admin/vault/${sourceId}?x_admin_secret=${ADMIN_SECRET}`,
    { method: 'DELETE' },
  )
}

export function triggerPatternAnalysis() {
  return request<Record<string, unknown>>(
    `/api/admin/analyse-patterns?x_admin_secret=${ADMIN_SECRET}`,
    { method: 'POST' },
  )
}

export function getMetrics() {
  return request<Record<string, unknown>[]>(`/api/admin/metrics?x_admin_secret=${ADMIN_SECRET}`)
}
