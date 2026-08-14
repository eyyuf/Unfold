import { useLocation, useNavigate } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bookmark, Calendar, ChevronLeft, Clock, Star, TrendingUp } from 'lucide-react'
import { experimentService } from '@/services/experimentService'
import { Badge, Btn, Card, ErrorBlock, LoadingBlock } from '@/components/common'
import { C } from '@/app/theme'
import type { Screen, UserData } from '@/types'
import styles from './ExperimentDetailsPage.module.css'

export default function ExperimentDetailsPage({
  setScreen,
}: {
  setScreen: (screen: Screen) => void
}) {
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
    <div className={`${styles.page} fade-up`}>
      <button className={styles.backButton} onClick={() => setScreen('library')}>
        <ChevronLeft size={16} /> Back to experiments
      </button>

      <header className={styles.hero}>
        <div className={styles.heroBadges}>
          <div className={styles.heroIcon}>
            <Star size={20} />
          </div>
          <Badge label={experiment.category} color={C.purple} />
        </div>
        <h1 className={styles.title}>{experiment.title}</h1>
        <p className={styles.description}>{experiment.description}</p>
        <div className={styles.metadata}>
          {[
            { Icon: Calendar, label: `${experiment.duration_days} days` },
            { Icon: Clock, label: `${experiment.minutes_per_day} min/day` },
            { Icon: TrendingUp, label: 'Beginner' },
          ].map(({ Icon, label }) => (
            <div className={styles.metadataItem} key={label}>
              <Icon className={styles.metadataIcon} size={14} />
              {label}
            </div>
          ))}
        </div>
      </header>

      <Card className={styles.explanationCard}>
        <p className={styles.explanation}>
          <strong>An experiment is a short, low-pressure trial.</strong> Do the activity, check in
          honestly, and use your responses as evidence about what fits you.
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
        <section className={styles.section} key={title}>
          <h2 className={styles.sectionTitle}>{title}</h2>
          <p className={styles.sectionCopy}>{content}</p>
        </section>
      ))}

      <section className={styles.tasksSection}>
        <h2 className={styles.sectionTitle}>Sample daily tasks</h2>
        <div className={styles.taskList}>
          {tasks.map((task, index) => (
            <div className={styles.task} key={index}>
              <div className={styles.taskNumber}>{index + 1}</div>
              <span className={styles.taskCopy}>{task}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.cta}>
        <p className={styles.ctaCopy}>
          You can stop at any time. Ending an experiment does not mean you failed — it is still
          useful evidence.
        </p>
        <div className={styles.ctaActions}>
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
            <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
            {isSaved ? 'Saved' : 'Save for later'}
          </Btn>
        </div>
        {saveExperiment.error && (
          <p className={styles.error} role="alert">
            {saveExperiment.error.message}
          </p>
        )}
      </section>
    </div>
  )
}
