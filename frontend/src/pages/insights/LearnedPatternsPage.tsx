import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { insightService } from '@/services/insightService'
import { ConfirmModal, LoadingBlock, ErrorBlock, Card, Badge } from '@/components/common'
import { C } from '@/app/theme'
import type { Screen } from '@/types'
import { HypothesisCard } from '@/components/insights/HypothesisCard'
import { groupHypotheses } from '@/utils/hypotheses'

export default function LearnedPatternsPage({ setScreen }: { setScreen: (s: Screen) => void }) {
  const navigate = useNavigate()
  const [selectedHypothesisId, setSelectedHypothesisId] = useState<number | null>(null)
  const [testHypothesisId, setTestHypothesisId] = useState<number | null>(null)

  const { data: hypotheses = [], isLoading, error, refetch } = useQuery({
    queryKey: ['hypotheses'],
    queryFn: insightService.getHypotheses,
  })

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['hypothesis', selectedHypothesisId],
    queryFn: () => selectedHypothesisId ? insightService.getHypothesis(selectedHypothesisId) : null,
    enabled: !!selectedHypothesisId,
  })

  const { data: testData, isLoading: testLoading } = useQuery({
    queryKey: ['recommendation', 'hypothesis', testHypothesisId],
    queryFn: () => testHypothesisId ? insightService.getContrastRecommendation(testHypothesisId) : null,
    enabled: !!testHypothesisId,
  })

  if (isLoading) return <LoadingBlock label="Analyzing user evidence & hypotheses…" />
  if (error) return <ErrorBlock message="Could not load your learned hypotheses." onRetry={() => refetch()} />

  const { supported, emerging, uncertain, contradicted } = groupHypotheses(hypotheses)

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', padding: '32px 24px' }} className="fade-up">
      <button onClick={() => setScreen('insights')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: C.t3, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, marginBottom: 20, padding: 0 }}>
        <ChevronLeft size={16} /> Back to insights
      </button>

      <div style={{ marginBottom: 28 }}>
        <h1 className="font-serif" style={{ fontSize: 32, marginBottom: 6 }}>What I've learned about myself</h1>
        <p style={{ fontSize: 15, color: C.t3 }}>Changeable hypotheses built from your completed experiment evidence—not labels or final conclusions.</p>
      </div>

      {/* 1. Strongest Current Patterns */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.acc, letterSpacing: '0.06em', marginBottom: 14 }}>STRONGEST CURRENT PATTERNS</div>
        {supported.map(h => (
          <HypothesisCard
            key={h.id}
            hypothesis={h}
            onViewEvidence={setSelectedHypothesisId}
            onTestAssumption={setTestHypothesisId}
          />
        ))}
        {!supported.length && (
          <Card style={{ color: C.t4, fontSize: 14 }}>
            No fully supported patterns yet. Complete 3+ experiments with strong consistent signals to establish a supported pattern.
          </Card>
        )}
      </div>

      {/* 2. Emerging Patterns */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.amber, letterSpacing: '0.06em', marginBottom: 14 }}>EMERGING PATTERNS</div>
        {emerging.map(h => (
          <HypothesisCard
            key={h.id}
            hypothesis={h}
            onViewEvidence={setSelectedHypothesisId}
            onTestAssumption={setTestHypothesisId}
          />
        ))}
        {!emerging.length && (
          <Card style={{ color: C.t4, fontSize: 14 }}>
            No emerging patterns detected yet. Complete 2 experiments with positive signals to reveal an emerging hypothesis.
          </Card>
        )}
      </div>

      {/* 3. Still Uncertain */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.t4, letterSpacing: '0.06em', marginBottom: 14 }}>STILL UNCERTAIN</div>
        {uncertain.map(h => (
          <HypothesisCard
            key={h.id}
            hypothesis={h}
            onViewEvidence={setSelectedHypothesisId}
            onTestAssumption={setTestHypothesisId}
          />
        ))}
        {!uncertain.length && (
          <Card style={{ color: C.t4, fontSize: 14 }}>
            No uncertain hypotheses at present.
          </Card>
        )}
      </div>

      {/* 4. Contradicted assumptions */}
      {contradicted.length > 0 && <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.red, letterSpacing: '0.06em', marginBottom: 14 }}>LEANING AGAINST</div>
        <p style={{ color: C.t4, fontSize: 13, lineHeight: 1.55, marginBottom: 14 }}>These assumptions have received several low-fit signals. They may still change with a different context.</p>
        {contradicted.map(h => <HypothesisCard key={h.id} hypothesis={h} onViewEvidence={setSelectedHypothesisId} onTestAssumption={setTestHypothesisId} />)}
      </div>}

      {/* View Evidence Modal */}
      {selectedHypothesisId && (
        <ConfirmModal
          open={!!selectedHypothesisId}
          title={`Evidence for ${detailData?.trait.name ?? 'hypothesis'}`}
          message="Experiments that contributed to this trait hypothesis:"
          confirmLabel="Close"
          confirmVariant="primary"
          onConfirm={() => setSelectedHypothesisId(null)}
          onCancel={() => setSelectedHypothesisId(null)}
        >
          {detailLoading ? (
            <p style={{ color: C.t3 }}>Loading evidence…</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '12px 0' }}>
              {detailData?.evidence.map((ev, i) => (
                <div key={i} style={{ padding: 12, borderRadius: 8, background: C.s2, border: `1px solid ${C.br}`, fontSize: 13 }}>
                  <div style={{ fontWeight: 700, color: C.t1, marginBottom: 4 }}>{ev.experiment_title}</div>
                  <div style={{ display: 'flex', gap: 12, color: C.t3 }}>
                    <span>Fit score: <strong style={{ color: C.acc }}>{Math.round(ev.fit_score)}%</strong></span>
                    <span>Confidence: <strong>{Math.round(ev.confidence_score)}%</strong></span>
                    <span>Trait weight: <strong>{ev.weight}/5</strong></span>
                  </div>
                </div>
              ))}
              {!detailData?.evidence?.length && <p style={{ color: C.t4 }}>No supporting evidence records found.</p>}
            </div>
          )}
        </ConfirmModal>
      )}

      {/* Test Assumption Contrast Recommendation Modal */}
      {testHypothesisId && (
        <ConfirmModal
          open={!!testHypothesisId}
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
            <p style={{ color: C.t3 }}>Finding contrast test experiment…</p>
          ) : testData ? (
            <div style={{ margin: '12px 0' }}>
              <Card accent style={{ marginBottom: 14 }}>
                <Badge label={testData.recommended_experiment.category} color={C.purple} />
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: '8px 0 6px' }}>{testData.recommended_experiment.title}</h3>
                <p style={{ fontSize: 14, color: C.t3, marginBottom: 8 }}>
                  {testData.recommended_experiment.duration_days} days · ~{testData.recommended_experiment.minutes_per_day} min/day
                </p>
                <p style={{ fontSize: 14, color: C.t2, lineHeight: 1.55 }}>
                  {testData.recommended_experiment.description}
                </p>
              </Card>

              <Card style={{ background: `${C.blue}0d`, border: `1px solid ${C.blue}22` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.blue, letterSpacing: '0.05em', marginBottom: 6 }}>WHY THIS EXPERIMENT?</div>
                <p style={{ fontSize: 14, color: C.t2, lineHeight: 1.6 }}>
                  {testData.recommended_experiment.reason}
                </p>
              </Card>
            </div>
          ) : (
            <p style={{ color: C.t4 }}>No candidate experiment found for this hypothesis yet.</p>
          )}
        </ConfirmModal>
      )}
    </div>
  )
}
