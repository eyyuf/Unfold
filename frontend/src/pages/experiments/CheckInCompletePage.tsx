import { Check, Sparkles } from 'lucide-react'
import { Btn, Card, LoadingBlock, ScoreBar } from '@/components/common'
import { C } from '@/app/theme'
import type { Screen } from '@/types'
import { useActiveExperiment } from '@/hooks/useActiveExperiment'

function formatCalendarDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(
    new Date(`${value}T00:00:00`),
  )
}

export default function CheckInCompletePage({ setScreen }: { setScreen: (s: Screen) => void }) {
  const { data: active, isPending } = useActiveExperiment()

  if (isPending) return <LoadingBlock label="Loading today's saved check-in…" />

  if (!active) {
    return (
      <Card style={{ maxWidth: 520, margin: '80px auto', textAlign: 'center' }}>
        <h1 className="font-serif" style={{ fontSize: 28, marginBottom: 10 }}>
          No active experiment
        </h1>
        <Btn onClick={() => setScreen('home')}>Back to home</Btn>
      </Card>
    )
  }

  const latest = active.recent_checkins[0]
  const signals = latest
    ? [
        { l: 'Enjoyment', v: latest.enjoyment },
        { l: 'Energy', v: latest.energy },
        { l: 'Curiosity', v: latest.curiosity },
        { l: 'Meaning', v: latest.meaning },
      ]
    : []
  const strongest = signals.reduce<{ l: string; v: number } | null>(
    (best, signal) => (!best || signal.v > best.v ? signal : best),
    null,
  )
  const readyToFinish = active.can_complete
  return (
    <div
      style={{
        minHeight: '100vh',
        background: C.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }} className="fade-up">
        <div
          style={{
            width: 68,
            height: 68,
            borderRadius: '50%',
            background: C.accS,
            border: `1px solid ${C.accB}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            position: 'relative',
          }}
        >
          <Check size={28} color={C.acc} strokeWidth={2.2} />
          <div style={{ position: 'absolute', top: -5, right: -5, color: C.gold }}>
            <Sparkles size={15} />
          </div>
        </div>
        <h1 className="font-serif" style={{ fontSize: 32, marginBottom: 8 }}>
          Today's check-in is complete.
        </h1>
        <p style={{ fontSize: 15, color: C.t3, lineHeight: 1.6, marginBottom: 28 }}>
          Your evidence is saved. Day{' '}
          {Math.min(active.current_day, active.experiment.duration_days)} of{' '}
          {active.experiment.duration_days} · {active.checkin_count} check-in
          {active.checkin_count === 1 ? '' : 's'} completed.
        </p>

        {latest && (
          <Card style={{ textAlign: 'left', marginBottom: 20 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.t4,
                marginBottom: 12,
                letterSpacing: '0.05em',
              }}
            >
              TODAY'S SIGNALS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {signals.map(({ l, v }) => (
                <ScoreBar key={l} label={l} value={v * 20} />
              ))}
            </div>
          </Card>
        )}

        {strongest && (
          <Card
            style={{
              background: C.accS,
              border: `1px solid ${C.accB}`,
              textAlign: 'left',
              marginBottom: 24,
            }}
          >
            <p style={{ fontSize: 14, color: C.t2, lineHeight: 1.6 }}>
              <strong style={{ color: C.acc }}>
                {strongest.l} was today&apos;s strongest signal at {strongest.v}/5.
              </strong>{' '}
              Keep checking in to see whether that signal repeats.
            </p>
          </Card>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="ghost" full onClick={() => setScreen('home')}>
            Back to home
          </Btn>
          {readyToFinish && (
            <Btn variant="secondary" full onClick={() => setScreen('reflection')}>
              Finish experiment
            </Btn>
          )}
        </div>
        {!readyToFinish && (
          <p style={{ color: C.t4, fontSize: 13, marginTop: 14 }}>
            {active.next_checkin_date
              ? `Your next check-in will be available tomorrow, ${formatCalendarDate(active.next_checkin_date)}.`
              : 'Return to your dashboard for the next available check-in.'}
          </p>
        )}
      </div>
    </div>
  )
}
