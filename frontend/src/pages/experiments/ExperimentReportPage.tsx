import { useLocation, useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, ChevronLeft, ChevronRight, Shield } from 'lucide-react'
import { experimentService } from '@/services/experimentService'
import { insightService } from '@/services/insightService'
import {
  AnimatedCounter,
  Badge,
  Card,
  ErrorBlock,
  LoadingBlock,
  ScoreBar,
} from '@/components/common'
import { C } from '@/app/theme'
import type { Screen } from '@/types'
import styles from './ExperimentReportPage.module.css'

export default function ExperimentReportPage({
  setScreen,
}: {
  setScreen: (screen: Screen) => void
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const reportId = location.pathname.startsWith('/app/reports/')
    ? location.pathname.split('/').pop()
    : undefined
  const {
    data: report,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['experiment-report', reportId ?? 'latest'],
    queryFn: async () => {
      if (reportId) return experimentService.getReport(reportId)
      const reports = await experimentService.getEvidenceVault()
      return reports[0] ?? null
    },
  })
  const { data: insights } = useQuery({
    queryKey: ['insights'],
    queryFn: insightService.getInsights,
  })

  if (isLoading) return <LoadingBlock label="Building your report…" />
  if (error)
    return <ErrorBlock message="This report could not be loaded." onRetry={() => refetch()} />
  if (!report)
    return <div className={styles.empty}>Complete an experiment to see your first report.</div>

  const dimensions = Object.entries(report.dimensions).map(([label, value]) => ({ label, value }))

  return (
    <div className={`${styles.page} fade-up`}>
      <button className={styles.backButton} onClick={() => setScreen('home')}>
        <ChevronLeft size={16} /> Back
      </button>

      <header className={styles.summaryHeader}>
        <div className={styles.summaryMeta}>
          <Badge label={report.experiment.category} color={C.purple} />
          <span className={styles.startDate}>Started {report.start_date}</span>
        </div>
        <h1 className={`font-serif ${styles.title}`}>{report.experiment.title}</h1>
        <p className={styles.summaryDetails}>
          {report.experiment.duration_days} days · {report.checkin_count} check-ins collected
        </p>
      </header>

      <Card accent className={styles.fitCard}>
        <div className={styles.eyebrow}>FIT SIGNAL</div>
        <div className={styles.fitSignal}>
          <AnimatedCounter value={report.fit_signal} suffix="%" />
        </div>
        {report.confidence && (
          <div className={styles.confidence}>
            <span>Evidence confidence:</span>
            <span className={styles.confidenceValue}>
              {report.confidence.label} ({Math.round(report.confidence.score)}%)
            </span>
          </div>
        )}
        <p className={styles.fitCopy}>
          Based on your daily check-ins, completion consistency, and final reflection. This is not a
          score — it is a summary of your own responses.
        </p>
      </Card>

      {report.before_after?.interpretation && (
        <Card className={styles.motivationCard}>
          <div className={styles.motivationLabel}>BEFORE VS AFTER MOTIVATION</div>
          <p className={styles.motivationInterpretation}>{report.before_after.interpretation}</p>
          <p className={styles.motivationValues}>
            Starting motivation:{' '}
            {report.before_after.motivation_before
              ? `${Math.round(report.before_after.motivation_before)}%`
              : 'N/A'}{' '}
            · Satisfaction after:{' '}
            {report.before_after.satisfaction_after
              ? `${Math.round(report.before_after.satisfaction_after)}%`
              : 'N/A'}
          </p>
        </Card>
      )}

      <Card className={styles.dimensionsCard}>
        <h2 className={styles.cardTitle}>Dimension breakdown</h2>
        {dimensions.map(({ label, value }, index) => (
          <div className={`stagger-${Math.min(index + 1, 6)}`} key={label}>
            <ScoreBar label={label} value={value} />
          </div>
        ))}
      </Card>

      <div className={styles.insights}>
        <Card className={styles.stoodOutCard}>
          <div className={styles.insightLabel}>WHAT STOOD OUT</div>
          <p className={styles.insightCopy}>
            {report.strongest_signal} was the clearest signal in your check-ins. This may be worth
            exploring through another {report.experiment.category.toLowerCase()} experiment.
          </p>
        </Card>
        {report.pattern_updates && report.pattern_updates.length > 0 && (
          <Card className={styles.patternCard}>
            <div className={styles.insightLabel}>PATTERN CONTRIBUTION</div>
            {report.pattern_updates.map((update, index) => (
              <p className={styles.patternUpdate} key={index}>
                • {update}
              </p>
            ))}
          </Card>
        )}
      </div>

      <Card className={styles.suggestionCard}>
        <h2 className={styles.cardTitle}>What this may suggest</h2>
        <p className={styles.suggestionCopy}>
          {report.summary || 'Your responses suggest this activity deserves further exploration.'}{' '}
          This does not define your purpose; it is evidence you can compare with future experiments.
        </p>
      </Card>

      <div className={styles.disclaimer}>
        <Shield className={styles.disclaimerIcon} size={15} />
        <p className={styles.disclaimerCopy}>
          This report summarizes your check-ins and final reflection. It is not a diagnosis,
          personality label, or permanent conclusion.
        </p>
      </div>

      <section>
        <h2 className={styles.nextTitle}>Explore next</h2>
        <Card
          accent
          onClick={() =>
            insights?.next_recommendation
              ? navigate(
                  `/app/experiments/${insights.next_recommendation.recommended_experiment.slug}`,
                )
              : setScreen('library')
          }
        >
          <div className={styles.nextContent}>
            <div className={styles.nextIcon}>
              <BookOpen size={20} />
            </div>
            <div className={styles.nextDetails}>
              <Badge
                label={insights?.next_recommendation?.recommended_experiment.category ?? 'Explore'}
                color={C.purple}
              />
              <h3 className={styles.nextExperimentTitle}>
                {insights?.next_recommendation?.recommended_experiment.title ??
                  'Choose another experiment'}
              </h3>
              <p className={styles.nextCopy}>
                {insights?.next_recommendation?.recommended_experiment.reason ??
                  'Compare this result with another short trial from the library.'}
              </p>
            </div>
            <ChevronRight className={styles.nextArrow} size={16} />
          </div>
        </Card>
      </section>
    </div>
  )
}
