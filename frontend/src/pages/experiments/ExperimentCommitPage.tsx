import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { experimentService } from '@/services/experimentService'
import { Btn, Card, Badge } from '@/components/common'
import { C } from '@/app/theme'
import type { Screen, UserData } from '@/types'

export default function ExperimentCommitPage({ setScreen }: { setScreen: (s: Screen) => void }) {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const slug = location.pathname.split('/').filter(Boolean).at(-2) ?? ''
  const user = queryClient.getQueryData<UserData>(['me'])
  const today = (() => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  })()
  const [startDate, setStartDate] = useState(today)
  const [reason, setReason] = useState('')
  const [remindersEnabled, setRemindersEnabled] = useState(Boolean(user?.reminders_enabled))
  const [reminderTime, setReminderTime] = useState(user?.reminder_time?.slice(0, 5) ?? '19:30')
  const { data: experiment, isLoading } = useQuery({
    queryKey: ['experiment', slug],
    queryFn: () => experimentService.get(slug),
  })
  const start = useMutation({
    mutationFn: () =>
      experimentService.start(slug, {
        start_date: startDate,
        reason,
        reminders_enabled: remindersEnabled,
        reminder_time: reminderTime,
      }),
    onSuccess: (active) => {
      queryClient.setQueryData(['active-experiment'], active)
      queryClient.invalidateQueries({ queryKey: ['me'] })
      setScreen('home')
    },
  })

  if (isLoading || !experiment)
    return <div style={{ padding: 40, color: C.t3 }}>Preparing your experiment…</div>

  return (
    <div
      style={{
        minHeight: '100vh',
        background: C.bg,
        display: 'grid',
        placeItems: 'center',
        padding: 24,
      }}
    >
      <Card style={{ width: '100%', maxWidth: 580, padding: 32 }} accent>
        <button
          onClick={() => navigate(`/app/experiments/${slug}`)}
          style={{
            border: 0,
            background: 'none',
            color: C.t3,
            cursor: 'pointer',
            padding: 0,
            marginBottom: 22,
            display: 'flex',
            gap: 5,
          }}
        >
          <ChevronLeft size={16} /> Back
        </button>
        <Badge label="Make it practical" color={C.acc} />
        <h1 style={{ fontSize: 28, margin: '18px 0 8px' }}>Plan {experiment.title}</h1>
        <p style={{ color: C.t3, lineHeight: 1.6, marginBottom: 24 }}>
          A simple plan makes it easier to notice what the experience actually feels like.
        </p>

        <label style={{ display: 'block', color: C.t2, fontSize: 14, marginBottom: 18 }}>
          <span style={{ display: 'block', marginBottom: 7 }}>Start date</span>
          <input
            type="date"
            min={today}
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            style={{
              width: '100%',
              background: C.s2,
              color: C.t1,
              border: `1px solid ${C.br}`,
              borderRadius: 10,
              padding: '12px 14px',
              font: 'inherit',
              boxSizing: 'border-box',
            }}
          />
        </label>
        <label style={{ display: 'block', color: C.t2, fontSize: 14, marginBottom: 18 }}>
          <span style={{ display: 'block', marginBottom: 7 }}>
            Why are you trying this? <span style={{ color: C.t4 }}>(optional)</span>
          </span>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="I want to see whether…"
            style={{
              width: '100%',
              minHeight: 90,
              background: C.s2,
              color: C.t1,
              border: `1px solid ${C.br}`,
              borderRadius: 10,
              padding: '12px 14px',
              font: 'inherit',
              boxSizing: 'border-box',
              resize: 'vertical',
            }}
          />
        </label>
        <div style={{ padding: 16, background: C.s2, borderRadius: 12, marginBottom: 20 }}>
          <label
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: C.t2,
              fontSize: 14,
              marginBottom: remindersEnabled ? 14 : 0,
            }}
          >
            Email reminder
            <input
              type="checkbox"
              checked={remindersEnabled}
              onChange={(event) => setRemindersEnabled(event.target.checked)}
            />
          </label>
          {remindersEnabled && (
            <label
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: C.t2,
                fontSize: 14,
              }}
            >
              Preferred time
              <input
                type="time"
                value={reminderTime}
                onChange={(event) => setReminderTime(event.target.value)}
                style={{
                  background: C.s1,
                  color: C.t1,
                  border: `1px solid ${C.br}`,
                  borderRadius: 8,
                  padding: 8,
                }}
              />
            </label>
          )}
        </div>
        <p style={{ color: C.t4, fontSize: 13, lineHeight: 1.55, marginBottom: 20 }}>
          If it is {reminderTime}, you will spend {experiment.minutes_per_day} minutes on this
          experiment. Timezone: {user?.timezone ?? 'Africa/Nairobi'}.
        </p>
        {start.error && (
          <p role="alert" style={{ color: C.red }}>
            {start.error.message}
          </p>
        )}
        <Btn full size="lg" disabled={start.isPending || !startDate} onClick={() => start.mutate()}>
          {start.isPending ? 'Starting…' : 'Start experiment'}
        </Btn>
      </Card>
    </div>
  )
}
