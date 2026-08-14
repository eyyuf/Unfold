import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { insightService } from '@/services/insightService'
import { Badge, Card, ConfirmModal, ErrorBlock, LoadingBlock } from '@/components/common'
import { C } from '@/app/theme'
import type { Screen } from '@/types'
import { HypothesisCard } from '@/components/insights/HypothesisCard'
import { groupHypotheses } from '@/utils/hypotheses'
import styles from './LearnedPatternsPage.module.css'

export default function LearnedPatternsPage({
  setScreen,
}: {
  setScreen: (screen: Screen) => void
}) {
  const navigate = useNavigate()
  const [selectedHypothesisId, setSelectedHypothesisId] = useState<number | null>(null)
  const [testHypothesisId, setTestHypothesisId] = useState<number | null>(null)

  const {
    data: hypotheses = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['hypotheses'],
    queryFn: insightService.getHypotheses,
  })

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['hypothesis', selectedHypothesisId],
    queryFn: () =>
      selectedHypothesisId ? insightService.getHypothesis(selectedHypothesisId) : null,
    enabled: Boolean(selectedHypothesisId),
  })

  const { data: testData, isLoading: testLoading } = useQuery({
    queryKey: ['recommendation', 'hypothesis', testHypothesisId],
    queryFn: () =>
      testHypothesisId ? insightService.getContrastRecommendation(testHypothesisId) : null,
    enabled: Boolean(testHypothesisId),
  })

  if (isLoading) return <LoadingBlock label="Analyzing user evidence & hypotheses…" />
  if (error)
    return (
      <ErrorBlock message="Could not load your learned hypotheses." onRetry={() => refetch()} />
    )

  const { supported, emerging, uncertain, contradicted } = groupHypotheses(hypotheses)

  return (
    <div className={`${styles.page} fade-up`}>
      <button className={styles.backButton} onClick={() => setScreen('insights')}>
        <ChevronLeft size={16} /> Back to insights
      </button>

      <header className={styles.intro}>
        <h1 className={`font-serif ${styles.title}`}>What I've learned about myself</h1>
        <p className={styles.subtitle}>
          Changeable hypotheses built from your completed experiment evidence—not labels or final
          conclusions.
        </p>
      </header>

      <section className={styles.group}>
        <div className={`${styles.groupLabel} ${styles.supportedLabel}`}>
          STRONGEST CURRENT PATTERNS
        </div>
        {supported.map((hypothesis) => (
          <HypothesisCard
            key={hypothesis.id}
            hypothesis={hypothesis}
            onViewEvidence={setSelectedHypothesisId}
            onTestAssumption={setTestHypothesisId}
          />
        ))}
        {!supported.length && (
          <Card className={styles.emptyCard}>
            No fully supported patterns yet. Complete 3+ experiments with strong consistent signals
            to establish a supported pattern.
          </Card>
        )}
      </section>

      <section className={styles.group}>
        <div className={`${styles.groupLabel} ${styles.emergingLabel}`}>EMERGING PATTERNS</div>
        {emerging.map((hypothesis) => (
          <HypothesisCard
            key={hypothesis.id}
            hypothesis={hypothesis}
            onViewEvidence={setSelectedHypothesisId}
            onTestAssumption={setTestHypothesisId}
          />
        ))}
        {!emerging.length && (
          <Card className={styles.emptyCard}>
            No emerging patterns detected yet. Complete 2 experiments with positive signals to
            reveal an emerging hypothesis.
          </Card>
        )}
      </section>

      <section className={styles.group}>
        <div className={styles.groupLabel}>STILL UNCERTAIN</div>
        {uncertain.map((hypothesis) => (
          <HypothesisCard
            key={hypothesis.id}
            hypothesis={hypothesis}
            onViewEvidence={setSelectedHypothesisId}
            onTestAssumption={setTestHypothesisId}
          />
        ))}
        {!uncertain.length && (
          <Card className={styles.emptyCard}>No uncertain hypotheses at present.</Card>
        )}
      </section>

      {contradicted.length > 0 && (
        <section className={styles.group}>
          <div className={`${styles.groupLabel} ${styles.contradictedLabel}`}>LEANING AGAINST</div>
          <p className={styles.groupCopy}>
            These assumptions have received several low-fit signals. They may still change with a
            different context.
          </p>
          {contradicted.map((hypothesis) => (
            <HypothesisCard
              key={hypothesis.id}
              hypothesis={hypothesis}
              onViewEvidence={setSelectedHypothesisId}
              onTestAssumption={setTestHypothesisId}
            />
          ))}
        </section>
      )}

      {selectedHypothesisId && (
        <ConfirmModal
          open={Boolean(selectedHypothesisId)}
          title={`Evidence for ${detailData?.trait.name ?? 'hypothesis'}`}
          message="Experiments that contributed to this trait hypothesis:"
          confirmLabel="Close"
          confirmVariant="primary"
          onConfirm={() => setSelectedHypothesisId(null)}
          onCancel={() => setSelectedHypothesisId(null)}
        >
          {detailLoading ? (
            <p className={styles.loadingCopy}>Loading evidence…</p>
          ) : (
            <div className={styles.evidenceList}>
              {detailData?.evidence.map((evidence, index) => (
                <div className={styles.evidenceItem} key={index}>
                  <div className={styles.evidenceTitle}>{evidence.experiment_title}</div>
                  <div className={styles.evidenceMetrics}>
                    <span>
                      Fit score:{' '}
                      <strong className={styles.fitScore}>{Math.round(evidence.fit_score)}%</strong>
                    </span>
                    <span>
                      Confidence: <strong>{Math.round(evidence.confidence_score)}%</strong>
                    </span>
                    <span>
                      Trait weight: <strong>{evidence.weight}/5</strong>
                    </span>
                  </div>
                </div>
              ))}
              {!detailData?.evidence?.length && (
                <p className={styles.emptyCopy}>No supporting evidence records found.</p>
              )}
            </div>
          )}
        </ConfirmModal>
      )}

      {testHypothesisId && (
        <ConfirmModal
          open={Boolean(testHypothesisId)}
          title="Test this assumption"
          message="We found an experiment to test this specific hypothesis:"
          confirmLabel="Explore experiment"
          confirmVariant="primary"
          onConfirm={() => {
            const slug = testData?.recommended_experiment.slug
            setTestHypothesisId(null)
            if (slug) navigate(`/app/experiments/${slug}`)
            else setScreen('library')
          }}
          onCancel={() => setTestHypothesisId(null)}
        >
          {testLoading ? (
            <p className={styles.loadingCopy}>Finding contrast test experiment…</p>
          ) : testData ? (
            <div className={styles.recommendation}>
              <Card accent className={styles.recommendationCard}>
                <Badge label={testData.recommended_experiment.category} color={C.purple} />
                <h3 className={styles.recommendationTitle}>
                  {testData.recommended_experiment.title}
                </h3>
                <p className={styles.recommendationMeta}>
                  {testData.recommended_experiment.duration_days} days · ~
                  {testData.recommended_experiment.minutes_per_day} min/day
                </p>
                <p className={styles.recommendationCopy}>
                  {testData.recommended_experiment.description}
                </p>
              </Card>

              <Card className={styles.reasonCard}>
                <div className={styles.reasonLabel}>WHY THIS EXPERIMENT?</div>
                <p className={styles.reasonCopy}>{testData.recommended_experiment.reason}</p>
              </Card>
            </div>
          ) : (
            <p className={styles.emptyCopy}>
              No candidate experiment found for this hypothesis yet.
            </p>
          )}
        </ConfirmModal>
      )}
    </div>
  )
}
