import { useLocation, useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, ChevronLeft, BookOpen, Shield } from 'lucide-react'
import { experimentService } from '@/services/experimentService'
import { insightService } from '@/services/insightService'
import {
  AnimatedCounter,
  LoadingBlock,
  ErrorBlock,
  Card,
  Badge,
  ScoreBar,
} from '@/components/common'
import { C } from '@/app/theme'
import type { Screen } from '@/types'

export default function ExperimentReportPage({ setScreen }: { setScreen: (s: Screen) => void }) {
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
    return (
      <div style={{ padding: 40, color: C.t3 }}>
        Complete an experiment to see your first report.
      </div>
    )
  const dims = Object.entries(report.dimensions).map(([l, v]) => ({ l, v }))

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }} className="fade-up">
      {/* Header */}
      <button
        onClick={() => setScreen('home')}
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
        <ChevronLeft size={16} /> Back
      </button>

      {/* Experiment summary */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
          <Badge label={report.experiment.category} color={C.purple} />
          <span style={{ fontSize: 13, color: C.t4 }}>Started {report.start_date}</span>
        </div>
        <h1 className="font-serif" style={{ fontSize: 32, marginBottom: 4 }}>
          {report.experiment.title}
        </h1>
        <p style={{ fontSize: 15, color: C.t3 }}>
          {report.experiment.duration_days} days · {report.checkin_count} check-ins collected
        </p>
      </div>

      {/* Fit signal */}
      <Card accent style={{ textAlign: 'center', marginBottom: 24, padding: '32px 24px' }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: C.t4,
            letterSpacing: '0.06em',
            marginBottom: 12,
          }}
        >
          FIT SIGNAL
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: C.acc,
            lineHeight: 1,
            marginBottom: 8,
            letterSpacing: '-0.04em',
          }}
        >
          <AnimatedCounter value={report.fit_signal} suffix="%" />
        </div>
        {report.confidence && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 999,
              background: C.s2,
              border: `1px solid ${C.br}`,
              fontSize: 13,
              fontWeight: 600,
              color: C.t2,
              marginBottom: 12,
            }}
          >
            <span>Evidence confidence:</span>
            <span style={{ color: C.acc }}>
              {report.confidence.label} ({Math.round(report.confidence.score)}%)
            </span>
          </div>
        )}
        <p style={{ fontSize: 14, color: C.t3, maxWidth: 380, margin: '0 auto' }}>
          Based on your daily check-ins, completion consistency, and final reflection. This is not a
          score — it is a summary of your own responses.
        </p>
      </Card>

      {/* Before vs After Motivation Delta */}
      {report.before_after?.interpretation && (
        <Card
          style={{ marginBottom: 24, background: `${C.blue}0d`, border: `1px solid ${C.blue}22` }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: C.blue,
              letterSpacing: '0.05em',
              marginBottom: 6,
            }}
          >
            BEFORE VS AFTER MOTIVATION
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: C.t1, marginBottom: 4 }}>
            {report.before_after.interpretation}
          </p>
          <p style={{ fontSize: 13, color: C.t4 }}>
            Starting motivation:{' '}
            {report.before_after.motivation_before
              ? Math.round(report.before_after.motivation_before) + '%'
              : 'N/A'}{' '}
            · Satisfaction after:{' '}
            {report.before_after.satisfaction_after
              ? Math.round(report.before_after.satisfaction_after) + '%'
              : 'N/A'}
          </p>
        </Card>
      )}

      {/* Dimension scores */}
      <Card style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>Dimension breakdown</h2>
        {dims.map((d, i) => (
          <div key={d.l} className={`stagger-${Math.min(i + 1, 6)}`}>
            <ScoreBar label={d.l} value={d.v} />
          </div>
        ))}
      </Card>

      {/* Insight cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
        <Card style={{ background: `${C.acc}0e`, border: `1px solid ${C.acc}22` }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: C.acc,
              letterSpacing: '0.05em',
              marginBottom: 8,
            }}
          >
            WHAT STOOD OUT
          </div>
          <p style={{ fontSize: 15, color: C.t2, lineHeight: 1.65 }}>
            {report.strongest_signal} was the clearest signal in your check-ins. This may be worth
            exploring through another {report.experiment.category.toLowerCase()} experiment.
          </p>
        </Card>
        {report.pattern_updates && report.pattern_updates.length > 0 && (
          <Card style={{ background: `${C.purple}0e`, border: `1px solid ${C.purple}22` }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: C.purple,
                letterSpacing: '0.05em',
                marginBottom: 8,
              }}
            >
              PATTERN CONTRIBUTION
            </div>
            {report.pattern_updates.map((update, idx) => (
              <p key={idx} style={{ fontSize: 14, color: C.t2, lineHeight: 1.5, marginBottom: 4 }}>
                • {update}
              </p>
            ))}
          </Card>
        )}
      </div>

      {/* What this may suggest */}
      <Card style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>What this may suggest</h2>
        <p style={{ fontSize: 15, color: C.t2, lineHeight: 1.7 }}>
          {report.summary || 'Your responses suggest this activity deserves further exploration.'}{' '}
          This does not define your purpose; it is evidence you can compare with future experiments.
        </p>
      </Card>

      {/* Transparency */}
      <div
        style={{
          padding: '14px 18px',
          background: C.s1,
          borderRadius: 12,
          border: `1px solid ${C.br}`,
          marginBottom: 28,
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
        }}
      >
        <Shield size={15} color={C.t4} style={{ marginTop: 1, flexShrink: 0 }} />
        <p style={{ fontSize: 13, color: C.t4, lineHeight: 1.55 }}>
          This report summarizes your check-ins and final reflection. It is not a diagnosis,
          personality label, or permanent conclusion.
        </p>
      </div>

      {/* Next experiment */}
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Explore next</h2>
        <Card
          accent
          onClick={() =>
            insights?.next_recommendation
              ? navigate(
                  `/app/experiments/${insights.next_recommendation.recommended_experiment.slug}`,
                )
              : setScreen('library')
          }
          style={{ cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 11,
                background: `${C.purple}18`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <BookOpen size={20} color={C.purple} />
            </div>
            <div style={{ flex: 1 }}>
              <Badge
                label={insights?.next_recommendation?.recommended_experiment.category ?? 'Explore'}
                color={C.purple}
              />
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: '6px 0 4px' }}>
                {insights?.next_recommendation?.recommended_experiment.title ??
                  'Choose another experiment'}
              </h3>
              <p style={{ fontSize: 13, color: C.t3 }}>
                {insights?.next_recommendation?.recommended_experiment.reason ??
                  'Compare this result with another short trial from the library.'}
              </p>
            </div>
            <ChevronRight size={16} color={C.acc} />
          </div>
        </Card>
      </div>
    </div>
  )
}
