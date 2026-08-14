import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Calendar, Check, Clock, MoreHorizontal, Play, TrendingUp } from 'lucide-react'
import { experimentService } from '@/services/experimentService'
import {
  Badge,
  BrandMark,
  Btn,
  Card,
  ConfirmModal,
  EmptyState,
  ErrorBlock,
  LoadingBlock,
  ProgressBar,
} from '@/components/common'
import { C } from '@/app/theme'
import type { Screen, UserData } from '@/types'
import { useActiveExperiment } from '@/hooks/useActiveExperiment'
import { getStrongestRecentSignal, getTimeOfDayGreeting } from '@/utils/experimentSignals'
import styles from './DashboardPage.module.css'

function formatCalendarDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(
    new Date(`${value}T00:00:00`),
  )
}

export default function DashboardPage({ setScreen }: { setScreen: (screen: Screen) => void }) {
  const { data: active, isPending, isFetching, isError, refetch } = useActiveExperiment()
  const queryClient = useQueryClient()
  const user = queryClient.getQueryData<UserData>(['me'])
  const [showMotivationModal, setShowMotivationModal] = useState(false)
  const [motivationBefore, setMotivationBefore] = useState(3)
  const [showAbandonModal, setShowAbandonModal] = useState(false)

  const startCheckin = useMutation({
    mutationFn: (value: number) => {
      if (!active) throw new Error('No active experiment found.')
      return experimentService.startCheckIn(active.id, value)
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
    <div className={`${styles.page} fade-up`}>
      <header className={styles.header}>
        <div>
          <p className={styles.date}>
            {new Intl.DateTimeFormat(undefined, { dateStyle: 'full' }).format(new Date())}
          </p>
          <h1 className={`font-serif ${styles.title}`}>
            {getTimeOfDayGreeting()}, {user?.display_name || user?.email.split('@')[0]}
          </h1>
          <p className={styles.tagline}>One experiment at a time.</p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.iconButton}
            aria-label="Open reminder settings"
            onClick={() => setScreen('profile')}
          >
            <Bell size={16} />
            <span className={styles.notificationDot} />
          </button>
          <button
            className={styles.profileButton}
            aria-label="Open profile"
            onClick={() => setScreen('profile')}
          >
            <BrandMark />
          </button>
        </div>
      </header>

      {isFetching && <div className={styles.syncing}>Syncing…</div>}

      <section className={styles.activeCard}>
        <div className={styles.glow} />
        <div className={styles.cardHeader}>
          <Badge label={active.experiment.category} color={C.purple} />
          <button
            className={styles.menuButton}
            aria-label="End experiment early"
            onClick={() => setShowAbandonModal(true)}
          >
            <MoreHorizontal size={18} />
          </button>
        </div>

        <h2 className={`font-serif ${styles.experimentTitle}`}>{active.experiment.title}</h2>
        <div className={styles.experimentMeta}>
          <span className={styles.metaItem}>
            <Calendar size={13} />
            {calendarDay < 1
              ? `Starts ${formatCalendarDate(active.start_date)}`
              : calendarDay > duration
                ? 'Experiment window complete'
                : `Day ${calendarDay} of ${duration}`}
          </span>
          <span className={styles.metaItem}>
            <Clock size={13} /> ~{active.experiment.minutes_per_day} min/day
          </span>
        </div>

        <ProgressBar value={calendarProgress} max={duration} label="Calendar progress" />
        <p className={styles.completionCount}>
          {active.checkin_count} of {duration} check-ins completed
        </p>

        <div className={styles.dayIndicators}>
          {Array.from({ length: duration }, (_, index) => index + 1).map((dayNumber) => {
            const completed = active.completed_days.includes(dayNumber)
            const isCurrent = dayNumber === calendarDay
            return (
              <div
                key={dayNumber}
                className={[
                  styles.dayIndicator,
                  isCurrent ? styles.dayCurrent : '',
                  completed ? styles.dayComplete : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {completed ? <Check size={13} /> : dayNumber}
              </div>
            )
          })}
        </div>

        {calendarDay >= 1 && calendarDay <= duration && (
          <div className={styles.taskCard}>
            <div className={styles.eyebrow}>Today's task</div>
            <p className={styles.taskInstructions}>
              {task?.instructions ?? 'Complete today’s experiment task.'}
            </p>
            <div className={styles.taskMeta}>
              <span className={styles.metaItem}>
                <Clock size={12} /> {active.experiment.minutes_per_day} minutes
              </span>
              <span className={styles.metaItem}>
                <Bell size={12} /> Reminder at {user?.reminder_time?.slice(0, 5) ?? '19:30'}
              </span>
            </div>
          </div>
        )}

        {active.today_checkin_complete && (
          <div
            className={`${styles.completeStatus} ${active.can_complete ? styles.completeStatusWithAction : ''}`}
            role="status"
          >
            <p className={styles.completeTitle}>Today's check-in is complete.</p>
            {!active.can_complete && active.next_checkin_date && (
              <p className={styles.completeCopy}>
                Your next check-in will be available tomorrow,{' '}
                {formatCalendarDate(active.next_checkin_date)}.
              </p>
            )}
          </div>
        )}

        {calendarDay < 1 && active.next_checkin_date && (
          <div className={styles.availabilityStatus} role="status">
            This experiment starts on {formatCalendarDate(active.next_checkin_date)}.
          </div>
        )}

        {calendarDay > duration && (
          <div
            className={`${styles.availabilityStatus} ${styles.availabilityStatusWithAction}`}
            role="status"
          >
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
            <div className={styles.motivationOptions}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  className={`${styles.motivationButton} ${motivationBefore === value ? styles.motivationButtonSelected : ''}`}
                  type="button"
                  onClick={() => setMotivationBefore(value)}
                >
                  {value}
                </button>
              ))}
            </div>
            <div className={styles.motivationLabels}>
              <span>1: Not at all</span>
              <span>5: Very motivated</span>
            </div>
            {startCheckin.error && (
              <p className={styles.error} role="alert">
                {startCheckin.error.message}
              </p>
            )}
          </ConfirmModal>
        )}

        <button
          className={styles.endButton}
          disabled={abandon.isPending}
          onClick={() => setShowAbandonModal(true)}
        >
          {abandon.isPending ? 'Ending experiment…' : 'End experiment early'}
        </button>
        {abandon.error && (
          <p className={styles.abandonError} role="alert">
            {abandon.error.message}
          </p>
        )}
      </section>

      <section className={styles.evidenceSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Recent evidence</h3>
          <button className={styles.linkButton} onClick={() => setScreen('vault')}>
            View all
          </button>
        </div>
        <div className={styles.evidenceList}>
          {!active.recent_checkins.length && (
            <p className={styles.emptyEvidence}>
              Your check-ins will appear here as you collect evidence.
            </p>
          )}
          {active.recent_checkins.map((checkin) => (
            <Card className={styles.evidenceCard} key={checkin.day}>
              <div className={styles.evidenceHeader}>
                <span className={styles.evidenceDay}>Day {checkin.day}</span>
                <div className={styles.signals}>
                  {[
                    { label: 'Curiosity', value: checkin.curiosity },
                    { label: 'Energy', value: checkin.energy },
                  ].map(({ label, value }) => (
                    <span className={styles.signal} key={label}>
                      {label}:{' '}
                      <strong
                        className={value >= 4 ? styles.signalValueStrong : styles.signalValue}
                      >
                        {value}/5
                      </strong>
                    </span>
                  ))}
                </div>
              </div>
              <p className={styles.evidenceNote}>{checkin.notes || 'No note added.'}</p>
            </Card>
          ))}
        </div>
      </section>

      {active.recent_checkins.length >= 2 && strongestRecentSignal && (
        <Card className={styles.patternCard}>
          <div className={`${styles.patternContent} slide-in-up`}>
            <div className={styles.patternIcon}>
              <TrendingUp size={17} />
            </div>
            <div>
              <div className={styles.patternLabel}>PATTERN FORMING</div>
              <p className={styles.patternCopy}>
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
