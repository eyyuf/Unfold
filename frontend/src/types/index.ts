export type Screen = 'landing' | 'login' | 'register' | 'forgot-password' | 'reset-password' | 'privacy' | 'terms' | 'home' | 'library' | 'detail' | 'commit' | 'saved' | 'checkin' | 'checkin-done' | 'reflection' | 'report' | 'insights' | 'learned' | 'vault' | 'onboarding' | 'profile' | 'help'

export type UserData = {
  id: number; email: string; display_name: string; timezone?: string
  reminder_time?: string | null; reminders_enabled?: boolean; email_reminders_enabled?: boolean
  onboarding_answers?: { reason?: string; available_time?: string; interests?: string[] }
  analytics_consent?: boolean
}

export type ExperimentTraitData = {
  id: number; slug: string; name: string; description: string; positive_hypothesis_text: string; negative_hypothesis_text: string
}

export type ExperimentData = {
  id: number; category: string; title: string; slug: string; description: string
  duration_days: number; minutes_per_day: number
  daily_tasks: { day: number; title: string; instructions: string }[]
  trait_weights?: { id: number; trait: ExperimentTraitData; weight: number }[]
}

export type ActiveExperiment = {
  id: number; start_date: string; experiment: ExperimentData
  checkin_count: number; current_day: number
  recent_checkins: { day: number; notes: string; enjoyment: number; energy: number; curiosity: number; meaning: number; desire_to_continue: number; motivation_before?: number; satisfaction_after?: number }[]
}

export type ExperimentReport = {
  id: number; status: string; start_date: string; experiment: ExperimentData; checkin_count: number
  fit_signal: number; overall_fit_score?: number
  confidence?: { score: number; label: string }
  strongest_signal: string; dimensions: Record<string, number>
  signals?: { enjoyment: number; energy: number; curiosity: number; meaning: number; desire_to_continue: number; desire_to_improve: number; flow: number }
  before_after?: { motivation_before?: number; satisfaction_after?: number; delta: number; interpretation: string }
  summary: string
  pattern_updates?: string[]
}

export type SavedExperimentData = {
  id: number; experiment: ExperimentData; created_at: string
}

export type UserHypothesisData = {
  id: number
  trait: ExperimentTraitData
  support_score: number
  confidence_score: number
  evidence_count: number
  status: 'uncertain' | 'emerging' | 'supported' | 'contradicted'
  status_display: string
  updated_at: string
}

export type ContrastRecommendationData = {
  hypothesis: { id: number; trait: string; trait_name: string; support_score: number; confidence_score: number; status: string }
  recommended_experiment: { id: number; slug: string; title: string; category: string; description: string; duration_days: number; minutes_per_day: number; reason: string }
}

export type InsightsData = {
  completed_count: number; average_fit: number; average_curiosity: number; average_repeat_intent: number; average_consistency: number
  patterns: string[]; categories: { label: string; value: number; count: number }[]
  evidence_map: { id: number; label: string; category: string; fit_signal: number; strongest_signal: string }[]
  next_recommendation?: ContrastRecommendationData | null
}

export type AuthFields = {
  email: string; password: string; confirm_password?: string; accept_terms?: boolean
}

export type EvidenceNode = { id: number; label: string; category: string; fit_signal: number; strongest_signal: string }

export type EvidenceItem = { experiment_id: number; experiment_title: string; fit_score: number; confidence_score: number; weight: number }

export type ProfileActivityData = {
  today: string
  days: { date: string; count: number }[]
  total_checkins: number
  active_days: number
  current_streak: number
  longest_streak: number
}

export type ThemePreference = 'dark' | 'light' | 'system'
