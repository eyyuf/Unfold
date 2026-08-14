import { useState } from 'react'
import { useLocation } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { authService } from '@/services/authService'
import { Btn, Card } from '@/components/common'
import { C } from '@/app/theme'
import type { Screen } from '@/types'

export default function ResetPasswordPage({ setScreen }: { setScreen: (s: Screen) => void }) {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const reset = useMutation({
    mutationFn: () => authService.confirmPasswordReset({ uid: params.get('uid'), token: params.get('token'), password, confirm_password: confirmPassword }),
  })
  const mismatch = Boolean(confirmPassword && password !== confirmPassword)
  return (
    <div className="auth-page" style={{ minHeight: '100vh', background: C.bg, display: 'grid', placeItems: 'center', padding: 24 }}>
      <Card className="auth-card" style={{ width: '100%', maxWidth: 440, padding: 32 }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Choose a new password</h1>
        <p style={{ color: C.t3, marginBottom: 22 }}>Use at least 8 characters and avoid common passwords.</p>
        {!reset.isSuccess ? <>
          <label style={{ display: 'block', color: C.t2, fontSize: 14, marginBottom: 16 }}>New password<input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} style={{ width: '100%', marginTop: 7, background: C.s2, color: C.t1, border: `1px solid ${C.br}`, borderRadius: 10, padding: '12px 14px', font: 'inherit' }} /></label>
          <label style={{ display: 'block', color: C.t2, fontSize: 14, marginBottom: 16 }}>Confirm password<input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} style={{ width: '100%', marginTop: 7, background: C.s2, color: C.t1, border: `1px solid ${mismatch ? C.red : C.br}`, borderRadius: 10, padding: '12px 14px', font: 'inherit' }} /></label>
          {mismatch && <p role="alert" style={{ color: C.red, fontSize: 13 }}>Passwords do not match.</p>}
          {reset.error && <p role="alert" style={{ color: C.red }}>{reset.error.message}</p>}
          <Btn full disabled={password.length < 8 || mismatch || reset.isPending || !params.get('uid') || !params.get('token')} onClick={() => reset.mutate()}>{reset.isPending ? 'Updating…' : 'Update password'}</Btn>
        </> : <>
          <p role="status" style={{ color: C.acc }}>{reset.data.detail}</p>
          <Btn full onClick={() => setScreen('login')}>Continue to login</Btn>
        </>}
      </Card>
    </div>
  )
}
