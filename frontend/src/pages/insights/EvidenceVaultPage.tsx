import { useNavigate } from 'react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { apiRequest } from '@/api/client'
import { AnimatedCounter, LoadingBlock, ErrorBlock, EmptyState, Card, Badge } from '@/components/common'
import { C } from '@/app/theme'
import type { Screen, ExperimentReport } from '@/types'

export default function EvidenceVaultPage({ setScreen: _setScreen }: { setScreen: (s: Screen) => void }) {
  const navigate = useNavigate()
  const { data: entries = [], isLoading, error, refetch } = useQuery({
    queryKey: ['evidence-vault'],
    queryFn: () => apiRequest<ExperimentReport[]>('/evidence-vault/'),
  })
  const exportVault = useMutation({
    mutationFn: () => apiRequest<Record<string, unknown>>('/auth/export/'),
    onSuccess: (data) => {
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `unfold-evidence-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(url)
    },
  })
  if (isLoading) return <LoadingBlock label="Opening your Evidence Vault…" />
  if (error) return <ErrorBlock message="Your Evidence Vault could not be loaded." onRetry={() => refetch()} />
  if (!entries.length) return <EmptyState title="Your Evidence Vault is empty" copy="Complete an experiment to add your first entry." action="Explore experiments" onAction={() => navigate('/app/explore')} />
  const averageFit = entries.length ? Math.round(entries.reduce((sum, entry) => sum + entry.fit_signal, 0) / entries.length) : 0

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }} className="fade-up">
      <div className="vault-header">
        <div>
          <h1 className="font-serif" style={{ fontSize: 32, marginBottom: 6 }}>Evidence Vault</h1>
          <p style={{ fontSize: 15, color: C.t3 }}>Your personal archive of completed experiments.</p>
        </div>
        <button disabled={exportVault.isPending} onClick={() => exportVault.mutate()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.t4, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: 'inherit' }}>
          <Download size={14} /> {exportVault.isPending ? 'Preparing…' : 'Export'}
        </button>
      </div>

      {/* Summary row */}
      <div className="vault-summary-grid">
        {[{ n: entries.length, l: 'experiments' }, { n: averageFit, s: '%', l: 'avg fit signal' }, { n: entries.reduce((sum, entry) => sum + entry.checkin_count, 0), l: 'check-ins' }].map(({ n, s, l }) => (
          <Card key={l} style={{ textAlign: 'center', padding: '16px 12px' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.t1, marginBottom: 2 }}><AnimatedCounter value={n} suffix={s || ''} /></div>
            <div style={{ fontSize: 12, color: C.t4 }}>{l}</div>
          </Card>
        ))}
      </div>

      {/* Entries */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}>
        <div className="timeline-line" />
        {entries.map((entry, idx) => (
          <Card key={entry.id} className={`vault-entry stagger-${Math.min(idx + 1, 6)}`} onClick={() => navigate(`/app/reports/${entry.id}`)} style={{ cursor: 'pointer', marginLeft: 32 }} >
            <div style={{ position: 'absolute', left: 15, marginTop: 20, width: 12, height: 12, borderRadius: '50%', background: entry.fit_signal >= 70 ? C.acc : C.amber, border: `2px solid ${C.bg}`, zIndex: 2 }} />
            <div className="vault-entry-header">
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Badge label={entry.experiment.category} color={C.purple} />
                {entry.status === 'abandoned' && <span style={{ fontSize: 11, color: C.t4, fontWeight: 600 }}>Ended early</span>}
              </div>
              <span style={{ fontSize: 13, color: C.t4 }}>Started {entry.start_date}</span>
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>{entry.experiment.title}</h3>
            <div style={{ display: 'flex', gap: 20, marginBottom: 12, fontSize: 14 }}>
              <div>
                <span style={{ color: C.t4, fontSize: 12 }}>Fit signal </span>
                <strong style={{ color: entry.fit_signal >= 70 ? C.acc : entry.fit_signal >= 50 ? C.amber : C.t2 }}>{entry.fit_signal}%</strong>
              </div>
              <div>
                <span style={{ color: C.t4, fontSize: 12 }}>Strongest signal </span>
                <strong style={{ color: C.t2 }}>{entry.strongest_signal}</strong>
              </div>
            </div>
            <div style={{ borderTop: `1px solid ${C.br}`, paddingTop: 12 }}>
              <p style={{ fontSize: 13, color: C.t3, fontStyle: 'italic', margin: 0 }}>{entry.summary || 'Evidence collected from your daily check-ins.'}</p>
              <p style={{ fontSize: 12, color: C.t4, margin: '8px 0 0' }}>{entry.checkin_count} of {entry.experiment.duration_days} planned check-ins · Open the report to inspect its source signals.</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
