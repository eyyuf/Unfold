import { Compass, Archive, ArrowRight, Play, Brain, TrendingUp, Sparkles } from 'lucide-react'
import { Card } from '@/components/common'
import { C } from '@/app/theme'

export function HowUnfoldLearns() {
  const steps = [
    { label: 'You try', Icon: Play },
    { label: 'Reflect', Icon: Sparkles },
    { label: 'Evidence', Icon: Archive },
    { label: 'Patterns', Icon: TrendingUp },
    { label: 'Hypothesis', Icon: Brain },
    { label: 'Test again', Icon: Compass },
  ]
  return (
    <Card
      style={{
        marginBottom: 28,
        background: `linear-gradient(135deg, ${C.accS}, ${C.s1})`,
        border: `1px solid ${C.accB}`,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: C.acc,
          letterSpacing: '0.05em',
          marginBottom: 8,
        }}
      >
        HOW UNFOLD LEARNS
      </div>
      <p style={{ color: C.t3, fontSize: 14, lineHeight: 1.6, marginBottom: 18 }}>
        Unfold does not assign you a fixed identity. It turns repeated, self-reported experiences
        into assumptions you can test.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {steps.map(({ label, Icon }, index) => (
          <div key={label} style={{ display: 'contents' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '9px 11px',
                borderRadius: 10,
                background: C.s2,
                border: `1px solid ${C.br}`,
                fontSize: 12,
                fontWeight: 700,
                color: C.t2,
              }}
            >
              <Icon size={14} color={C.acc} />
              {label}
            </div>
            {index < steps.length - 1 && <ArrowRight size={14} color={C.t4} aria-hidden="true" />}
          </div>
        ))}
      </div>
    </Card>
  )
}
