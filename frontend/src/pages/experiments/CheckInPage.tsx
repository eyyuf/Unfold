import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { experimentService } from '@/services/experimentService'
import { Btn, Card, LoadingBlock } from '@/components/common'
import type { Screen } from '@/types'
import { useActiveExperiment } from '@/hooks/useActiveExperiment'
import { CheckInHeader } from './check-in/CheckInHeader'
import { CheckInNavigation } from './check-in/CheckInNavigation'
import { CompletionQuestion } from './check-in/CompletionQuestion'
import { NotesQuestion } from './check-in/NotesQuestion'
import { RatingQuestion } from './check-in/RatingQuestion'
import styles from './CheckInPage.module.css'

type Question = {
  q: string
  type?: 'yn' | 'note'
  labels?: [string, string]
}

const questions: Question[] = [
  { q: "Did you complete today's task?", type: 'yn' },
  { q: 'How enjoyable was it?', labels: ['Not at all', 'Very enjoyable'] },
  { q: 'How energized do you feel?', labels: ['Drained', 'Energized'] },
  { q: 'How curious did it make you?', labels: ['Not curious', 'Very curious'] },
  { q: 'How meaningful did it feel?', labels: ['Not meaningful', 'Very meaningful'] },
  { q: 'Would you like to continue?', labels: ['Definitely not', 'Absolutely yes'] },
  { q: 'Did you want to improve?', labels: ['No desire', 'Strong desire'] },
  { q: 'Did you lose track of time?', labels: ['Focused on time', 'Felt flow'] },
  { q: 'How difficult was it?', labels: ['Very easy', 'Very difficult'] },
  { q: 'How satisfied are you that you did it?', labels: ['Unsatisfied', 'Very satisfied'] },
  { q: 'Add a note (optional)', type: 'note' },
]

function formatCalendarDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(
    new Date(`${value}T00:00:00`),
  )
}

export default function CheckInPage({ setScreen }: { setScreen: (s: Screen) => void }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [notes, setNotes] = useState('')
  const [draftLoaded, setDraftLoaded] = useState(false)
  const { data: active, isPending } = useActiveExperiment()
  const queryClient = useQueryClient()
  const draftKey = active ? `unfold-checkin-draft-${active.id}-${active.current_day}` : ''

  useEffect(() => {
    if (!draftKey) return
    try {
      const draft = JSON.parse(localStorage.getItem(draftKey) ?? 'null')
      if (draft) {
        setAnswers(draft.answers ?? {})
        setNotes(draft.notes ?? '')
        setStep(Math.min(Number(draft.step) || 0, 6))
      }
    } finally {
      setDraftLoaded(true)
    }
  }, [draftKey])

  useEffect(() => {
    if (!draftKey || !draftLoaded) return
    localStorage.setItem(draftKey, JSON.stringify({ answers, notes, step }))
  }, [answers, draftKey, draftLoaded, notes, step])

  const submit = useMutation({
    mutationFn: () => {
      if (!active) throw new Error('Start an experiment before checking in.')
      return experimentService.submitCheckIn(active.id, {
        enjoyment: answers[1] ?? 3,
        energy_after: answers[2] ?? 3,
        curiosity: answers[3] ?? 3,
        meaning: answers[4] ?? 3,
        desire_to_continue: answers[5] ?? 3,
        desire_to_improve: answers[6] ?? 3,
        lost_track_of_time: answers[7] ?? 3,
        difficulty: answers[8] ?? 3,
        satisfaction_after: answers[9] ?? 3,
        minutes_spent: active.experiment.minutes_per_day,
        notes,
        is_complete: true,
      })
    },
    onSuccess: async () => {
      if (draftKey) localStorage.removeItem(draftKey)
      await queryClient.invalidateQueries({ queryKey: ['active-experiment'] })
      setScreen('checkin-done')
    },
  })

  const current = questions[step]
  const total = questions.length

  const select = (value: number) => {
    setAnswers((currentAnswers) => ({ ...currentAnswers, [step]: value }))
    setTimeout(
      () =>
        step < total - 1 ? setStep((currentStep) => currentStep + 1) : setScreen('checkin-done'),
      current.type === 'note' ? 0 : 320,
    )
  }

  if (isPending) return <LoadingBlock label="Checking today's availability…" />

  if (!active) {
    return (
      <Card className={styles.emptyCard}>
        <h1 className={`font-serif ${styles.emptyTitle}`}>No active experiment</h1>
        <p className={styles.emptyCopy}>Start an experiment before checking in.</p>
        <Btn onClick={() => setScreen('library')}>Explore experiments</Btn>
      </Card>
    )
  }

  if (!active.can_check_in_today) {
    const startsLater = active.current_day < 1
    const windowComplete = active.current_day > active.experiment.duration_days
    const title = active.today_checkin_complete
      ? "Today's check-in is complete."
      : startsLater
        ? 'This experiment has not started yet.'
        : windowComplete
          ? 'This experiment window is complete.'
          : "Today's check-in is unavailable."

    return (
      <div className={styles.unavailablePage}>
        <Card className={styles.unavailableCard}>
          <Check className={styles.statusIcon} size={30} />
          <h1 className={`font-serif ${styles.emptyTitle}`}>{title}</h1>
          <p className={styles.unavailableCopy}>
            {active.today_checkin_complete && active.next_checkin_date
              ? `Your next check-in will be available tomorrow, ${formatCalendarDate(active.next_checkin_date)}.`
              : startsLater && active.next_checkin_date
                ? `Your first check-in will be available on ${formatCalendarDate(active.next_checkin_date)}.`
                : windowComplete
                  ? 'Missed days remain unfilled. You can continue to your final reflection.'
                  : 'Return to your experiment dashboard for the latest status.'}
          </p>
          <Btn onClick={() => setScreen(active.can_complete ? 'reflection' : 'home')}>
            {active.can_complete ? 'Complete final reflection' : 'Back to home'}
          </Btn>
        </Card>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <CheckInHeader
        experimentTitle={active.experiment.title}
        day={active.current_day}
        step={step}
        total={total}
        onClose={() => setScreen('home')}
      />

      <main className={`${styles.questionContainer} slide-in-right`} key={step}>
        <h2 className={styles.questionTitle}>{current.q}</h2>

        {current.type === 'yn' && <CompletionQuestion selected={answers[step]} onSelect={select} />}

        {current.labels && (
          <RatingQuestion labels={current.labels} selected={answers[step]} onSelect={select} />
        )}

        {current.type === 'note' && (
          <NotesQuestion
            notes={notes}
            isPending={submit.isPending}
            error={submit.error instanceof Error ? submit.error : undefined}
            onChange={setNotes}
            onSkip={() => {
              setNotes('')
              submit.mutate()
            }}
            onSubmit={() => submit.mutate()}
          />
        )}
      </main>

      {!current.type && (
        <CheckInNavigation
          step={step}
          onPrevious={() => setStep((currentStep) => Math.max(0, currentStep - 1))}
          onSkip={() => setStep((currentStep) => Math.min(total - 1, currentStep + 1))}
        />
      )}
    </div>
  )
}
