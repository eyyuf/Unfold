import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/api/client'
import type { ActiveExperiment } from '@/types'

export function useActiveExperiment() {
  return useQuery({
    queryKey: ['active-experiment'],
    queryFn: () => apiRequest<ActiveExperiment | null>('/user-experiments/active/'),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  })
}
