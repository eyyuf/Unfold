import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Brain, ChevronRight, Star, TrendingUp } from 'lucide-react'
import { insightService } from '@/services/insightService'
import {
  AnimatedCounter,
  Badge,
  Btn,
  Card,
  EmptyState,
  ErrorBlock,
  LoadingBlock,
} from '@/components/common'
import { C } from '@/app/theme'
import type { Screen } from '@/types'
import { EvidenceMap } from '@/components/insights/EvidenceMap'
import { HowUnfoldLearns } from '@/components/insights/HowUnfoldLearns'
import styles from './InsightsPage.module.css'

type ColorProperties = CSSProperties & { '--item-color': string }

function colorProperties(color: string): ColorProperties {
  return { '--item-color': color }
}

export default function InsightsPage({ setScreen }: { setScreen: (screen: Screen) => void }) {
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
      <div className={`${styles.page} fade-up`}>
        <div className={styles.emptyIntro}>
          <h1 className={`font-serif ${styles.title}`}>Your insights</h1>
          <p className={styles.subtitle}>Patterns grow as you complete experiments.</p>
        </div>
        <HowUnfoldLearns />
        <EmptyState
          title="Patterns need more than one clue"
          copy="Complete your first experiment to begin seeing personal patterns."
          action="Explore experiments"
          onAction={() => setScreen('library')}
        />
      </div>
    )

  const patterns = (data.patterns ?? []).map((text, index) => ({
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
    value: item.value,
    count: item.count,
    color: categoryColors[item.label] ?? C.acc,
  }))

  return (
    <div className={`${styles.page} fade-up`}>
      <header className={styles.header}>
        <div>
          <h1 className={`font-serif ${styles.title}`}>Your insights</h1>
          <p className={styles.subtitle}>
            Patterns from {data.completed_count} completed experiments.
          </p>
        </div>
        <Btn variant="secondary" size="sm" onClick={() => setScreen('learned')}>
          What I've learned <ChevronRight size={14} />
        </Btn>
      </header>

      <HowUnfoldLearns />

      <Card className={styles.mapCard}>
        <div className={styles.sectionLabel}>EVIDENCE MAP</div>
        <EvidenceMap
          nodes={data.evidence_map}
          categoryColors={categoryColors}
          onNodeClick={(id) => navigate(`/app/reports/${id}`)}
        />
        <div className={styles.legend}>
          {Object.entries(
            data.evidence_map.reduce<Record<string, string>>((entries, node) => {
              entries[node.category] = categoryColors[node.category] ?? C.acc
              return entries
            }, {}),
          ).map(([category, color]) => (
            <div className={styles.legendItem} key={category}>
              <div className={styles.legendDot} style={colorProperties(color)} />
              {category}
            </div>
          ))}
          <div className={styles.legendMuted}>
            <div className={styles.legendLine} />
            shared signal
          </div>
          <div className={styles.legendMuted}>
            <div className={styles.legendDashedLine} />
            same category
          </div>
        </div>
      </Card>

      <section className={styles.patternsSection}>
        <div className={styles.sectionLabel}>EMERGING PATTERNS</div>
        <div className={styles.patternList}>
          {patterns.map(({ text, color, Icon }) => (
            <Card className={styles.patternCard} key={text} style={colorProperties(color)}>
              <div className={styles.patternContent}>
                <div className={styles.patternIcon}>
                  <Icon size={17} />
                </div>
                <p className={styles.patternText}>{text}</p>
              </div>
            </Card>
          ))}
          {!patterns.length && (
            <p className={styles.emptyPatterns}>
              Complete more experiments to reveal repeated signals.
            </p>
          )}
        </div>
      </section>

      <Card className={styles.categoryCard}>
        <h2 className={styles.cardTitle}>Category fit signals</h2>
        {categories.map(({ label, value, color, count }) => (
          <div className={styles.categoryRow} key={label}>
            <div className={styles.categoryHeader}>
              <div className={styles.categoryMeta}>
                <Badge label={label} color={color} />
                <span className={styles.categoryCount}>
                  {count} experiment{count > 1 ? 's' : ''}
                </span>
              </div>
              <span
                className={`${styles.categoryValue} ${value >= 70 ? styles.categoryValueStrong : ''}`}
              >
                {value}%
              </span>
            </div>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ ...colorProperties(color), width: `${value}%` }}
              />
            </div>
          </div>
        ))}
      </Card>

      <div className={styles.metrics}>
        {[
          {
            label: 'Avg fit signal',
            value: data.average_fit ?? 0,
            suffix: '%',
            subtext: `across ${data.completed_count} experiments`,
            color: C.acc,
          },
          {
            label: 'Curiosity rate',
            value: Math.round((data.average_curiosity ?? 0) * 10) / 10,
            suffix: '/5',
            subtext: 'avg across all check-ins',
            color: C.blue,
          },
          {
            label: 'Repeat intent',
            value: data.average_repeat_intent ?? 0,
            suffix: '%',
            subtext: 'from final reflections',
            color: C.purple,
          },
          {
            label: 'Consistency',
            value: data.average_consistency ?? 0,
            suffix: '%',
            subtext: 'planned days with check-ins',
            color: C.amber,
          },
        ].map(({ label, value, suffix, subtext, color }) => (
          <Card className={styles.metricCard} key={label}>
            <div className={styles.metricValue} style={colorProperties(color)}>
              <AnimatedCounter value={value} suffix={suffix} />
            </div>
            <div className={styles.metricLabel}>{label}</div>
            <div className={styles.metricSubtext}>{subtext}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}
