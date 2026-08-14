import { useNavigate } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bookmark, ChevronLeft } from 'lucide-react'
import { experimentService } from '@/services/experimentService'
import { Btn, Card, Badge } from '@/components/common'
import { C } from '@/app/theme'
import type { Screen } from '@/types'

export default function SavedExperimentsPage({ setScreen }: { setScreen: (s: Screen) => void }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const {
    data: items = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['saved-experiments'],
    queryFn: experimentService.getSaved,
  })
  const remove = useMutation({
    mutationFn: (slug: string) => experimentService.toggleSaved(slug, true),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-experiments'] }),
  })

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }} className="fade-up">
      <button
        onClick={() => setScreen('library')}
        style={{
          display: 'flex',
          gap: 6,
          alignItems: 'center',
          border: 0,
          background: 'none',
          color: C.t3,
          cursor: 'pointer',
          padding: 0,
          marginBottom: 24,
        }}
      >
        <ChevronLeft size={16} /> Back to Explore
      </button>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Saved experiments</h1>
      <p style={{ color: C.t3, marginBottom: 28 }}>Ideas you want to return to later.</p>
      {isLoading && <p style={{ color: C.t3 }}>Loading saved experiments…</p>}
      {error && (
        <p role="alert" style={{ color: C.red }}>
          Saved experiments could not be loaded.
        </p>
      )}
      {!isLoading && !items.length && (
        <Card style={{ textAlign: 'center', padding: 32 }}>
          <Bookmark size={26} color={C.t4} />
          <h2 style={{ fontSize: 18, margin: '12px 0 6px' }}>Nothing saved yet</h2>
          <p style={{ color: C.t3, marginBottom: 18 }}>
            Bookmark an experiment while browsing to keep it here.
          </p>
          <Btn onClick={() => setScreen('library')}>Explore experiments</Btn>
        </Card>
      )}
      <div style={{ display: 'grid', gap: 14 }}>
        {items.map(({ experiment }) => (
          <Card
            key={experiment.slug}
            onClick={() => navigate(`/app/experiments/${experiment.slug}`)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <Badge label={experiment.category} color={C.purple} />
                <h2 style={{ fontSize: 17, margin: '10px 0 6px' }}>{experiment.title}</h2>
                <p style={{ color: C.t3, fontSize: 14, margin: 0 }}>
                  {experiment.duration_days} days · {experiment.minutes_per_day} min/day
                </p>
              </div>
              <button
                aria-label={`Remove ${experiment.title} from saved experiments`}
                onClick={(event) => {
                  event.stopPropagation()
                  remove.mutate(experiment.slug)
                }}
                style={{
                  border: 0,
                  background: 'none',
                  color: C.acc,
                  cursor: 'pointer',
                  alignSelf: 'flex-start',
                }}
              >
                <Bookmark size={18} fill="currentColor" />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
