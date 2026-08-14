import { useQuery } from '@tanstack/react-query'

import { authService } from '@/services/authService'

export function useAuth() {
  return useQuery({
    queryKey: ['me'],
    queryFn: authService.getCurrentUser,
    retry: false,
  })
}
