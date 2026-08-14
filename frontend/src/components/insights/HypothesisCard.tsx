import { Btn, Card, Badge } from '@/components/common'
import { C } from '@/app/theme'
import type { UserHypothesisData } from '@/types'

export function HypothesisCard({
  hypothesis,
  onViewEvidence,
  onTestAssumption,
}: {
  hypothesis: UserHypothesisData
  onViewEvidence: (id: number) => void
  onTestAssumption: (id: number) => void
}) {
  const statusColors: Record<string, string> = {
    supported: C.acc,
    emerging: C.amber,
    contradicted: C.red,
    uncertain: C.t4,
  }

  const color = statusColors[hypothesis.status] ?? C.acc
  const statusMeaning: Record<UserHypothesisData['status'], string> = {
    supported: 'Repeated, consistent evidence supports this for now.',
    emerging: 'Positive signals are repeating, but more contrast is useful.',
    uncertain: 'There is not enough consistent evidence yet.',
    contradicted: 'Repeated evidence has leaned against this assumption so far.',
  }

  return (
    <Card style={{ background: `${color}09`, border: `1px solid ${color}25`, marginBottom: 14 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 10,
        }}
      >
        <Badge label={hypothesis.status_display} color={color} />
        <span style={{ fontSize: 12, color: C.t4 }}>
          {hypothesis.evidence_count} experiment{hypothesis.evidence_count !== 1 ? 's' : ''}
        </span>
      </div>

      <h3 style={{ fontSize: 17, fontWeight: 700, color: C.t1, marginBottom: 6 }}>
        {hypothesis.trait.name}
      </h3>

      <p style={{ fontSize: 14, color: C.t2, lineHeight: 1.6, marginBottom: 14 }}>
        {hypothesis.status === 'contradicted'
          ? hypothesis.trait.negative_hypothesis_text ||
            `${hypothesis.trait.name} activities have not consistently produced positive signals yet.`
          : hypothesis.trait.positive_hypothesis_text ||
            `${hypothesis.trait.name} activities repeatedly produce positive signals for you.`}
      </p>
      <p style={{ fontSize: 12, color: C.t4, lineHeight: 1.55, margin: '-6px 0 14px' }}>
        {statusMeaning[hypothesis.status]} This can change as you test it in new settings.
      </p>

      <div
        style={{
          display: 'flex',
          gap: 16,
          fontSize: 13,
          color: C.t3,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          Support:{' '}
          <span style={{ fontWeight: 700, color: C.t1 }}>
            {Math.round(hypothesis.support_score)}%
          </span>
        </div>
        <div>
          Confidence:{' '}
          <span style={{ fontWeight: 700, color: C.t1 }}>
            {Math.round(hypothesis.confidence_score)}%
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Btn variant="ghost" size="sm" onClick={() => onViewEvidence(hypothesis.id)}>
          View evidence
        </Btn>
        {(hypothesis.status === 'emerging' || hypothesis.status === 'supported') && (
          <Btn variant="secondary" size="sm" onClick={() => onTestAssumption(hypothesis.id)}>
            Test this assumption
          </Btn>
        )}
      </div>
    </Card>
  )
}
