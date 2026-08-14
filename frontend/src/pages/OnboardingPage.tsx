import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { authService } from '@/services/authService'
import { Btn } from '@/components/common'
import { C } from '@/app/theme'
import type { Screen } from '@/types'

export default function OnboardingPage({ setScreen }: { setScreen: (s: Screen) => void }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({})
  const queryClient = useQueryClient()
  const complete = useMutation({
    mutationFn: () =>
      authService.updateProfile({
        onboarding_answers: {
          reason: answers[0] ?? '',
          available_time: answers[1] ?? '',
          interests: answers[2] ?? [],
        },
      }),
    onSuccess: (user) => {
      queryClient.setQueryData(['me'], user)
      setScreen('library')
    },
  })

  const steps = [
    {
      q: 'What brings you here?',
      options: [
        'I feel uncertain about my direction.',
        'I want to explore career possibilities.',
        'I want to rediscover my creativity.',
        'I am curious about myself.',
        'I want to build more meaningful habits.',
      ],
      multi: false,
    },
    {
      q: 'How much time can you usually spare?',
      options: ['10 minutes', '20 minutes', '30 minutes', '45 minutes or more'],
      multi: false,
    },
    {
      q: 'What would you be open to exploring?',
      options: [
        'Creative',
        'Technical',
        'Social',
        'Nature',
        'Service',
        'Business',
        'Physical',
        'Practical skills',
      ],
      multi: true,
    },
  ]

  const catColors: Record<string, string> = {
    Creative: C.purple,
    Technical: C.blue,
    Social: C.orange,
    Nature: C.acc,
    Service: C.teal,
    Business: C.indigo,
    Physical: C.amber,
    'Practical skills': C.sky,
  }

  const current = steps[step]
  const toggle = (opt: string) => {
    if (current.multi) {
      const cur = (answers[step] as string[] | undefined) || []
      setAnswers((a) => ({
        ...a,
        [step]: cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt],
      }))
    } else {
      setAnswers((a) => ({ ...a, [step]: opt }))
    }
  }

  const isSelected = (opt: string) =>
    current.multi ? ((answers[step] as string[]) || []).includes(opt) : answers[step] === opt

  return (
    <div
      style={{
        minHeight: '100vh',
        background: C.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{ width: '100%', maxWidth: 520 }} className="fade-up">
        {/* Progress */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 40 }}>
          {steps.map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                background: i <= step ? C.acc : C.s2,
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>

        <div style={{ marginBottom: 8, fontSize: 13, color: C.t4, fontWeight: 600 }}>
          Step {step + 1} of {steps.length}
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 28, letterSpacing: '-0.02em' }}>
          {current.q}
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 36 }}>
          {current.options.map((opt) => {
            const sel = isSelected(opt)
            const color = catColors[opt] || C.acc
            return (
              <button
                key={opt}
                onClick={() => toggle(opt)}
                style={{
                  padding: '14px 18px',
                  borderRadius: 12,
                  border: `1px solid ${sel ? (current.multi ? color : C.accB) : C.br}`,
                  background: sel ? (current.multi ? `${color}14` : C.accS) : C.s1,
                  color: sel ? (current.multi ? color : C.acc) : C.t2,
                  fontFamily: 'inherit',
                  fontSize: 15,
                  fontWeight: sel ? 600 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                {opt}
                {sel && <Check size={16} />}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => (step > 0 ? setStep((s) => s - 1) : undefined)}
            style={{
              background: 'none',
              border: 'none',
              color: C.t4,
              cursor: 'pointer',
              fontSize: 14,
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {step > 0 && (
              <>
                <ChevronLeft size={15} /> Back
              </>
            )}
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn
              variant="ghost"
              disabled={complete.isPending}
              onClick={() => (step < steps.length - 1 ? setStep((s) => s + 1) : complete.mutate())}
            >
              Skip
            </Btn>
            <Btn
              variant="primary"
              disabled={complete.isPending}
              onClick={() => (step < steps.length - 1 ? setStep((s) => s + 1) : complete.mutate())}
            >
              {step < steps.length - 1 ? 'Next' : 'See recommendations'} <ChevronRight size={15} />
            </Btn>
          </div>
        </div>
        {complete.error && (
          <p role="alert" style={{ color: C.red, marginTop: 16 }}>
            {complete.error.message}
          </p>
        )}
      </div>
    </div>
  )
}
