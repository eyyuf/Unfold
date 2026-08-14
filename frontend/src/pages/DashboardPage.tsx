import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Check, Play, TrendingUp, Calendar, Clock, MoreHorizontal } from 'lucide-react'
import { experimentService } from '@/services/experimentService'
import {
  BrandMark,
  ConfirmModal,
  Btn,
  LoadingBlock,
  ErrorBlock,
  EmptyState,
  Card,
  ProgressBar,
  Badge,
} from '@/components/common'
import { C } from '@/app/theme'
import type { Screen, UserData } from '@/types'
import { useActiveExperiment } from '@/hooks/useActiveExperiment'
import { getStrongestRecentSignal, getTimeOfDayGreeting } from '@/utils/experimentSignals'

function formatCalendarDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(
    new Date(`${value}T00:00:00`),
  )
}

export default function DashboardPage({ setScreen }: { setScreen: (s: Screen) => void }) {
  const { data: active, isPending, isFetching, isError, refetch } = useActiveExperiment()
  const queryClient = useQueryClient()
  const user = queryClient.getQueryData<UserData>(['me'])
  const [showMotivationModal, setShowMotivationModal] = useState(false)
  const [motivationBefore, setMotivationBefore] = useState(3)
  const [showAbandonModal, setShowAbandonModal] = useState(false)

  const startCheckin = useMutation({
    mutationFn: (val: number) => {
      if (!active) throw new Error('No active experiment found.')
      return experimentService.startCheckIn(active.id, val)
    },
    onSuccess: () => {
      setShowMotivationModal(false)
      setScreen('checkin')
    },
  })
  const abandon = useMutation({
    mutationFn: () => {
      if (!active) throw new Error('No active experiment found.')
      return experimentService.abandon(active.id)
    },
    onSuccess: () => {
      queryClient.setQueryData(['active-experiment'], null)
      queryClient.invalidateQueries({ queryKey: ['evidence-vault'] })
      setScreen('vault')
    },
  })
  if (isPending) return <LoadingBlock label="Loading your experiment…" />
  if (isError)
    return <ErrorBlock message="Your experiment could not be loaded." onRetry={() => refetch()} />
  if (!active)
    return (
      <EmptyState
        title="Your next discovery starts with one small experiment"
        copy="Choose a short experiment to begin collecting evidence."
        action="Explore experiments"
        onAction={() => setScreen('library')}
      />
    )
  const duration = active.experiment.duration_days
  const calendarDay = active.current_day
  const day = Math.min(Math.max(calendarDay, 1), duration)
  const calendarProgress = Math.min(Math.max(calendarDay, 0), duration)
  const task = active.experiment.daily_tasks.find((item) => item.day === day)
  const strongestRecentSignal = getStrongestRecentSignal(active)
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }} className="fade-up">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 32,
        }}
      >
        <div>
          <p style={{ color: C.t4, fontSize: 13, marginBottom: 4 }}>
            {new Intl.DateTimeFormat(undefined, { dateStyle: 'full' }).format(new Date())}
          </p>
          <h1 className="font-serif" style={{ fontSize: 32, marginBottom: 4 }}>
            {getTimeOfDayGreeting()}, {user?.display_name || user?.email.split('@')[0]}
          </h1>
          <p style={{ color: C.t3, fontSize: 14 }}>One experiment at a time.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            aria-label="Open reminder settings"
            onClick={() => setScreen('profile')}
            style={{
              width: 38,
              height: 38,
              borderRadius: 9,
              background: C.s1,
              border: `1px solid ${C.br}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            <Bell size={16} color={C.t3} />
            <div
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: C.acc,
              }}
            />
          </button>
          <button
            aria-label="Open profile"
            onClick={() => setScreen('profile')}
            style={{ padding: 0, background: 'none', border: 0, cursor: 'pointer' }}
          >
            <BrandMark />
          </button>
        </div>
      </div>
      {isFetching && <div style={{ color: C.t4, fontSize: 12, marginBottom: 10 }}>Syncing…</div>}

      {/* Active experiment card */}
      <div
        style={{
          background: C.s1,
          borderRadius: 20,
          padding: '24px',
          border: `1px solid ${C.accB}`,
          boxShadow: `0 0 0 1px ${C.accB}, 0 20px 40px rgba(34,197,94,0.06)`,
          marginBottom: 24,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(130,151,122,0.1) 0%, transparent 70%)',
          }}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 16,
          }}
        >
          <Badge label={active.experiment.category} color={C.purple} />
          <button
            aria-label="End experiment early"
            onClick={() => setShowAbandonModal(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.t4 }}
          >
            <MoreHorizontal size={18} />
          </button>
        </div>

        <h2 className="font-serif" style={{ fontSize: 24, marginBottom: 4 }}>
          {active.experiment.title}
        </h2>
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, fontSize: 13, color: C.t3 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Calendar size={13} />{' '}
            {calendarDay < 1
              ? `Starts ${formatCalendarDate(active.start_date)}`
              : calendarDay > duration
                ? 'Experiment window complete'
                : `Day ${calendarDay} of ${duration}`}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Clock size={13} /> ~{active.experiment.minutes_per_day} min/day
          </span>
        </div>

        <ProgressBar value={calendarProgress} max={duration} label="Calendar progress" />

        <p style={{ color: C.t4, fontSize: 12, marginTop: 8 }}>
          {active.checkin_count} of {duration} check-ins completed
        </p>

        {/* Day indicators */}
        <div style={{ display: 'flex', gap: 6, margin: '16px 0 20px' }}>
          {Array.from({ length: active.experiment.duration_days }, (_, index) => index + 1).map(
            (d) => {
              const completed = active.completed_days.includes(d)
              const isCurrent = d === calendarDay
              return (
                <div
                  key={d}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 600,
                    background: completed ? C.acc : isCurrent ? C.accS : C.s2,
                    color: completed ? '#052e16' : isCurrent ? C.acc : C.t4,
                    border: isCurrent ? `1px solid ${C.accB}` : 'none',
                  }}
                >
                  {completed ? <Check size={13} /> : d}
                </div>
              )
            },
          )}
        </div>

        {/* Today's task */}
        {calendarDay >= 1 && calendarDay <= duration && (
          <div
            style={{
              background: C.s2,
              borderRadius: 12,
              padding: '16px',
              marginBottom: 20,
              border: `1px solid ${C.br}`,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.t4,
                letterSpacing: '0.06em',
                marginBottom: 8,
                textTransform: 'uppercase',
              }}
            >
              Today's task
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: C.t1, marginBottom: 6 }}>
              {task?.instructions ?? 'Complete today’s experiment task.'}
            </p>
            <div style={{ display: 'flex', gap: 12, fontSize: 13, color: C.t4 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} /> {active.experiment.minutes_per_day} minutes
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Bell size={12} /> Reminder at {user?.reminder_time?.slice(0, 5) ?? '19:30'}
              </span>
            </div>
          </div>
        )}

        {active.today_checkin_complete && (
          <div
            role="status"
            style={{
              padding: 16,
              borderRadius: 12,
              background: C.accS,
              border: `1px solid ${C.accB}`,
              marginBottom: active.can_complete ? 12 : 0,
            }}
          >
            <p style={{ color: C.acc, fontWeight: 700, marginBottom: 4 }}>
              Today's check-in is complete.
            </p>
            {!active.can_complete && active.next_checkin_date && (
              <p style={{ color: C.t3, fontSize: 13 }}>
                Your next check-in will be available tomorrow,{' '}
                {formatCalendarDate(active.next_checkin_date)}.
              </p>
            )}
          </div>
        )}

        {calendarDay < 1 && active.next_checkin_date && (
          <div role="status" style={{ color: C.t3, fontSize: 14 }}>
            This experiment starts on {formatCalendarDate(active.next_checkin_date)}.
          </div>
        )}

        {calendarDay > duration && (
          <div role="status" style={{ color: C.t3, fontSize: 14, marginBottom: 12 }}>
            The {duration}-day experiment window is complete. Missed days remain unfilled.
          </div>
        )}

        {active.can_check_in_today && (
          <Btn variant="primary" full size="lg" onClick={() => setShowMotivationModal(true)}>
            <Play size={16} />
            Begin today's task
          </Btn>
        )}

        {active.can_complete && (
          <Btn variant="secondary" full size="lg" onClick={() => setScreen('reflection')}>
            Complete final reflection
          </Btn>
        )}

        {showMotivationModal && active.can_check_in_today && (
          <ConfirmModal
            open={showMotivationModal}
            title="Before starting today's task"
            message="How motivated are you to do this right now?"
            confirmLabel={startCheckin.isPending ? 'Starting…' : 'Start task'}
            confirmVariant="primary"
            onConfirm={() => startCheckin.mutate(motivationBefore)}
            onCancel={() => setShowMotivationModal(false)}
          >
            <div
              style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '16px 0 8px' }}
            >
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setMotivationBefore(v)}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    font: 'inherit',
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: 'pointer',
                    background: motivationBefore === v ? C.acc : C.s2,
                    color: motivationBefore === v ? '#052e16' : C.t1,
                    border: `1px solid ${motivationBefore === v ? C.accB : C.br}`,
                    transition: 'all 0.15s',
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12,
                color: C.t4,
                padding: '0 4px',
              }}
            >
              <span>1: Not at all</span>
              <span>5: Very motivated</span>
            </div>
            {startCheckin.error && (
              <p role="alert" style={{ color: C.red, fontSize: 13, marginTop: 12 }}>
                {startCheckin.error.message}
              </p>
            )}
          </ConfirmModal>
        )}
        <button
          disabled={abandon.isPending}
          onClick={() => setShowAbandonModal(true)}
          style={{
            width: '100%',
            marginTop: 12,
            border: 0,
            background: 'none',
            color: C.t4,
            cursor: 'pointer',
            font: 'inherit',
            fontSize: 13,
          }}
        >
          {abandon.isPending ? 'Ending experiment…' : 'End experiment early'}
        </button>
        {abandon.error && (
          <p role="alert" style={{ color: C.red, fontSize: 13 }}>
            {abandon.error.message}
          </p>
        )}
      </div>

      {/* Recent evidence */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Recent evidence</h3>
          <button
            onClick={() => setScreen('vault')}
            style={{
              background: 'none',
              border: 'none',
              color: C.acc,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: 600,
            }}
          >
            View all
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {!active.recent_checkins.length && (
            <p style={{ color: C.t4, fontSize: 14 }}>
              Your check-ins will appear here as you collect evidence.
            </p>
          )}
          {active.recent_checkins.map((checkin) => (
            <Card key={checkin.day} style={{ padding: '14px 18px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: C.t4 }}>
                  Day {checkin.day}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { l: 'Curiosity', v: checkin.curiosity },
                    { l: 'Energy', v: checkin.energy },
                  ].map(({ l, v }) => (
                    <span key={l} style={{ fontSize: 12, color: C.t3 }}>
                      {l}: <strong style={{ color: v >= 4 ? C.acc : C.t2 }}>{v}/5</strong>
                    </span>
                  ))}
                </div>
              </div>
              <p style={{ fontSize: 14, color: C.t2, fontStyle: 'italic' }}>
                {checkin.notes || 'No note added.'}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Pattern hint */}
      {active.recent_checkins.length >= 2 && strongestRecentSignal && (
        <Card style={{ background: `${C.purple}0e`, border: `1px solid ${C.purple}25` }}>
          <div
            className="slide-in-up"
            style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                background: `${C.purple}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <TrendingUp size={17} color={C.purple} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: C.purple,
                  marginBottom: 4,
                  letterSpacing: '0.04em',
                }}
              >
                PATTERN FORMING
              </div>
              <p style={{ fontSize: 14, color: C.t2, lineHeight: 1.55 }}>
                Across your latest check-ins, {strongestRecentSignal.label} is the strongest signal
                at {strongestRecentSignal.value.toFixed(1)}/5. Keep collecting evidence to see
                whether it persists.
              </p>
            </div>
          </div>
        </Card>
      )}

      <ConfirmModal
        open={showAbandonModal}
        title="End experiment early?"
        message="Your existing check-ins will remain in your Evidence Vault. You can start a new experiment after."
        confirmLabel="End experiment"
        confirmVariant="danger"
        onConfirm={() => {
          setShowAbandonModal(false)
          abandon.mutate()
        }}
        onCancel={() => setShowAbandonModal(false)}
      />
    </div>
  )
}
