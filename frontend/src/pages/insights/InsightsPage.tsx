import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Star, Brain, TrendingUp } from 'lucide-react'
import { insightService } from '@/services/insightService'
import {
  AnimatedCounter,
  Btn,
  LoadingBlock,
  ErrorBlock,
  EmptyState,
  Card,
  Badge,
} from '@/components/common'
import { C } from '@/app/theme'
import type { Screen } from '@/types'
import { EvidenceMap } from '@/components/insights/EvidenceMap'
import { HowUnfoldLearns } from '@/components/insights/HowUnfoldLearns'

export default function InsightsPage({ setScreen }: { setScreen: (s: Screen) => void }) {
  const navigate = useNavigate()
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['insights'],
    queryFn: insightService.getInsights,
  })
  if (isLoading) return <LoadingBlock label="Finding patterns in your evidence…" />
  if (error)
    return <ErrorBlock message="Your insights could not be loaded." onRetry={() => refetch()} />
  if (!data?.completed_count)
    return (
      <div style={{ maxWidth: 840, margin: '0 auto', padding: '32px 24px' }} className="fade-up">
        <h1 className="font-serif" style={{ fontSize: 32, marginBottom: 6 }}>
          Your insights
        </h1>
        <p style={{ fontSize: 15, color: C.t3, marginBottom: 28 }}>
          Patterns grow as you complete experiments.
        </p>
        <HowUnfoldLearns />
        <EmptyState
          title="Patterns need more than one clue"
          copy="Complete your first experiment to begin seeing personal patterns."
          action="Explore experiments"
          onAction={() => setScreen('library')}
        />
      </div>
    )
  const patterns = (data?.patterns ?? []).map((text, index) => ({
    text,
    color: [C.purple, C.blue, C.acc][index % 3],
    Icon: [Star, Brain, TrendingUp][index % 3],
  }))
  const categoryColors: Record<string, string> = {
    Creative: C.purple,
    Technical: C.blue,
    Social: C.orange,
    Nature: C.acc,
    Service: C.teal,
    Business: C.indigo,
    Physical: C.amber,
  }
  const categories = data.categories.map((item) => ({
    label: item.label,
    v: item.value,
    n: item.count,
    color: categoryColors[item.label] ?? C.acc,
  }))

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', padding: '32px 24px' }} className="fade-up">
      <div
        style={{
          marginBottom: 28,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        <div>
          <h1 className="font-serif" style={{ fontSize: 32, marginBottom: 6 }}>
            Your insights
          </h1>
          <p style={{ fontSize: 15, color: C.t3 }}>
            Patterns from {data?.completed_count ?? 0} completed experiments.
          </p>
        </div>
        <Btn variant="secondary" size="sm" onClick={() => setScreen('learned')}>
          What I've learned <ChevronRight size={14} />
        </Btn>
      </div>

      <HowUnfoldLearns />

      {/* Constellation evidence map */}
      <Card
        style={{
          marginBottom: 28,
          padding: '28px',
          overflow: 'hidden',
          position: 'relative',
          background: `radial-gradient(ellipse at 30% 30%, rgba(34,197,94,0.05) 0%, transparent 60%)`,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: C.t4,
            letterSpacing: '0.05em',
            marginBottom: 16,
          }}
        >
          EVIDENCE MAP
        </div>
        <EvidenceMap
          nodes={data.evidence_map}
          categoryColors={categoryColors}
          onNodeClick={(id) => navigate(`/app/reports/${id}`)}
        />
        <div style={{ display: 'flex', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
          {Object.entries(
            data.evidence_map.reduce<Record<string, string>>((acc, n) => {
              acc[n.category] = categoryColors[n.category] ?? C.acc
              return acc
            }, {}),
          ).map(([cat, color]) => (
            <div
              key={cat}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.t3 }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
              {cat}
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.t4 }}>
            <div style={{ width: 20, height: 2, background: 'rgba(34,197,94,0.35)' }} />
            shared signal
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.t4 }}>
            <div
              style={{
                width: 20,
                height: 2,
                background: 'rgba(63,63,70,0.4)',
                borderTop: '1px dashed rgba(63,63,70,0.6)',
              }}
            />
            same category
          </div>
        </div>
      </Card>

      {/* Pattern cards */}
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: C.t4,
            letterSpacing: '0.05em',
            marginBottom: 14,
          }}
        >
          EMERGING PATTERNS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {patterns.map(({ text, color, Icon }) => (
            <Card key={text} style={{ background: `${color}0d`, border: `1px solid ${color}20` }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    background: `${color}18`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={17} color={color} />
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: C.t1 }}>{text}</p>
              </div>
            </Card>
          ))}
          {!patterns.length && (
            <p style={{ color: C.t4 }}>Complete more experiments to reveal repeated signals.</p>
          )}
        </div>
      </div>

      {/* Category fit scores */}
      <Card style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>Category fit signals</h2>
        {categories.map(({ label, v, color, n }) => (
          <div key={label} style={{ marginBottom: 16 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Badge label={label} color={color} />
                <span style={{ fontSize: 12, color: C.t4 }}>
                  {n} experiment{n > 1 ? 's' : ''}
                </span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: v >= 70 ? C.acc : C.t2 }}>
                {v}%
              </span>
            </div>
            <div style={{ height: 8, background: C.s2, borderRadius: 999 }}>
              <div
                style={{
                  height: '100%',
                  width: `${v}%`,
                  background: color,
                  borderRadius: 999,
                  opacity: 0.85,
                }}
              />
            </div>
          </div>
        ))}
      </Card>

      {/* Metrics row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 14,
        }}
      >
        {[
          {
            label: 'Avg fit signal',
            value: data?.average_fit ?? 0,
            sfx: '%',
            sub: `across ${data?.completed_count ?? 0} experiments`,
            color: C.acc,
          },
          {
            label: 'Curiosity rate',
            value: Math.round((data.average_curiosity ?? 0) * 10) / 10,
            sfx: '/5',
            sub: 'avg across all check-ins',
            color: C.blue,
          },
          {
            label: 'Repeat intent',
            value: data.average_repeat_intent ?? 0,
            sfx: '%',
            sub: 'from final reflections',
            color: C.purple,
          },
          {
            label: 'Consistency',
            value: data.average_consistency ?? 0,
            sfx: '%',
            sub: 'planned days with check-ins',
            color: C.amber,
          },
        ].map(({ label, value, sfx, sub, color }) => (
          <Card key={label} style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color, marginBottom: 4 }}>
              <AnimatedCounter value={value} suffix={sfx} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.t2, marginBottom: 2 }}>
              {label}
            </div>
            <div style={{ fontSize: 12, color: C.t4 }}>{sub}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}
