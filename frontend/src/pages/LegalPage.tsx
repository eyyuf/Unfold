import { ChevronLeft } from 'lucide-react'
import { Card } from '@/components/common'
import { C } from '@/app/theme'
import type { Screen } from '@/types'

export function LegalPage({ kind, setScreen }: { kind: 'privacy' | 'terms'; setScreen: (s: Screen) => void }) {
  const privacy = [
    ['What we collect', 'Your account details, experiment choices, check-ins, reflections, reminder preferences, and consent choices.'],
    ['How we use it', 'We use this information only to operate Unfold, calculate your rule-based personal signals, show your history, and send reminders you request.'],
    ['Your control', 'Your reflections are private by default. You can export your information, review consent history, or delete your account from Settings.'],
    ['Sharing and retention', 'Unfold has no public profiles or social feed. We do not sell personal data. Service providers may process data only to host, monitor, and deliver the service.'],
  ]
  const terms = [
    ['The service', 'Unfold helps you collect structured evidence from short activities and personal reflections.'],
    ['Not professional advice', 'Results are informational and are not medical, psychological, career, or other professional advice.'],
    ['Your responsibilities', 'Keep your account secure, provide lawful content, and use the service without harming others or disrupting its operation.'],
    ['Your data', 'You retain ownership of your reflections. You may export or delete your data through Settings.'],
  ]
  const sections = kind === 'privacy' ? privacy : terms
  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: '40px 24px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <button onClick={() => setScreen('landing')} style={{ border: 0, background: 'none', color: C.t3, cursor: 'pointer', padding: 0, marginBottom: 28, display: 'flex', gap: 5 }}><ChevronLeft size={16} /> Back to Unfold</button>
        <h1 style={{ fontSize: 34, marginBottom: 8 }}>{kind === 'privacy' ? 'Privacy Policy' : 'Terms of Use'}</h1>
        <p style={{ color: C.t4, marginBottom: 28 }}>Effective July 28, 2026</p>
        {sections.map(([title, copy]) => <Card key={title} style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>{title}</h2>
          <p style={{ color: C.t3, lineHeight: 1.7, margin: 0 }}>{copy}</p>
        </Card>)}
        <p style={{ color: C.t4, fontSize: 13, lineHeight: 1.6, marginTop: 24 }}>This document is product-ready baseline copy and should receive legal review before a broad commercial launch.</p>
      </div>
    </div>
  )
}
