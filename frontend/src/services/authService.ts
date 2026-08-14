import { apiRequest } from '@/api/client'
import type { AuthFields, ProfileActivityData, UserData } from '@/types'

export type ConsentRecord = {
  id: number
  kind: string
  granted: boolean
  policy_version: string
  created_at: string
}

export const authService = {
  getCurrentUser: () => apiRequest<UserData | null>('/auth/me/'),
  authenticate: (mode: 'login' | 'register', values: AuthFields) =>
    apiRequest<UserData>(`/auth/${mode}/`, { method: 'POST', body: JSON.stringify(values) }),
  requestPasswordReset: (email: string) =>
    apiRequest<{ detail: string; reset_url?: string }>('/auth/password-reset/', { method: 'POST', body: JSON.stringify({ email }) }),
  confirmPasswordReset: (payload: { uid: string | null; token: string | null; password: string; confirm_password: string }) =>
    apiRequest<{ detail: string }>('/auth/password-reset/confirm/', { method: 'POST', body: JSON.stringify(payload) }),
  updateProfile: (data: object) =>
    apiRequest<UserData>('/auth/me/', { method: 'PATCH', body: JSON.stringify(data) }),
  getProfileActivity: () => apiRequest<ProfileActivityData>('/profile/activity/'),
  getConsentHistory: () => apiRequest<ConsentRecord[]>('/auth/consents/'),
  exportUserData: () => apiRequest<Record<string, any>>('/auth/export/'),
  deleteAccount: () => apiRequest('/auth/delete-account/', { method: 'POST', body: JSON.stringify({ confirmation: 'DELETE' }) }),
  logout: () => apiRequest('/auth/logout/', { method: 'POST' }),
}
