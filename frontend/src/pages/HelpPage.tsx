import { HelpCircle } from 'lucide-react'
import { Btn, Card } from '@/components/common'
import { C } from '@/app/theme'
import type { Screen } from '@/types'

export default function HelpPage({ setScreen }: { setScreen: (s: Screen) => void }) {
  const faqs = [
    {
      question: 'What does my fit signal mean?',
      answer: 'It summarizes the evidence in your check-ins, completion pattern, and final reflection. It is a personal signal—not a test result or diagnosis.',
    },
    {
      question: 'Why can a fit signal be lower even when I choose 5?',
      answer: 'Daily ratings are only one part of the result. Completion consistency and the final reflection also contribute, so missed days or a lower reflection response can reduce the overall signal.',
    },
    {
      question: 'Can I stop or try a different experiment?',
      answer: 'Yes. You can return to Explore at any time and choose an experiment that feels more useful. Your completed evidence stays in the Evidence vault.',
    },
  ]

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px 56px' }} className="fade-up">
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: C.acc, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
          <HelpCircle size={17} /> HELP CENTER
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>How can we help?</h1>
        <p style={{ color: C.t3, lineHeight: 1.6, margin: 0 }}>A quick guide to experiments, check-ins, and your evidence.</p>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 18 }}>How Unfold works</h2>
        <div style={{ display: 'grid', gap: 16 }}>
          {[
            ['1', 'Choose an experiment', 'Pick a small, time-limited activity that you are curious to try.'],
            ['2', 'Check in honestly', 'Record what you actually experienced each day. There are no right answers.'],
            ['3', 'Review your evidence', 'Use the final reflection and fit signal to decide what you want to explore next.'],
          ].map(([number, title, description]) => (
            <div key={number} style={{ display: 'flex', gap: 14 }}>
              <div style={{ width: 28, height: 28, flex: '0 0 28px', borderRadius: '50%', background: C.accS, color: C.acc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>{number}</div>
              <div>
                <div style={{ color: C.t1, fontWeight: 700, marginBottom: 3 }}>{title}</div>
                <div style={{ color: C.t3, fontSize: 14, lineHeight: 1.55 }}>{description}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Common questions</h2>
        {faqs.map(({ question, answer }) => (
          <div key={question} style={{ padding: '16px 0', borderBottom: `1px solid ${C.br}` }}>
            <div style={{ color: C.t1, fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{question}</div>
            <div style={{ color: C.t3, fontSize: 14, lineHeight: 1.6 }}>{answer}</div>
          </div>
        ))}
      </Card>

      <Card>
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Still need help?</h2>
        <p style={{ color: C.t3, fontSize: 14, lineHeight: 1.6, margin: '0 0 16px' }}>Review your settings or return to the experiment library to continue exploring.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <Btn size="sm" onClick={() => setScreen('library')}>Explore experiments</Btn>
          <Btn size="sm" variant="secondary" onClick={() => setScreen('profile')}>Open settings</Btn>
        </div>
      </Card>
    </div>
  )
}
