import { useNavigate } from 'react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { authService } from '@/services/authService'
import { experimentService } from '@/services/experimentService'
import {
  AnimatedCounter,
  Badge,
  Card,
  EmptyState,
  ErrorBlock,
  LoadingBlock,
} from '@/components/common'
import { C } from '@/app/theme'
import type { Screen } from '@/types'
import styles from './EvidenceVaultPage.module.css'

export default function EvidenceVaultPage({
  setScreen: _setScreen,
}: {
  setScreen: (screen: Screen) => void
}) {
  const navigate = useNavigate()
  const {
    data: entries = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['evidence-vault'],
    queryFn: experimentService.getEvidenceVault,
  })
  const exportVault = useMutation({
    mutationFn: authService.exportUserData,
    onSuccess: (data) => {
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
      )
      const link = document.createElement('a')
      link.href = url
      link.download = `unfold-evidence-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(url)
    },
  })

  if (isLoading) return <LoadingBlock label="Opening your Evidence Vault…" />
  if (error)
    return (
      <ErrorBlock message="Your Evidence Vault could not be loaded." onRetry={() => refetch()} />
    )
  if (!entries.length)
    return (
      <EmptyState
        title="Your Evidence Vault is empty"
        copy="Complete an experiment to add your first entry."
        action="Explore experiments"
        onAction={() => navigate('/app/explore')}
      />
    )

  const averageFit = Math.round(
    entries.reduce((sum, entry) => sum + entry.fit_signal, 0) / entries.length,
  )

  return (
    <div className={`${styles.page} fade-up`}>
      <header className={styles.header}>
        <div>
          <h1 className={`font-serif ${styles.title}`}>Evidence Vault</h1>
          <p className={styles.subtitle}>Your personal archive of completed experiments.</p>
        </div>
        <button
          className={styles.exportButton}
          disabled={exportVault.isPending}
          onClick={() => exportVault.mutate()}
        >
          <Download size={14} /> {exportVault.isPending ? 'Preparing…' : 'Export'}
        </button>
      </header>

      <div className={styles.summaryGrid}>
        {[
          { value: entries.length, label: 'experiments' },
          { value: averageFit, suffix: '%', label: 'avg fit signal' },
          {
            value: entries.reduce((sum, entry) => sum + entry.checkin_count, 0),
            label: 'check-ins',
          },
        ].map(({ value, suffix, label }) => (
          <Card className={styles.summaryCard} key={label}>
            <div className={styles.summaryValue}>
              <AnimatedCounter value={value} suffix={suffix ?? ''} />
            </div>
            <div className={styles.summaryLabel}>{label}</div>
          </Card>
        ))}
      </div>

      <div className={styles.entries}>
        <div className={styles.timeline} />
        {entries.map((entry, index) => {
          const fitSignalClass =
            entry.fit_signal >= 70
              ? styles.fitSignalStrong
              : entry.fit_signal >= 50
                ? styles.fitSignalMedium
                : styles.fitSignal

          return (
            <Card
              className={`${styles.entryCard} stagger-${Math.min(index + 1, 6)}`}
              key={entry.id}
              onClick={() => navigate(`/app/reports/${entry.id}`)}
            >
              <div
                className={`${styles.timelineDot} ${entry.fit_signal >= 70 ? styles.timelineDotStrong : ''}`}
              />
              <div className={styles.entryHeader}>
                <div className={styles.entryBadges}>
                  <Badge label={entry.experiment.category} color={C.purple} />
                  {entry.status === 'abandoned' && (
                    <span className={styles.endedLabel}>Ended early</span>
                  )}
                </div>
                <span className={styles.startDate}>Started {entry.start_date}</span>
              </div>
              <h3 className={styles.entryTitle}>{entry.experiment.title}</h3>
              <div className={styles.entryMetrics}>
                <div>
                  <span className={styles.metricLabel}>Fit signal </span>
                  <strong className={fitSignalClass}>{entry.fit_signal}%</strong>
                </div>
                <div>
                  <span className={styles.metricLabel}>Strongest signal </span>
                  <strong className={styles.strongestSignal}>{entry.strongest_signal}</strong>
                </div>
              </div>
              <div className={styles.entryEvidence}>
                <p className={styles.summary}>
                  {entry.summary || 'Evidence collected from your daily check-ins.'}
                </p>
                <p className={styles.sourceNote}>
                  {entry.checkin_count} of {entry.experiment.duration_days} planned check-ins · Open
                  the report to inspect its source signals.
                </p>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
