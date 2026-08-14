import type { ActiveExperiment } from '@/types'

export type SignalAverage = { label: string; value: number }

export function getStrongestRecentSignal(active: ActiveExperiment): SignalAverage | undefined {
  if (!active.recent_checkins.length) return undefined
  const average = (field: 'curiosity' | 'energy' | 'meaning' | 'enjoyment') =>
    active.recent_checkins.reduce((sum, item) => sum + item[field], 0) / active.recent_checkins.length

  return [
    { label: 'curiosity', value: average('curiosity') },
    { label: 'energy', value: average('energy') },
    { label: 'meaning', value: average('meaning') },
    { label: 'enjoyment', value: average('enjoyment') },
  ].sort((a, b) => b.value - a.value)[0]
}

export function getTimeOfDayGreeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  if (hour < 21) return 'Good evening'
  return 'Good night'
}
