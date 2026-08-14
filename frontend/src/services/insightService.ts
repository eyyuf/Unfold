import { apiRequest } from '@/api/client'
import type { ContrastRecommendationData, EvidenceItem, InsightsData, UserHypothesisData } from '@/types'

export const insightService = {
  getInsights: () => apiRequest<InsightsData>('/insights/'),
  getHypotheses: () => apiRequest<UserHypothesisData[]>('/insights/hypotheses/'),
  getHypothesis: (id: number) =>
    apiRequest<UserHypothesisData & { evidence: EvidenceItem[] }>(`/insights/hypotheses/${id}/`),
  getContrastRecommendation: (id: number) =>
    apiRequest<ContrastRecommendationData>(`/insights/hypotheses/${id}/test/`, { method: 'POST' }),
}
