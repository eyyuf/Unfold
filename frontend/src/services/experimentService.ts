import { apiRequest } from '@/api/client'
import type {
  ActiveExperiment,
  ExperimentData,
  ExperimentReport,
  SavedExperimentData,
} from '@/types'

export type ExperimentFilters = {
  search?: string
  category?: string
  duration?: string
}

export type StartExperimentInput = {
  start_date: string
  reason: string
  reminders_enabled: boolean
  reminder_time: string
}

export type CheckInInput = Record<string, string | number | boolean>

export const experimentService = {
  list: (filters: ExperimentFilters) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    return apiRequest<ExperimentData[]>(`/experiments/?${params}`)
  },
  get: (slug: string) => apiRequest<ExperimentData>(`/experiments/${slug}/`),
  getActive: () => apiRequest<ActiveExperiment | null>('/user-experiments/active/'),
  getSaved: () => apiRequest<SavedExperimentData[]>('/saved-experiments/'),
  toggleSaved: (slug: string, currentlySaved: boolean) =>
    apiRequest(`/experiments/${slug}/save/`, { method: currentlySaved ? 'DELETE' : 'POST' }),
  start: (slug: string, input: StartExperimentInput) =>
    apiRequest<ActiveExperiment>(`/experiments/${slug}/start/`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  startCheckIn: (id: number, motivationBefore: number) =>
    apiRequest(`/user-experiments/${id}/checkins/start/`, {
      method: 'POST',
      body: JSON.stringify({ motivation_before: motivationBefore }),
    }),
  submitCheckIn: (id: number, input: CheckInInput) =>
    apiRequest(`/user-experiments/${id}/checkins/`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  completeReflection: (id: number, repeatIntent: number, summary: string) =>
    apiRequest(`/user-experiments/${id}/final-reflection/`, {
      method: 'POST',
      body: JSON.stringify({ repeat_intent: repeatIntent, summary }),
    }),
  abandon: (id: number) => apiRequest(`/user-experiments/${id}/abandon/`, { method: 'POST' }),
  getReport: (id: string | number) =>
    apiRequest<ExperimentReport>(`/user-experiments/${id}/report/`),
  getEvidenceVault: () => apiRequest<ExperimentReport[]>('/evidence-vault/'),
}
