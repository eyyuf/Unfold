import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft } from 'lucide-react'
import { authService } from '@/services/authService'
import { BrandMark, Btn, Card, Badge } from '@/components/common'
import { C } from '@/app/theme'
import type { Screen, AuthFields } from '@/types'
import { authSchema } from '@/app/authSchema'

export function AuthPage({ mode, setScreen }: { mode: 'login' | 'register'; setScreen: (s: Screen) => void }) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, watch, formState: { errors } } = useForm<AuthFields>({ resolver: zodResolver(authSchema(mode)) })
  const mutation = useMutation({
    mutationFn: (values: AuthFields) => authService.authenticate(mode, values),
    onSuccess: (user) => {
      queryClient.setQueryData(['me'], user)
      setScreen(mode === 'register' ? 'onboarding' : 'home')
    },
  })
  return (
    <div className="auth-page" style={{ minHeight: '100vh', background: C.bg, display: 'grid', placeItems: 'center', padding: 24 }}>
      <Card className="auth-card" style={{ width: '100%', maxWidth: 420, padding: 32 }}>
        <button onClick={() => setScreen('landing')} style={{ border: 0, background: 'none', color: C.t3, cursor: 'pointer', padding: 0, marginBottom: 24, display: 'flex', gap: 5 }}>
          <ChevronLeft size={16} /> Back
        </button>
        <div className="auth-brand-lockup"><BrandMark /><span>Unfold</span></div>
        <Badge label="Your evidence stays private" color={C.acc} />
        <h1 style={{ fontSize: 30, margin: '18px 0 8px' }}>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
        <p style={{ color: C.t3, marginBottom: 24 }}>{mode === 'login' ? 'Continue your active experiment.' : 'Start collecting evidence from real experience.'}</p>
        <form onSubmit={handleSubmit((values) => mutation.mutate(values))}>
          {(['email', 'password'] as const).map((field) => (
            <label key={field} style={{ display: 'block', color: C.t2, fontSize: 14, marginBottom: 18 }}>
              <span style={{ display: 'block', marginBottom: 7 }}>{field === 'email' ? 'Email' : 'Password'}</span>
              <input {...register(field)} type={field} autoComplete={field === 'email' ? 'email' : mode === 'login' ? 'current-password' : 'new-password'}
                style={{ width: '100%', background: C.s2, color: C.t1, border: `1px solid ${errors[field] ? C.red : C.br}`, borderRadius: 10, padding: '12px 14px', font: 'inherit' }} />
              {errors[field] && <span style={{ color: C.red, display: 'block', marginTop: 5, fontSize: 12 }}>{errors[field]?.message}</span>}
              {field === 'password' && mode === 'register' && (() => {
                const pw = watch('password') || ''
                const strength = pw.length >= 16 ? 4 : pw.length >= 12 ? 3 : pw.length >= 8 ? 2 : pw.length > 0 ? 1 : 0
                const colors = ['', C.red, C.orange, C.amber, C.acc]
                return pw.length > 0 ? (
                  <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? colors[strength] : C.s2, transition: 'background 0.3s' }} />
                    ))}
                  </div>
                ) : null
              })()}
            </label>
          ))}
          {mode === 'register' && <>
            <label style={{ display: 'block', color: C.t2, fontSize: 14, marginBottom: 18 }}>
              <span style={{ display: 'block', marginBottom: 7 }}>Confirm password</span>
              <input {...register('confirm_password')} type="password" autoComplete="new-password" style={{ width: '100%', background: C.s2, color: C.t1, border: `1px solid ${errors.confirm_password ? C.red : C.br}`, borderRadius: 10, padding: '12px 14px', font: 'inherit' }} />
              {errors.confirm_password && <span role="alert" style={{ color: C.red, display: 'block', marginTop: 5, fontSize: 12 }}>{errors.confirm_password.message}</span>}
            </label>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, color: C.t3, fontSize: 13, lineHeight: 1.5, marginBottom: 18 }}>
              <input {...register('accept_terms')} type="checkbox" style={{ marginTop: 3 }} />
              <span>I agree to the <button type="button" onClick={() => setScreen('terms')} style={{ border: 0, padding: 0, background: 'none', color: C.acc, cursor: 'pointer' }}>Terms</button> and <button type="button" onClick={() => setScreen('privacy')} style={{ border: 0, padding: 0, background: 'none', color: C.acc, cursor: 'pointer' }}>Privacy Policy</button>.</span>
            </label>
            {errors.accept_terms && <span role="alert" style={{ color: C.red, display: 'block', margin: '-12px 0 14px', fontSize: 12 }}>{errors.accept_terms.message}</span>}
            <p style={{ color: C.t4, fontSize: 12, lineHeight: 1.5, marginTop: -8 }}>Use at least 8 characters. Avoid common or entirely numeric passwords.</p>
          </>}
          {mutation.error && <p role="alert" style={{ color: C.red, fontSize: 13 }}>{mutation.error.message}</p>}
          <Btn full size="lg" disabled={mutation.isPending}>{mutation.isPending ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}</Btn>
        </form>
        {mode === 'login' && <button onClick={() => setScreen('forgot-password')} style={{ width: '100%', marginTop: 14, color: C.t3, background: 'none', border: 0, cursor: 'pointer' }}>Forgot password?</button>}
        {mode === 'register' && <p style={{ color: C.t4, fontSize: 13, textAlign: 'center', marginTop: 16 }}>Join 2,400+ explorers discovering what fits</p>}
        <button onClick={() => setScreen(mode === 'login' ? 'register' : 'login')} style={{ width: '100%', marginTop: 14, color: C.acc, background: 'none', border: 0, cursor: 'pointer' }}>
          {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Log in'}
        </button>
      </Card>
    </div>
  )
}
