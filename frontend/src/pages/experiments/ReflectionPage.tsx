import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/api/client'
import { Btn, Card, Badge } from '@/components/common'
import { C } from '@/app/theme'
import type { Screen } from '@/types'
import { useActiveExperiment } from '@/hooks/useActiveExperiment'

export default function ReflectionPage({ setScreen }: { setScreen: (s: Screen) => void }) {
  const [repeatIntent, setRepeatIntent] = useState(4)
  const [summary, setSummary] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: active } = useActiveExperiment()
  const submit = useMutation({
    mutationFn: () => {
      if (!active) throw new Error('No active experiment found.')
      return apiRequest(`/user-experiments/${active.id}/final-reflection/`, {
        method: 'POST', body: JSON.stringify({ repeat_intent: repeatIntent, summary }),
      })
    },
    onSuccess: () => {
      const completedId = active?.id
      queryClient.setQueryData(['active-experiment'], null)
      queryClient.invalidateQueries({ queryKey: ['evidence-vault'] })
      if (completedId) navigate(`/app/reports/${completedId}`)
      else setScreen('report')
    },
  })
  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'grid', placeItems: 'center', padding: 24 }}>
      <Card style={{ width: '100%', maxWidth: 560, padding: 32 }}>
        <Badge label="Final reflection" color={C.acc} />
        <h1 style={{ fontSize: 28, margin: '18px 0 8px' }}>What did this experiment reveal?</h1>
        <p style={{ color: C.t3, lineHeight: 1.6 }}>Your response becomes part of your evidence report. It is a clue, not a verdict.</p>
        <label style={{ display: 'block', margin: '24px 0 10px', color: C.t2 }}>Would you choose to continue this activity?</label>
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          {[1,2,3,4,5].map((value) => <button key={value} onClick={() => setRepeatIntent(value)} style={{ flex: 1, padding: 14, borderRadius: 10, border: `1px solid ${value === repeatIntent ? C.acc : C.br}`, background: value === repeatIntent ? C.accS : C.s2, color: value === repeatIntent ? C.acc : C.t2, cursor: 'pointer' }}>{value}</button>)}
        </div>
        <textarea value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="What stood out? What would you change?" style={{ width: '100%', minHeight: 130, padding: 14, borderRadius: 10, background: C.s2, color: C.t1, border: `1px solid ${C.br}`, font: 'inherit', marginBottom: 18 }} />
        {submit.error && <p role="alert" style={{ color: C.red }}>{submit.error.message}</p>}
        <Btn full size="lg" disabled={!summary.trim() || submit.isPending} onClick={() => submit.mutate()}>{submit.isPending ? 'Creating report…' : 'Complete and view report'}</Btn>
      </Card>
    </div>
  )
}
