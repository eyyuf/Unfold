import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { authService } from '@/services/authService'
import { Btn, Card } from '@/components/common'
import { C } from '@/app/theme'
import type { Screen } from '@/types'

export default function ForgotPasswordPage({ setScreen }: { setScreen: (s: Screen) => void }) {
  const [email, setEmail] = useState('')
  const requestReset = useMutation({
    mutationFn: () => authService.requestPasswordReset(email),
  })
  return (
    <div className="auth-page" style={{ minHeight: '100vh', background: C.bg, display: 'grid', placeItems: 'center', padding: 24 }}>
      <Card className="auth-card" style={{ width: '100%', maxWidth: 440, padding: 32 }}>
        <button onClick={() => setScreen('login')} style={{ border: 0, background: 'none', color: C.t3, cursor: 'pointer', padding: 0, marginBottom: 24, display: 'flex', gap: 5 }}><ChevronLeft size={16} /> Back to login</button>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Reset your password</h1>
        <p style={{ color: C.t3, lineHeight: 1.6, marginBottom: 22 }}>Enter your email and we’ll send a secure reset link if an account exists.</p>
        {!requestReset.isSuccess ? <>
          <label style={{ display: 'block', color: C.t2, fontSize: 14, marginBottom: 18 }}>
            <span style={{ display: 'block', marginBottom: 7 }}>Email</span>
            <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} style={{ width: '100%', background: C.s2, color: C.t1, border: `1px solid ${C.br}`, borderRadius: 10, padding: '12px 14px', font: 'inherit' }} />
          </label>
          {requestReset.error && <p role="alert" style={{ color: C.red }}>{requestReset.error.message}</p>}
          <Btn full disabled={!email || requestReset.isPending} onClick={() => requestReset.mutate()}>{requestReset.isPending ? 'Sending…' : 'Send reset link'}</Btn>
        </> : <div role="status">
          <p style={{ color: C.acc, lineHeight: 1.6 }}>{requestReset.data.detail}</p>
          {requestReset.data.reset_url && <a href={requestReset.data.reset_url} style={{ color: C.acc, fontSize: 14 }}>Open local development reset link</a>}
        </div>}
      </Card>
    </div>
  )
}
