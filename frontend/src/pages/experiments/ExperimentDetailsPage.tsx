import { useLocation, useNavigate } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bookmark, ChevronLeft, Star, TrendingUp, Calendar, Clock } from 'lucide-react'
import { experimentService } from '@/services/experimentService'
import { Btn, LoadingBlock, ErrorBlock, Card, Badge } from '@/components/common'
import { C } from '@/app/theme'
import type { Screen, UserData } from '@/types'

export default function ExperimentDetailsPage({ setScreen }: { setScreen: (s: Screen) => void }) {
  const slug = useLocation().pathname.split('/').pop() ?? ''
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = queryClient.getQueryData<UserData>(['me'])
  const {
    data: experiment,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['experiment', slug],
    queryFn: () => experimentService.get(slug),
  })
  const { data: savedItems = [] } = useQuery({
    queryKey: ['saved-experiments'],
    queryFn: experimentService.getSaved,
    enabled: Boolean(user),
  })
  const isSaved = savedItems.some((item) => item.experiment.slug === slug)
  const saveExperiment = useMutation({
    mutationFn: () => experimentService.toggleSaved(slug, isSaved),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-experiments'] }),
  })
  if (isLoading) return <LoadingBlock label="Loading experiment…" />
  if (error || !experiment)
    return <ErrorBlock message="This experiment could not be loaded." onRetry={() => refetch()} />
  const tasks = experiment.daily_tasks.slice(0, 3).map((task) => task.instructions)
  const testedTraits = (experiment.trait_weights ?? [])
    .filter((item) => item.weight >= 3)
    .slice(0, 3)
    .map((item) => item.trait.name.toLowerCase())

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px' }} className="fade-up">
      {/* Back */}
      <button
        onClick={() => setScreen('library')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'none',
          border: 'none',
          color: C.t3,
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: 14,
          marginBottom: 28,
          padding: 0,
        }}
      >
        <ChevronLeft size={16} /> Back to experiments
      </button>

      {/* Hero */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 11,
              background: `${C.purple}18`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Star size={20} color={C.purple} />
          </div>
          <Badge label={experiment.category} color={C.purple} />
        </div>
        <h1 style={{ fontSize: 34, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.025em' }}>
          {experiment.title}
        </h1>
        <p style={{ fontSize: 17, color: C.t2, lineHeight: 1.65, marginBottom: 20 }}>
          {experiment.description}
        </p>
        <div style={{ display: 'flex', gap: 16 }}>
          {[
            { Icon: Calendar, label: `${experiment.duration_days} days` },
            { Icon: Clock, label: `${experiment.minutes_per_day} min/day` },
            { Icon: TrendingUp, label: 'Beginner' },
          ].map(({ Icon, label }) => (
            <div
              key={label}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: C.t3 }}
            >
              <Icon size={14} color={C.t4} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Sections */}
      <Card style={{ marginBottom: 28, background: C.accS, border: `1px solid ${C.accB}` }}>
        <p style={{ fontSize: 14, color: C.t2, lineHeight: 1.65 }}>
          <strong style={{ color: C.acc }}>An experiment is a short, low-pressure trial.</strong> Do
          the activity, check in honestly, and use your responses as evidence about what fits you.
        </p>
      </Card>
      {[
        {
          title: 'What you will do',
          content: tasks.length
            ? `Follow one small prompt each day for about ${experiment.minutes_per_day} minutes, then record how the activity affected your energy, curiosity, meaning, and desire to continue. The goal is honest observation, not performance.`
            : `Try this activity for about ${experiment.minutes_per_day} minutes each day and record how the experience felt. The goal is honest observation, not performance.`,
        },
        {
          title: 'What this may reveal',
          content: testedTraits.length
            ? `This may reveal whether ${testedTraits.join(', ')} activities produce repeatable positive signals for you. One result is a clue, and later experiments help test whether it holds in another setting.`
            : 'This may reveal which parts of the activity energize you, hold your curiosity, or feel meaningful. One result is a clue, and later experiments help test whether it holds in another setting.',
        },
      ].map(({ title, content }) => (
        <div
          key={title}
          style={{ marginBottom: 28, paddingBottom: 28, borderBottom: `1px solid ${C.br}` }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{title}</h2>
          <p style={{ fontSize: 15, color: C.t2, lineHeight: 1.7 }}>{content}</p>
        </div>
      ))}

      {/* Daily tasks */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Sample daily tasks</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tasks.map((t, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 12,
                padding: '14px',
                background: C.s1,
                borderRadius: 12,
                border: `1px solid ${C.br}`,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  background: `${C.purple}18`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  color: C.purple,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>
              <span style={{ fontSize: 14, color: C.t2, lineHeight: 1.55 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div
        style={{
          padding: '24px',
          background: C.s1,
          borderRadius: 16,
          border: `1px solid ${C.accB}`,
          boxShadow: `0 0 0 1px ${C.accB}`,
        }}
      >
        <p style={{ fontSize: 14, color: C.t3, marginBottom: 16 }}>
          You can stop at any time. Ending an experiment does not mean you failed — it is still
          useful evidence.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <Btn
            variant="primary"
            size="lg"
            onClick={() =>
              user ? navigate(`/app/experiments/${slug}/commit`) : setScreen('login')
            }
          >
            Plan this experiment
          </Btn>
          <Btn
            variant="ghost"
            size="lg"
            disabled={saveExperiment.isPending}
            onClick={() => (user ? saveExperiment.mutate() : setScreen('login'))}
          >
            <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />{' '}
            {isSaved ? 'Saved' : 'Save for later'}
          </Btn>
        </div>
        {saveExperiment.error && (
          <p role="alert" style={{ color: C.red, marginTop: 12 }}>
            {saveExperiment.error.message}
          </p>
        )}
      </div>
    </div>
  )
}
