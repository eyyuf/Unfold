import { useQuery } from '@tanstack/react-query'
import { experimentService } from '@/services/experimentService'

export function useActiveExperiment() {
  return useQuery({
    queryKey: ['active-experiment'],
    queryFn: experimentService.getActive,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  })
}
