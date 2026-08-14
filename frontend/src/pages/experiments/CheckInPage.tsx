import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, ChevronLeft, Check, X, Sparkles } from 'lucide-react'
import { experimentService } from '@/services/experimentService'
import { Btn } from '@/components/common'
import { C } from '@/app/theme'
import type { Screen } from '@/types'
import { useActiveExperiment } from '@/hooks/useActiveExperiment'

export default function CheckInPage({ setScreen }: { setScreen: (s: Screen) => void }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [notes, setNotes] = useState('')
  const [draftLoaded, setDraftLoaded] = useState(false)
  const { data: active } = useActiveExperiment()
  const queryClient = useQueryClient()
  const draftKey = active ? `unfold-checkin-draft-${active.id}-${active.current_day}` : ''
  useEffect(() => {
    if (!draftKey) return
    try {
      const draft = JSON.parse(localStorage.getItem(draftKey) ?? 'null')
      if (draft) {
        setAnswers(draft.answers ?? {})
        setNotes(draft.notes ?? '')
        setStep(Math.min(Number(draft.step) || 0, 6))
      }
    } finally {
      setDraftLoaded(true)
    }
  }, [draftKey])
  useEffect(() => {
    if (!draftKey || !draftLoaded) return
    localStorage.setItem(draftKey, JSON.stringify({ answers, notes, step }))
  }, [answers, draftKey, draftLoaded, notes, step])
  const submit = useMutation({
    mutationFn: () => {
      if (!active) throw new Error('Start an experiment before checking in.')
      return experimentService.submitCheckIn(active.id, {
          day: active.current_day,
          enjoyment: answers[1] ?? 3,
          energy_after: answers[2] ?? 3,
          curiosity: answers[3] ?? 3,
          meaning: answers[4] ?? 3,
          desire_to_continue: answers[5] ?? 3,
          desire_to_improve: answers[6] ?? 3,
          lost_track_of_time: answers[7] ?? 3,
          difficulty: answers[8] ?? 3,
          satisfaction_after: answers[9] ?? 3,
          minutes_spent: active.experiment.minutes_per_day,
          notes,
          is_complete: true,
      })
    },
    onSuccess: async () => {
      if (draftKey) localStorage.removeItem(draftKey)
      await queryClient.invalidateQueries({ queryKey: ['active-experiment'] })
      setScreen('checkin-done')
    },
  })

  const questions = [
    { q: 'Did you complete today\'s task?', type: 'yn' },
    { q: 'How enjoyable was it?', labels: ['Not at all', 'Very enjoyable'] },
    { q: 'How energized do you feel?', labels: ['Drained', 'Energized'] },
    { q: 'How curious did it make you?', labels: ['Not curious', 'Very curious'] },
    { q: 'How meaningful did it feel?', labels: ['Not meaningful', 'Very meaningful'] },
    { q: 'Would you like to continue?', labels: ['Definitely not', 'Absolutely yes'] },
    { q: 'Did you want to improve?', labels: ['No desire', 'Strong desire'] },
    { q: 'Did you lose track of time?', labels: ['Focused on time', 'Felt flow'] },
    { q: 'How difficult was it?', labels: ['Very easy', 'Very difficult'] },
    { q: 'How satisfied are you that you did it?', labels: ['Unsatisfied', 'Very satisfied'] },
    { q: 'Add a note (optional)', type: 'note' },
  ]

  const current = questions[step]
  const total = questions.length

  const select = (v: number) => {
    setAnswers(a => ({ ...a, [step]: v }))
    setTimeout(() => step < total - 1 ? setStep(s => s + 1) : setScreen('checkin-done'), current.type === 'note' ? 0 : 320)
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Fixed header */}
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.br}`, background: C.bg2, display: 'flex', alignItems: 'center', gap: 16 }}>
        <button aria-label="Close check-in" onClick={() => setScreen('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.t3 }}><X size={20} /></button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.t4 }}>{active?.experiment.title ?? 'Active experiment'} — Day {active?.current_day ?? 1}</span>
            <span style={{ fontSize: 13, color: C.t4 }}>{step + 1}/{total}</span>
          </div>
          <div style={{ height: 4, background: C.s2, borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${((step + 1) / total) * 100}%`, background: C.acc, transition: 'width 0.4s ease', borderRadius: 2 }} />
          </div>
        </div>
      </div>

      {/* Question */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 24px', maxWidth: 520, margin: '0 auto', width: '100%' }} className="slide-in-right" key={step}>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 40, letterSpacing: '-0.02em', textAlign: 'center' }}>
          {current.q}
        </h2>

        {current.type === 'yn' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[{ label: 'Yes, I completed it', v: 1, color: C.acc }, { label: 'Partially completed', v: 2, color: C.amber }, { label: 'Not today', v: 0, color: C.t3 }].map(({ label, v, color }) => (
              <button key={v} onClick={() => select(v)} style={{
                padding: '18px', borderRadius: 12, border: `1px solid ${answers[step] === v ? `${color}55` : C.br}`,
                background: answers[step] === v ? `${color}14` : C.s1,
                color: answers[step] === v ? color : C.t2,
                fontFamily: 'inherit', fontSize: 16, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
              }}>
                {label}
              </button>
            ))}
          </div>
        )}

        {current.labels && (
          <div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
              {[1, 2, 3, 4, 5].map((value) => {
                const selected = answers[step] === value
                return <button key={value} type="button" aria-label={`Select ${value} out of 5`} onClick={() => select(value)} style={{ width: 34, height: 34, padding: 0, display: 'grid', placeItems: 'center', borderRadius: 10, border: `1px solid ${selected ? C.accB : C.br}`, background: selected ? C.accS : C.s1, color: selected ? C.acc : C.t4, cursor: 'pointer', transform: selected ? 'scale(1.12)' : 'scale(1)', transition: 'all 0.2s' }}><Sparkles size={14 + value} strokeWidth={selected ? 2.4 : 1.8} /></button>
              })}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 14 }}>
              {[1,2,3,4,5].map(v => {
                const sel = answers[step] === v
                return (
                  <button key={v} onClick={() => select(v)} style={{
                    width: 60, height: 60, borderRadius: 12,
                    border: `2px solid ${sel ? C.acc : C.br}`,
                    background: sel ? C.accS : C.s1,
                    color: sel ? C.acc : C.t2,
                    fontFamily: 'inherit', fontSize: 20, fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.15s',
                    transform: sel ? 'scale(1.1)' : 'scale(1)',
                  }}>
                    {v}
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.t4 }}>
              <span>{current.labels[0]}</span>
              <span>{current.labels[1]}</span>
            </div>
          </div>
        )}

        {current.type === 'note' && (
          <div>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="What stood out today? What surprised you? (optional)" style={{
              width: '100%', height: 120, padding: '14px', borderRadius: 12,
              background: C.s1, border: `1px solid ${C.br}`, color: C.t1,
              fontFamily: 'inherit', fontSize: 15, lineHeight: 1.6, resize: 'none', outline: 'none',
              boxSizing: 'border-box',
            }} />
            <div style={{ fontSize: 12, color: C.t4, marginTop: 6, textAlign: 'right' }}>{notes.length} / 500</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <Btn variant="ghost" full onClick={() => { setNotes(''); submit.mutate() }}>Skip note</Btn>
              <Btn variant="primary" full disabled={submit.isPending} onClick={() => submit.mutate()}>
                <Check size={16} /> {submit.isPending ? 'Saving…' : 'Save check-in'}
              </Btn>
            </div>
            {submit.error && <p role="alert" style={{ color: C.red }}>{submit.error.message}</p>}
          </div>
        )}
      </div>

      {/* Navigation */}
      {!current.type && (
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.br}`, display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={() => setStep(s => Math.max(0, s - 1))} style={{ background: 'none', border: 'none', color: C.t4, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
            {step > 0 && <><ChevronLeft size={15} /> Previous</>}
          </button>
          <button onClick={() => setStep(s => Math.min(total - 1, s + 1))} style={{ background: 'none', border: 'none', color: C.t4, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
            Skip <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  )
}
