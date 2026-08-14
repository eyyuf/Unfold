import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { apiRequest } from './api/client'
import { jsPDF } from 'jspdf'
import {
  Home, Compass, BarChart2, Archive, User, Bell, Bookmark,
  ChevronRight, ChevronLeft, ArrowRight, Check, X, Play,
  Star, Heart, Brain, TrendingUp, Calendar, Clock,
  BookOpen, Leaf, Users, Dumbbell, Settings,
  HelpCircle, Search, MoreHorizontal,
  Shield, Lock, Download, Trash2, Moon, Sun, Flame, Sparkles
} from 'lucide-react'

// ─── Color tokens ────────────────────────────────────────────────────────────
const C = {
  bg:      'var(--bg)',
  bg2:     'var(--bg2)',
  s1:      'var(--s1)',
  s2:      'var(--s2)',
  br:      'var(--br)',
  t1:      'var(--t1)',
  t2:      'var(--t2)',
  t3:      'var(--t3)',
  t4:      'var(--t4)',
  acc:     'var(--acc)',
  accH:    'var(--acc-hover)',
  accS:    'var(--acc-soft)',
  accB:    'var(--acc-border)',
  gold:    'var(--gold)',
  goldS:   'var(--gold-soft)',
  purple:  '#A78BFA',
  blue:    '#67A7F0',
  orange:  '#F59E6B',
  teal:    '#59C7B4',
  amber:   '#E6B765',
  indigo:  '#7F91F5',
  red:     '#EE7777',
  sky:     '#72B6D5',
}

function BrandMark({ size = 38 }: { size?: number }) {
  return (
    <span aria-hidden="true" className="brand-mark" style={{ width: size, height: size }}>
      <Sparkles size={Math.round(size * 0.48)} strokeWidth={2.25} />
    </span>
  )
}

// ─── Toast system ────────────────────────────────────────────────────────────
type ToastItem = { id: number; message: string; type: 'success' | 'error' }
let toastListeners: Array<(t: ToastItem[]) => void> = []
let globalToasts: ToastItem[] = []
let toastId = 0
function addToast(message: string, type: 'success' | 'error' = 'success') {
  const t = { id: ++toastId, message, type }
  globalToasts = [...globalToasts, t]
  toastListeners.forEach(fn => fn(globalToasts))
  setTimeout(() => {
    globalToasts = globalToasts.filter(x => x.id !== t.id)
    toastListeners.forEach(fn => fn(globalToasts))
  }, 3000)
}
function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  useEffect(() => {
    toastListeners.push(setToasts)
    return () => { toastListeners = toastListeners.filter(fn => fn !== setToasts) }
  }, [])
  return toasts
}
function ToastContainer() {
  const toasts = useToasts()
  if (!toasts.length) return null
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className="toast-in" role="status" style={{
          padding: '12px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600,
          background: t.type === 'success' ? C.acc : C.red,
          color: t.type === 'success' ? '#052e16' : '#fff',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {t.type === 'success' ? <Check size={16} /> : <X size={16} />}
          {t.message}
        </div>
      ))}
    </div>
  )
}

type ThemePreference = 'dark' | 'light' | 'system'

function applyThemePreference(preference: ThemePreference) {
  const resolved = preference === 'system'
    ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    : preference
  document.documentElement.dataset.theme = resolved
  document.documentElement.style.colorScheme = resolved
}

type Screen = 'landing' | 'login' | 'register' | 'forgot-password' | 'reset-password' | 'privacy' | 'terms' | 'home' | 'library' | 'detail' | 'commit' | 'saved' | 'checkin' | 'checkin-done' | 'reflection' | 'report' | 'insights' | 'learned' | 'vault' | 'onboarding' | 'profile' | 'help'
type UserData = {
  id: number; email: string; display_name: string; timezone?: string
  reminder_time?: string | null; reminders_enabled?: boolean; email_reminders_enabled?: boolean
  onboarding_answers?: { reason?: string; available_time?: string; interests?: string[] }
  analytics_consent?: boolean
}
type ExperimentTraitData = {
  id: number; slug: string; name: string; description: string; positive_hypothesis_text: string; negative_hypothesis_text: string
}
type ExperimentData = {
  id: number; category: string; title: string; slug: string; description: string
  duration_days: number; minutes_per_day: number
  daily_tasks: { day: number; title: string; instructions: string }[]
  trait_weights?: { id: number; trait: ExperimentTraitData; weight: number }[]
}
type ActiveExperiment = {
  id: number; start_date: string; experiment: ExperimentData
  checkin_count: number; current_day: number
  recent_checkins: { day: number; notes: string; enjoyment: number; energy: number; curiosity: number; meaning: number; desire_to_continue: number; motivation_before?: number; satisfaction_after?: number }[]
}
type ExperimentReport = {
  id: number; status: string; start_date: string; experiment: ExperimentData; checkin_count: number
  fit_signal: number; overall_fit_score?: number
  confidence?: { score: number; label: string }
  strongest_signal: string; dimensions: Record<string, number>
  signals?: { enjoyment: number; energy: number; curiosity: number; meaning: number; desire_to_continue: number; desire_to_improve: number; flow: number }
  before_after?: { motivation_before?: number; satisfaction_after?: number; delta: number; interpretation: string }
  summary: string
  pattern_updates?: string[]
}
type SavedExperimentData = {
  id: number; experiment: ExperimentData; created_at: string
}
type UserHypothesisData = {
  id: number
  trait: ExperimentTraitData
  support_score: number
  confidence_score: number
  evidence_count: number
  status: 'uncertain' | 'emerging' | 'supported' | 'contradicted'
  status_display: string
  updated_at: string
}
type ContrastRecommendationData = {
  hypothesis: { id: number; trait: string; trait_name: string; support_score: number; confidence_score: number; status: string }
  recommended_experiment: { id: number; slug: string; title: string; category: string; description: string; duration_days: number; minutes_per_day: number; reason: string }
}
type InsightsData = {
  completed_count: number; average_fit: number; average_curiosity: number; average_repeat_intent: number; average_consistency: number
  patterns: string[]; categories: { label: string; value: number; count: number }[]
  evidence_map: { id: number; label: string; category: string; fit_signal: number; strongest_signal: string }[]
  next_recommendation?: ContrastRecommendationData | null
}

function useActiveExperiment() {
  return useQuery({
    queryKey: ['active-experiment'],
    queryFn: () => apiRequest<ActiveExperiment | null>('/user-experiments/active/'),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  })
}
type AuthFields = {
  email: string; password: string; confirm_password?: string; accept_terms?: boolean
}

const authSchema = (mode: 'login' | 'register') => z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string().optional(),
  accept_terms: z.boolean().optional(),
}).superRefine((data, context) => {
  if (mode === 'register' && data.password !== data.confirm_password) {
    context.addIssue({ code: 'custom', path: ['confirm_password'], message: 'Passwords do not match' })
  }
  if (mode === 'register' && !data.accept_terms) {
    context.addIssue({ code: 'custom', path: ['accept_terms'], message: 'You must accept the Terms and Privacy Policy' })
  }
})

// ─── Shared primitives ───────────────────────────────────────────────────────────

function ConfirmModal({ open, title, message, confirmLabel = 'Confirm', confirmVariant = 'danger' as const, onConfirm, onCancel, children }: {
  open: boolean; title: string; message: string; confirmLabel?: string
  confirmVariant?: 'primary' | 'secondary' | 'ghost' | 'danger'; onConfirm: () => void; onCancel: () => void
  children?: React.ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onCancel])
  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div style={{ background: C.s1, borderRadius: 16, padding: 28, maxWidth: 460, width: '100%', border: `1px solid ${C.br}`, boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }} onClick={e => e.stopPropagation()} className="scale-in">
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{title}</h2>
        <p style={{ color: C.t3, lineHeight: 1.6, marginBottom: children ? 16 : 24 }}>{message}</p>
        {children}
        <div style={{ display: 'flex', gap: 10, marginTop: children ? 20 : 0 }}>
          <Btn variant="ghost" full onClick={onCancel}>Cancel</Btn>
          <Btn variant={confirmVariant} full onClick={onConfirm}>{confirmLabel}</Btn>
        </div>
      </div>
    </div>
  )
}

function AnimatedCounter({ value, suffix = '', duration = 1200 }: { value: number; suffix?: string; duration?: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const startTime = performance.now()
    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * value))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [value, duration])
  return <>{display}{suffix}</>
}

function SkeletonCard() {
  return (
    <div style={{ background: C.s1, borderRadius: 16, padding: '20px 24px', border: `1px solid ${C.br}` }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 9 }} />
        <div className="skeleton" style={{ width: 70, height: 22, borderRadius: 999 }} />
      </div>
      <div className="skeleton" style={{ width: '75%', height: 16, borderRadius: 6, marginBottom: 10 }} />
      <div className="skeleton" style={{ width: '100%', height: 14, borderRadius: 6, marginBottom: 6 }} />
      <div className="skeleton" style={{ width: '60%', height: 14, borderRadius: 6 }} />
    </div>
  )
}

function Btn({
  children, variant = 'primary', onClick, size = 'md', full = false, disabled = false
}: {
  children: React.ReactNode; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  onClick?: () => void; size?: 'sm' | 'md' | 'lg'; full?: boolean; disabled?: boolean
}) {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    fontFamily: 'var(--font-sans)', fontWeight: 800, cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none', borderRadius: 999, transition: 'all 0.18s cubic-bezier(0.22, 1, 0.36, 1)',
    width: full ? '100%' : undefined, opacity: disabled ? 0.45 : 1,
    letterSpacing: '0.065em', textTransform: 'uppercase',
  }
  const sizes = { sm: { padding: '7px 13px', fontSize: 13 }, md: { padding: '10px 18px', fontSize: 14 }, lg: { padding: '13px 24px', fontSize: 15 } }
  const variants: Record<string, React.CSSProperties> = {
    primary:   { background: C.acc, color: '#0A0A0B', boxShadow: '0 4px 0 color-mix(in srgb, var(--acc) 66%, #000)' },
    secondary: { background: C.s2, color: C.t1, border: `1px solid ${C.br}` },
    ghost:     { background: 'transparent', color: C.t2, border: `1px solid ${C.br}` },
    danger:    { background: 'rgba(181,95,95,0.1)', color: C.red, border: `1px solid rgba(181,95,95,0.3)` },
  }
  return (
    <button className="press-active" style={{ ...base, ...sizes[size], ...variants[variant] }} onClick={onClick} disabled={disabled}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.filter = 'brightness(1.05)' } }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.filter = '' }}>
      {children}
    </button>
  )
}

function LoadingBlock({ label }: { label: string }) {
  return <div role="status" aria-live="polite" style={{ maxWidth: 680, margin: '60px auto', padding: 24 }}>
    <div className="skeleton" style={{ width: '42%', height: 24, borderRadius: 8, marginBottom: 14 }} />
    <div className="skeleton" style={{ width: '100%', height: 120, borderRadius: 14, marginBottom: 12 }} />
    <span style={{ color: C.t3, fontSize: 14 }}>{label}</span>
  </div>
}

function ErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div role="alert" style={{ maxWidth: 560, margin: '70px auto', padding: 24, textAlign: 'center' }}>
    <h2 className="font-serif" style={{ fontSize: 24, marginBottom: 8 }}>Something went wrong</h2>
    <p style={{ color: C.t3, marginBottom: 18 }}>{message} Your data was not deleted.</p>
    <Btn onClick={onRetry}>Try again</Btn>
  </div>
}

function EmptyState({ title, copy, action, onAction }: { title: string; copy: string; action: string; onAction: () => void }) {
  return <div style={{ maxWidth: 580, margin: '60px auto', padding: '36px 32px', textAlign: 'center' }}>
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><BrandMark size={56} /></div>
    <h1 className="font-serif" style={{ fontSize: 28, marginBottom: 10 }}>{title}</h1>
    <p style={{ color: C.t3, lineHeight: 1.65, marginBottom: 24, fontSize: 15 }}>{copy}</p>
    <Btn onClick={onAction}>{action}</Btn>
  </div>
}

function Card({ children, style, onClick, accent = false, className = '' }: {
  children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void; accent?: boolean; className?: string
}) {
  const base: React.CSSProperties = {
    background: C.s1, borderRadius: 20, padding: '22px 24px',
    border: accent ? `1px solid ${C.accB}` : `1px solid ${C.br}`,
    boxShadow: 'var(--shadow-sm)',
    cursor: onClick ? 'pointer' : undefined,
    transition: 'transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s ease, border-color 0.2s ease',
    ...style,
  }
  const combinedClass = [onClick ? 'card-hover' : '', className].filter(Boolean).join(' ')
  return (
    <div className={combinedClass || undefined} style={base} onClick={onClick}>
      {children}
    </div>
  )
}

const categoryIcons: Record<string, React.ElementType> = {
  Creative: Star,
  Technical: Brain,
  Nature: Leaf,
  Social: Users,
  Service: Heart,
  Business: TrendingUp,
  Physical: Dumbbell,
}

function CategoryChip({ label, color, icon: IconProp, active = false, onClick }: {
  label: string; color: string; icon?: React.ElementType; active?: boolean; onClick?: () => void
}) {
  const Icon = IconProp ?? categoryIcons[label] ?? Sparkles
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px',
      borderRadius: 999, fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
      background: active ? `${color}1e` : C.s1,
      color: active ? color : C.t2,
      border: `1px solid ${active ? `${color}66` : C.br}`,
      transition: 'all 0.18s ease',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <span className="category-icon" style={{ color, background: `${color}18`, borderColor: `${color}42` }}><Icon size={13} strokeWidth={2.2} /></span>
      {label}
    </button>
  )
}

function ProgressBar({ value, max, label }: { value: number; max: number; label?: string }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div>
      {label && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: C.t3 }}>{label}</span>
        <span style={{ fontSize: 13, color: C.t3 }}>{pct}%</span>
      </div>}
      <div style={{ height: 6, background: C.s2, borderRadius: 999, overflow: 'hidden', position: 'relative' }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: C.acc, borderRadius: 999,
          transition: 'width 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        }} />
      </div>
    </div>
  )
}

function Badge({ label, color }: { label: string; color: string }) {
  const Icon = categoryIcons[label] ?? Sparkles
  return (
    <span className="scale-in" style={{
      display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 12px',
      borderRadius: 999, fontSize: 12.5, fontWeight: 600,
      background: `${color}1e`, color, border: `1px solid ${color}44`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }}>
      <Icon size={13} strokeWidth={2.2} />
      {label}
    </span>
  )
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
      <span style={{ width: 130, fontSize: 14, color: C.t2, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 8, background: C.s2, borderRadius: 999, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${value}%`, borderRadius: 999,
          background: value >= 70 ? C.acc : value >= 45 ? C.amber : C.br,
          transition: 'width 0.7s ease',
        }} />
      </div>
      <span style={{ width: 36, fontSize: 13, color: C.t3, textAlign: 'right', flexShrink: 0 }}>{value}%</span>
    </div>
  )
}

// ─── Constellation SVG ───────────────────────────────────────────────────────
export function Constellation({ w = 560, h = 320 }: { w?: number; h?: number }) {
  const nodes = [
    { x: 80,  y: 100, lit: true,  size: 4.5 },
    { x: 190, y: 52,  lit: true,  size: 5 },
    { x: 320, y: 80,  lit: true,  size: 4 },
    { x: 155, y: 190, lit: false, size: 2.5 },
    { x: 280, y: 170, lit: true,  size: 4 },
    { x: 410, y: 130, lit: false, size: 2.5 },
    { x: 370, y: 255, lit: false, size: 2 },
    { x: 225, y: 295, lit: false, size: 2.5 },
    { x: 85,  y: 270, lit: false, size: 2 },
    { x: 470, y: 60,  lit: false, size: 2 },
    { x: 500, y: 200, lit: false, size: 2 },
  ].map(n => ({ ...n, x: n.x * (w / 560), y: n.y * (h / 320) }))

  const edges = [[0,1],[1,2],[1,3],[2,4],[3,4],[2,5],[4,6],[5,6],[4,7],[3,8],[2,9],[5,9],[5,10],[6,10]]

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id="ng" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.acc} stopOpacity="0.55"/>
          <stop offset="100%" stopColor={C.acc} stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="ng2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.br} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={C.br} stopOpacity="0"/>
        </radialGradient>
      </defs>
      {edges.map(([a, b], i) => {
        const lit = nodes[a].lit && nodes[b].lit
        return (
          <line key={i}
            x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y}
            stroke={lit ? 'rgba(34,197,94,0.22)' : 'rgba(63,63,70,0.35)'}
            strokeWidth={lit ? 1.2 : 0.8}
            strokeDasharray={lit ? undefined : '5 5'}
          />
        )
      })}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r={n.lit ? 20 : 12} fill={n.lit ? 'url(#ng)' : 'url(#ng2)'} />
          <circle cx={n.x} cy={n.y} r={n.size} fill={n.lit ? C.acc : '#52525B'} />
          {n.lit && <circle cx={n.x} cy={n.y} r={n.size} fill={C.acc} opacity={0.9}
            style={{ animation: `twinkle ${2 + i * 0.3}s ease-in-out infinite` }} />}
        </g>
      ))}
    </svg>
  )
}

// ─── Layout shell (sidebar + bottom nav) ────────────────────────────────────
function AppShell({ screen, setScreen, children }: {
  screen: Screen; setScreen: (s: Screen) => void; children: React.ReactNode
}) {
  const navItems = [
    { id: 'home' as Screen,     label: 'Home',    Icon: Home },
    { id: 'library' as Screen,  label: 'Explore', Icon: Compass },
    { id: 'insights' as Screen, label: 'Insights',Icon: BarChart2 },
    { id: 'vault' as Screen,    label: 'Vault',   Icon: Archive },
    { id: 'profile' as Screen,  label: 'Profile', Icon: User },
  ]
  const screenTitles: Partial<Record<Screen, string>> = {
    home: 'Dashboard', library: 'Explore', detail: 'Experiment', commit: 'Commitment', saved: 'Saved',
    checkin: 'Daily check-in', 'checkin-done': 'Check-in complete', reflection: 'Reflection', report: 'Report',
    insights: 'Insights', learned: 'What you learned', vault: 'Evidence vault', onboarding: 'Set up',
    profile: 'Settings', help: 'Help centre',
  }
  const screenTitle = screenTitles[screen] ?? 'Unfold'

  return (
    <div className="unfold-shell" style={{ display: 'flex', height: '100vh', background: C.bg, overflow: 'hidden' }}>
      {/* Sidebar – visible md+ */}
      <aside style={{
        width: 220, flexShrink: 0, background: C.bg2,
        borderRight: `1px solid ${C.br}`,
        display: 'flex', flexDirection: 'column',
        padding: '20px 12px',
      }} className="desktop-sidebar app-sidebar">
        {/* Logo */}
        <div style={{ padding: '8px 12px 24px' }}>
          <div className="app-sidebar-brand">
            <BrandMark />
            <div>
              <span style={{ display: 'block', fontWeight: 800, fontSize: 18, color: C.t1, letterSpacing: '-0.04em' }}>Unfold</span>
              <span className="app-sidebar-kicker">Personal lab</span>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="app-sidebar-nav" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(({ id, label, Icon }) => {
            const active = screen === id
            return (
              <button className={`sidebar-nav-button${active ? ' active' : ''}`} key={id} onClick={() => setScreen(id)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 14, fontWeight: active ? 600 : 500,
                background: active ? C.accS : 'transparent',
                color: active ? C.acc : C.t3,
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = C.s1 }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
                <Icon size={17} />
                {label}
              </button>
            )
          })}
        </nav>

        {/* Bottom sidebar links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, paddingTop: 12, borderTop: `1px solid ${C.br}` }}>
          {([
            { id: 'profile', Icon: Settings, label: 'Settings' },
            { id: 'help', Icon: HelpCircle, label: 'Help' },
          ] as const).map(({ id, Icon, label }) => {
            const active = screen === id
            return (
              <button
                key={id}
                onClick={() => setScreen(id)}
                aria-current={active ? 'page' : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                  borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 13, fontWeight: active ? 600 : 500,
                  background: active ? C.accS : 'transparent', color: active ? C.acc : C.t4,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={event => { if (!active) event.currentTarget.style.background = C.s1 }}
                onMouseLeave={event => { if (!active) event.currentTarget.style.background = 'transparent' }}
              >
                <Icon size={15} />
                {label}
              </button>
            )
          })}
        </div>
      </aside>

      {/* Main content */}
      <div className="app-main-column" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header className="app-topbar">
          <div>
            <div className="app-topbar-kicker">Your personal evidence lab</div>
            <div className="app-topbar-title">{screenTitle}</div>
          </div>
          <div className="app-topbar-actions">
            <button className="app-icon-button" aria-label="Open help" onClick={() => setScreen('help')}><HelpCircle size={17} /></button>
            <button className="app-icon-button" aria-label="Open settings" onClick={() => setScreen('profile')}><Settings size={17} /></button>
          </div>
        </header>
        <main id="main-content" style={{ flex: 1, overflowY: 'auto', padding: '0 0 80px' }} className="md:pb-0 app-scroll-area">
          {children}
        </main>

        {/* Bottom nav – mobile */}
        <nav className="mobile-nav" style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: C.bg2, borderTop: `1px solid ${C.br}`,
          display: 'flex', padding: '8px 0 12px',
          zIndex: 50,
        }}>
          {navItems.map(({ id, label, Icon }) => {
            const active = screen === id
            return (
              <button key={id} onClick={() => setScreen(id)} style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 10, fontWeight: 600, color: active ? C.acc : C.t4,
                padding: '4px 0', transition: 'color 0.15s',
              }}>
                {active && <div className="nav-dot" style={{ width: 4, height: 4, borderRadius: '50%', background: C.acc }} />}
                <Icon size={20} />
                {label}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

// ─── SCREEN: Landing ─────────────────────────────────────────────────────────
function AuthScreen({ mode, setScreen }: { mode: 'login' | 'register'; setScreen: (s: Screen) => void }) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, watch, formState: { errors } } = useForm<AuthFields>({ resolver: zodResolver(authSchema(mode)) })
  const mutation = useMutation({
    mutationFn: (values: AuthFields) => apiRequest<UserData>(`/auth/${mode}/`, { method: 'POST', body: JSON.stringify(values) }),
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

function ForgotPasswordScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const [email, setEmail] = useState('')
  const requestReset = useMutation({
    mutationFn: () => apiRequest<{ detail: string; reset_url?: string }>('/auth/password-reset/', { method: 'POST', body: JSON.stringify({ email }) }),
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

function ResetPasswordScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const reset = useMutation({
    mutationFn: () => apiRequest<{ detail: string }>('/auth/password-reset/confirm/', {
      method: 'POST',
      body: JSON.stringify({ uid: params.get('uid'), token: params.get('token'), password, confirm_password: confirmPassword }),
    }),
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

function LegalScreen({ kind, setScreen }: { kind: 'privacy' | 'terms'; setScreen: (s: Screen) => void }) {
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

function LandingScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const experiments = [
    { title: 'Write One Page a Day', cat: 'Creative', color: C.purple, duration: '7 days', time: '20 min/day', Icon: BookOpen },
    { title: 'Photography Walk', cat: 'Creative', color: C.purple, duration: '7 days', time: '30 min/day', Icon: Star },
    { title: 'Teach Someone Something', cat: 'Service', color: C.teal, duration: '5 days', time: '25 min/day', Icon: Users },
    { title: 'Code a Small Project', cat: 'Technical', color: C.blue, duration: '14 days', time: '30 min/day', Icon: Brain },
  ]

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.t1 }}>
      {/* Top nav */}
      <header className="landing-nav" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 40px', borderBottom: `1px solid ${C.br}`,
        position: 'sticky', top: 0, background: C.bg, zIndex: 40,
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BrandMark />
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.04em' }}>Unfold</span>
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={() => setScreen('login')} style={{ background: 'none', border: 'none', color: C.t3, fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', padding: '6px 12px' }}>Browse experiments</button>
          <Btn variant="ghost" size="sm" onClick={() => setScreen('login')}>Log in</Btn>
          <Btn variant="primary" size="sm" onClick={() => setScreen('register')}>Start free</Btn>
        </nav>
      </header>

      {/* Hero */}
      <section className="landing-hero gradient-bg" style={{
        maxWidth: 1200, margin: '0 auto', padding: '80px 40px 60px',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center',
        position: 'relative', overflow: 'hidden', borderRadius: 24,
      }}>
        <div className="fade-up">
          <div style={{ marginBottom: 16 }} className="stagger-1">
            <Badge label="Evidence-based self-discovery" color={C.acc} />
          </div>
          <h1 className="stagger-2 font-serif" style={{ fontSize: 54, lineHeight: 1.1, marginBottom: 20 }}>
            Discover yourself<br />
            <span style={{ color: C.acc }}>through real action.</span>
          </h1>
          <p className="stagger-3" style={{ fontSize: 18, color: C.t2, lineHeight: 1.65, maxWidth: 480, marginBottom: 36 }}>
            Try short activities, record how they feel, and uncover patterns about what energizes you, matters to you, and deserves more of your attention.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }} className="stagger-4">
            <Btn variant="primary" size="lg" onClick={() => setScreen('register')}>
              Start your first experiment <ArrowRight size={16} />
            </Btn>
            <Btn variant="ghost" size="lg" onClick={() => setScreen('login')}>
              Browse experiments
            </Btn>
          </div>
          <div style={{ marginTop: 32, display: 'flex', gap: 24 }}>
            {[{ n: 2400, s: '+', l: 'experiments started' }, { n: 94, s: '%', l: 'find it insightful' }, { n: 5, s: ' min', l: 'to first check-in' }].map(({ n, s, l }) => (
              <div key={l}>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.t1 }}><AnimatedCounter value={n} suffix={s} /></div>
                <div style={{ fontSize: 13, color: C.t4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Code-native signal map: no generated imagery. */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <div className="hero-signal-visual" style={{
            position: 'relative', width: 480, height: 320,
            borderRadius: 20, border: `1px solid ${C.accB}`, overflow: 'hidden',
            boxShadow: 'var(--shadow-md)',
          }}>
            <Constellation w={480} h={320} />
            <div style={{
              position: 'absolute', bottom: 16, left: 16, right: 16,
              background: 'color-mix(in srgb, var(--s1) 88%, transparent)', borderRadius: 14, padding: '14px 18px',
              border: `1px solid ${C.accB}`, backdropFilter: 'blur(10px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: '0.05em' }}><Sparkles size={12} /> EVIDENCE FORMING</span>
                <span style={{ fontSize: 12, color: C.t3 }}>Day 3 of 7</span>
              </div>
              <div className="font-serif" style={{ fontSize: 16, color: '#F1F0E9', marginBottom: 8 }}>Photography Walk</div>
              <ProgressBar value={3} max={7} />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 34, fontWeight: 700, marginBottom: 12, letterSpacing: '-0.02em' }}>How it works</h2>
          <p style={{ color: C.t3, fontSize: 16 }}>Three steps to uncover what fits you.</p>
        </div>
        <div className="how-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {[
            { n: '01', title: 'Choose', desc: 'Pick one short experiment from our library — writing, photography, teaching, coding, and more.', color: C.purple, Icon: Compass },
            { n: '02', title: 'Try', desc: 'Complete small real-world tasks each day and record how the activity felt — not how you wish it felt.', color: C.acc, Icon: Play },
            { n: '03', title: 'Discover', desc: 'Review evidence from your own behavior. Detect patterns across experiments and see what deserves more attention.', color: C.blue, Icon: BarChart2 },
          ].map(({ n, title, desc, color, Icon }) => (
            <Card key={title} style={{ background: C.s1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color={color} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.t4, letterSpacing: '0.05em' }}>{n}</span>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{title}</h3>
              <p style={{ fontSize: 15, color: C.t3, lineHeight: 1.6 }}>{desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Sample experiments */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 40px 60px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>Popular experiments</h2>
          <button onClick={() => setScreen('login')} style={{ background: 'none', border: 'none', color: C.acc, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit', fontWeight: 600 }}>
            See all <ChevronRight size={15} />
          </button>
        </div>
        <div className="experiment-grid-landing" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {experiments.map(({ title, cat, color, duration, time, Icon }) => (
            <Card key={title} onClick={() => setScreen('login')} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={17} color={color} />
                </div>
                <span aria-hidden="true" style={{ color: C.t4 }}><Bookmark size={15} /></span>
              </div>
              <Badge label={cat} color={color} />
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: '10px 0 8px', lineHeight: 1.35 }}>{title}</h3>
              <div style={{ display: 'flex', gap: 10, fontSize: 12, color: C.t4 }}>
                <span>{duration}</span>
                <span>·</span>
                <span>{time}</span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Trust section */}
      <section style={{ background: C.s1, borderTop: `1px solid ${C.br}`, borderBottom: `1px solid ${C.br}` }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '64px 40px', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: C.accS, border: `1px solid ${C.accB}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Shield size={22} color={C.acc} />
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 12 }}>Not a diagnosis. Not a label.</h2>
          <p style={{ fontSize: 16, color: C.t2, lineHeight: 1.7 }}>
            This is not a personality test, life verdict, or career oracle. It is a practical tool for learning from your own lived experience — one small experiment at a time.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ maxWidth: 700, margin: '0 auto', padding: '80px 40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16, letterSpacing: '-0.02em' }}>
          Every experiment is a clue.
        </h2>
        <p style={{ fontSize: 17, color: C.t3, marginBottom: 36, lineHeight: 1.6 }}>
          Start with one. See what you notice. Add another piece to your picture.
        </p>
        <Btn variant="primary" size="lg" onClick={() => setScreen('onboarding')}>
          Start your first experiment <ArrowRight size={16} />
        </Btn>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${C.br}`, padding: '28px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: C.t4 }}>Copyright {new Date().getFullYear()} Unfold</span>
        <div style={{ display: 'flex', gap: 20 }}>
          {[
            { label: 'Privacy', screen: 'privacy' as Screen },
            { label: 'Terms', screen: 'terms' as Screen },
            { label: 'Help', screen: 'help' as Screen },
          ].map(({ label, screen }) => <button key={label} onClick={() => setScreen(screen)} style={{ fontSize: 13, color: C.t4, background: 'none', border: 0, padding: 0, cursor: 'pointer' }}>{label}</button>)}
        </div>
      </footer>
    </div>
  )
}

// ─── SCREEN: Onboarding ───────────────────────────────────────────────────────
function OnboardingScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({})
  const queryClient = useQueryClient()
  const complete = useMutation({
    mutationFn: () => apiRequest<UserData>('/auth/me/', {
      method: 'PATCH',
      body: JSON.stringify({
        onboarding_answers: {
          reason: answers[0] ?? '',
          available_time: answers[1] ?? '',
          interests: answers[2] ?? [],
        },
      }),
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
      options: ['Creative', 'Technical', 'Social', 'Nature', 'Service', 'Business', 'Physical', 'Practical skills'],
      multi: true,
    },
  ]

  const catColors: Record<string, string> = { Creative: C.purple, Technical: C.blue, Social: C.orange, Nature: C.acc, Service: C.teal, Business: C.indigo, Physical: C.amber, 'Practical skills': C.sky }

  const current = steps[step]
  const toggle = (opt: string) => {
    if (current.multi) {
      const cur = (answers[step] as string[] | undefined) || []
      setAnswers(a => ({ ...a, [step]: cur.includes(opt) ? cur.filter(x => x !== opt) : [...cur, opt] }))
    } else {
      setAnswers(a => ({ ...a, [step]: opt }))
    }
  }

  const isSelected = (opt: string) => current.multi
    ? ((answers[step] as string[]) || []).includes(opt)
    : answers[step] === opt

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 520 }} className="fade-up">
        {/* Progress */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 40 }}>
          {steps.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? C.acc : C.s2, transition: 'background 0.3s' }} />
          ))}
        </div>

        <div style={{ marginBottom: 8, fontSize: 13, color: C.t4, fontWeight: 600 }}>Step {step + 1} of {steps.length}</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 28, letterSpacing: '-0.02em' }}>{current.q}</h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 36 }}>
          {current.options.map(opt => {
            const sel = isSelected(opt)
            const color = catColors[opt] || C.acc
            return (
              <button key={opt} onClick={() => toggle(opt)} style={{
                padding: '14px 18px', borderRadius: 12, border: `1px solid ${sel ? (current.multi ? color : C.accB) : C.br}`,
                background: sel ? (current.multi ? `${color}14` : C.accS) : C.s1,
                color: sel ? (current.multi ? color : C.acc) : C.t2,
                fontFamily: 'inherit', fontSize: 15, fontWeight: sel ? 600 : 500,
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                {opt}
                {sel && <Check size={16} />}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => step > 0 ? setStep(s => s - 1) : undefined} style={{ background: 'none', border: 'none', color: C.t4, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
            {step > 0 && <><ChevronLeft size={15} /> Back</>}
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="ghost" disabled={complete.isPending} onClick={() => step < steps.length - 1 ? setStep(s => s + 1) : complete.mutate()}>Skip</Btn>
            <Btn variant="primary" disabled={complete.isPending} onClick={() => step < steps.length - 1 ? setStep(s => s + 1) : complete.mutate()}>
              {step < steps.length - 1 ? 'Next' : 'See recommendations'} <ChevronRight size={15} />
            </Btn>
          </div>
        </div>
        {complete.error && <p role="alert" style={{ color: C.red, marginTop: 16 }}>{complete.error.message}</p>}
      </div>
    </div>
  )
}

// ─── SCREEN: Home ─────────────────────────────────────────────────────────────
function HomeScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const { data: active, isPending, isFetching, isError, refetch } = useActiveExperiment()
  const queryClient = useQueryClient()
  const user = queryClient.getQueryData<UserData>(['me'])
  const [showMotivationModal, setShowMotivationModal] = useState(false)
  const [motivationBefore, setMotivationBefore] = useState(3)
  const [showAbandonModal, setShowAbandonModal] = useState(false)

  const startCheckin = useMutation({
    mutationFn: (val: number) => apiRequest(`/user-experiments/${active?.id}/checkins/start/`, {
      method: 'POST',
      body: JSON.stringify({ day_number: active?.current_day, motivation_before: val })
    }),
    onSuccess: () => {
      setShowMotivationModal(false)
      setScreen('checkin')
    }
  })
  const abandon = useMutation({
    mutationFn: () => {
      if (!active) throw new Error('No active experiment found.')
      return apiRequest(`/user-experiments/${active.id}/abandon/`, { method: 'POST' })
    },
    onSuccess: () => {
      queryClient.setQueryData(['active-experiment'], null)
      queryClient.invalidateQueries({ queryKey: ['evidence-vault'] })
      setScreen('vault')
    },
  })
  if (isPending) return <LoadingBlock label="Loading your experiment…" />
  if (isError) return <ErrorBlock message="Your experiment could not be loaded." onRetry={() => refetch()} />
  if (!active) return <EmptyState title="Your next discovery starts with one small experiment" copy="Choose a short experiment to begin collecting evidence." action="Explore experiments" onAction={() => setScreen('library')} />
  const day = active.current_day
  const task = active.experiment.daily_tasks.find((item) => item.day === day)
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }} className="fade-up">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <p style={{ color: C.t4, fontSize: 13, marginBottom: 4 }}>{new Intl.DateTimeFormat(undefined, { dateStyle: 'full' }).format(new Date())}</p>
          <h1 className="font-serif" style={{ fontSize: 32, marginBottom: 4 }}>{(() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 21 ? 'Good evening' : 'Good night' })()}, {user?.display_name || user?.email.split('@')[0]}</h1>
          <p style={{ color: C.t3, fontSize: 14 }}>One experiment at a time.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button aria-label="Open reminder settings" onClick={() => setScreen('profile')} style={{ width: 38, height: 38, borderRadius: 9, background: C.s1, border: `1px solid ${C.br}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
            <Bell size={16} color={C.t3} />
            <div style={{ position: 'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: '50%', background: C.acc }} />
          </button>
          <button aria-label="Open profile" onClick={() => setScreen('profile')} style={{ padding: 0, background: 'none', border: 0, cursor: 'pointer' }}><BrandMark /></button>
        </div>
      </div>
      {isFetching && <div style={{ color: C.t4, fontSize: 12, marginBottom: 10 }}>Syncing…</div>}

      {/* Active experiment card */}
      <div style={{
        background: C.s1, borderRadius: 20, padding: '24px', border: `1px solid ${C.accB}`,
        boxShadow: `0 0 0 1px ${C.accB}, 0 20px 40px rgba(34,197,94,0.06)`,
        marginBottom: 24, position: 'relative', overflow: 'hidden',
      }}>
        {/* Background glow */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(130,151,122,0.1) 0%, transparent 70%)' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <Badge label={active.experiment.category} color={C.purple} />
          <button aria-label="End experiment early" onClick={() => setShowAbandonModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.t4 }}><MoreHorizontal size={18} /></button>
        </div>

        <h2 className="font-serif" style={{ fontSize: 24, marginBottom: 4 }}>{active.experiment.title}</h2>
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, fontSize: 13, color: C.t3 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={13} /> Day {day} of {active.experiment.duration_days}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={13} /> ~{active.experiment.minutes_per_day} min/day</span>
        </div>

        <ProgressBar value={day} max={active.experiment.duration_days} label="Progress" />

        {active.checkin_count >= 2 && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: `${C.orange}18`, color: C.orange, fontSize: 12, fontWeight: 700, marginTop: 8 }}>
            <Flame size={13} /> {active.checkin_count} day streak
          </div>
        )}

        {/* Day indicators */}
        <div style={{ display: 'flex', gap: 6, margin: '16px 0 20px' }}>
          {Array.from({ length: active.experiment.duration_days }, (_, index) => index + 1).map(d => (
            <div key={d} style={{
              width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600,
               background: d < day ? C.acc : d === day ? C.accS : C.s2,
               color: d < day ? '#052e16' : d === day ? C.acc : C.t4,
               border: d === day ? `1px solid ${C.accB}` : 'none',
            }}>
               {d < day ? <Check size={13} /> : d}
            </div>
          ))}
        </div>

        {/* Today's task */}
        <div style={{ background: C.s2, borderRadius: 12, padding: '16px', marginBottom: 20, border: `1px solid ${C.br}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.t4, letterSpacing: '0.06em', marginBottom: 8, textTransform: 'uppercase' }}>Today's task</div>
          <p style={{ fontSize: 15, fontWeight: 600, color: C.t1, marginBottom: 6 }}>{task?.instructions ?? 'Complete today’s experiment task.'}</p>
          <div style={{ display: 'flex', gap: 12, fontSize: 13, color: C.t4 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {active.experiment.minutes_per_day} minutes</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Bell size={12} /> Reminder at {user?.reminder_time?.slice(0, 5) ?? '19:30'}</span>
          </div>
        </div>

        <Btn variant="primary" full size="lg" onClick={() => setShowMotivationModal(true)}>
          <Play size={16} />
          Begin today's task
        </Btn>

        {showMotivationModal && (
          <ConfirmModal
            open={showMotivationModal}
            title="Before starting today's task"
            message="How motivated are you to do this right now?"
            confirmLabel={startCheckin.isPending ? 'Starting…' : 'Start task'}
            confirmVariant="primary"
            onConfirm={() => startCheckin.mutate(motivationBefore)}
            onCancel={() => setShowMotivationModal(false)}
          >
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '16px 0 8px' }}>
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setMotivationBefore(v)}
                  style={{
                    width: 44, height: 44, borderRadius: 10,
                    font: 'inherit', fontWeight: 700, fontSize: 16, cursor: 'pointer',
                    background: motivationBefore === v ? C.acc : C.s2,
                    color: motivationBefore === v ? '#052e16' : C.t1,
                    border: `1px solid ${motivationBefore === v ? C.accB : C.br}`,
                    transition: 'all 0.15s',
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.t4, padding: '0 4px' }}>
              <span>1: Not at all</span>
              <span>5: Very motivated</span>
            </div>
          </ConfirmModal>
        )}
        <button disabled={abandon.isPending} onClick={() => setShowAbandonModal(true)} style={{ width: '100%', marginTop: 12, border: 0, background: 'none', color: C.t4, cursor: 'pointer', font: 'inherit', fontSize: 13 }}>
          {abandon.isPending ? 'Ending experiment…' : 'End experiment early'}
        </button>
        {abandon.error && <p role="alert" style={{ color: C.red, fontSize: 13 }}>{abandon.error.message}</p>}
      </div>

      {/* Recent evidence */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Recent evidence</h3>
          <button onClick={() => setScreen('vault')} style={{ background: 'none', border: 'none', color: C.acc, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>View all</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {!active.recent_checkins.length && <p style={{ color: C.t4, fontSize: 14 }}>Your check-ins will appear here as you collect evidence.</p>}
          {active.recent_checkins.map((checkin) => (
            <Card key={checkin.day} style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.t4 }}>Day {checkin.day}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[{ l: 'Curiosity', v: checkin.curiosity }, { l: 'Energy', v: checkin.energy }].map(({ l, v }) => (
                    <span key={l} style={{ fontSize: 12, color: C.t3 }}>{l}: <strong style={{ color: v >= 4 ? C.acc : C.t2 }}>{v}/5</strong></span>
                  ))}
                </div>
              </div>
              <p style={{ fontSize: 14, color: C.t2, fontStyle: 'italic' }}>{checkin.notes || 'No note added.'}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Pattern hint */}
      {active.recent_checkins.length >= 2 && <Card style={{ background: `${C.purple}0e`, border: `1px solid ${C.purple}25` }} >
        <div className="slide-in-up" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: `${C.purple}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <TrendingUp size={17} color={C.purple} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.purple, marginBottom: 4, letterSpacing: '0.04em' }}>PATTERN FORMING</div>
            <p style={{ fontSize: 14, color: C.t2, lineHeight: 1.55 }}>Your curiosity scores have been consistently high. A pattern may be emerging around creative observation.</p>
          </div>
        </div>
      </Card>}

      <ConfirmModal
        open={showAbandonModal}
        title="End experiment early?"
        message="Your existing check-ins will remain in your Evidence Vault. You can start a new experiment after."
        confirmLabel="End experiment"
        confirmVariant="danger"
        onConfirm={() => { setShowAbandonModal(false); abandon.mutate() }}
        onCancel={() => setShowAbandonModal(false)}
      />
    </div>
  )
}

// ─── SCREEN: Library ─────────────────────────────────────────────────────────
function LibraryScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const [activeFilter, setActiveFilter] = useState('All')
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = queryClient.getQueryData<UserData | null>(['me'])

  const filters = [
    { label: 'All', color: C.t1 },
    { label: 'Creative', color: C.purple, Icon: Star },
    { label: 'Technical', color: C.blue, Icon: Brain },
    { label: 'Social', color: C.orange, Icon: Users },
    { label: 'Nature', color: C.acc, Icon: Leaf },
    { label: 'Service', color: C.teal, Icon: Heart },
    { label: 'Physical', color: C.amber, Icon: Dumbbell },
  ]

  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ['experiments', activeFilter, search],
    queryFn: () => apiRequest<ExperimentData[]>(`/experiments/?${new URLSearchParams({
      ...(activeFilter !== 'All' ? { category: activeFilter.toLowerCase() } : {}),
      ...(search ? { search } : {}),
    })}`),
  })
  const { data: savedItems = [] } = useQuery({
    queryKey: ['saved-experiments'],
    queryFn: () => apiRequest<SavedExperimentData[]>('/saved-experiments/'),
    enabled: Boolean(user),
  })
  const savedSlugs = new Set(savedItems.map((item) => item.experiment.slug))
  const saveExperiment = useMutation({
    mutationFn: ({ slug, saved }: { slug: string; saved: boolean }) => apiRequest(`/experiments/${slug}/save/`, { method: saved ? 'DELETE' : 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-experiments'] }),
  })
  const toggleSave = (event: React.MouseEvent, slug: string) => {
    event.stopPropagation()
    if (!user) {
      setScreen('login')
      return
    }
    saveExperiment.mutate({ slug, saved: savedSlugs.has(slug) })
  }
  const categoryStyle: Record<string, { color: string; Icon: React.ElementType }> = {
    Creative: { color: C.purple, Icon: Star }, Technical: { color: C.blue, Icon: Brain },
    Social: { color: C.orange, Icon: Users }, Nature: { color: C.acc, Icon: Leaf },
    Service: { color: C.teal, Icon: Heart }, Physical: { color: C.amber, Icon: Dumbbell },
  }
  const interests = user?.onboarding_answers?.interests ?? []
  const exps = data.map((item) => ({
    ...item, cat: item.category, days: item.duration_days, mins: item.minutes_per_day,
    desc: item.description, ...(categoryStyle[item.category] ?? { color: C.acc, Icon: Compass }),
  })).sort((a, b) => Number(interests.includes(b.category)) - Number(interests.includes(a.category)))
    .map((item, index) => ({ ...item, badge: index === 0 ? (interests.includes(item.category) ? 'Matches your interests' : 'Good first experiment') : undefined }))
  const openExperiment = (slug: string) => navigate(`/app/experiments/${slug}`)
  if (isLoading) return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
      <div className="skeleton" style={{ width: 200, height: 28, borderRadius: 8, marginBottom: 28 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  )
  if (error) return <ErrorBlock message="The experiment library could not be loaded." onRetry={() => refetch()} />

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }} className="fade-up">
      {/* Header */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 className="font-serif" style={{ fontSize: 32, marginBottom: 6 }}>Explore experiments</h1>
          <p style={{ fontSize: 15, color: C.t3 }}>Pick one that feels worth exploring. You can always try another after.</p>
        </div>
        {user && <Btn variant="ghost" size="sm" onClick={() => setScreen('saved')}><Bookmark size={15} /> Saved</Btn>}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={16} color={C.t4} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search experiments..." style={{
          width: '100%', padding: '11px 14px 11px 40px', borderRadius: 10,
          background: C.s1, border: `1px solid ${C.br}`, color: C.t1,
          fontFamily: 'inherit', fontSize: 15, outline: 'none',
          boxSizing: 'border-box',
        }} />
      </div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
        {filters.map(({ label, color, Icon }) => (
          <CategoryChip key={label} label={label} color={color} icon={Icon}
            active={activeFilter === label} onClick={() => setActiveFilter(label)} />
        ))}
      </div>

      {/* Recommended row */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.t4, letterSpacing: '0.05em' }}>RECOMMENDED FOR YOU</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {exps.slice(0, 2).map(({ title, slug, cat, color, Icon, days, mins, desc, badge }) => (
            <Card key={title} accent onClick={() => openExperiment(slug)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, overflow: 'hidden', border: `1px solid ${color}44`, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                    <Icon size={21} color={color} strokeWidth={2} />
                  </div>
                  <Badge label={cat} color={color} />
                </div>
                 <button aria-label={`${savedSlugs.has(slug) ? 'Remove' : 'Save'} ${title}`} onClick={(event) => toggleSave(event, slug)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: savedSlugs.has(slug) ? C.acc : C.t4 }}><Bookmark size={15} fill={savedSlugs.has(slug) ? 'currentColor' : 'none'} /></button>
              </div>
              {badge && <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: C.acc, marginBottom: 6, letterSpacing: '0.04em' }}><Sparkles size={12} /> {badge.toUpperCase()}</div>}
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>{title}</h3>
              <p style={{ fontSize: 13, color: C.t3, lineHeight: 1.55, marginBottom: 14 }}>{desc}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 12, fontSize: 13, color: C.t4 }}>
                  <span>{days} days</span>
                  <span>·</span>
                  <span>{mins} min/day</span>
                </div>
                <ChevronRight size={15} color={C.acc} />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* All experiments grid */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.t4, letterSpacing: '0.05em', marginBottom: 14 }}>ALL EXPERIMENTS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {exps.map(({ title, slug, cat, color, Icon, days, mins, desc }) => (
            <Card key={title} onClick={() => openExperiment(slug)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, overflow: 'hidden', border: `1px solid ${color}44`, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                    <Icon size={21} color={color} strokeWidth={2} />
                  </div>
                  <Badge label={cat} color={color} />
                </div>
                <button aria-label={`${savedSlugs.has(slug) ? 'Remove' : 'Save'} ${title}`} onClick={(event) => toggleSave(event, slug)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: savedSlugs.has(slug) ? C.acc : C.t4 }}><Bookmark size={15} fill={savedSlugs.has(slug) ? 'currentColor' : 'none'} /></button>
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>{title}</h3>
              <p style={{ fontSize: 13, color: C.t3, lineHeight: 1.55, marginBottom: 14 }}>{desc}</p>
              <div style={{ fontSize: 13, color: C.t4 }}>{days} days · {mins} min/day</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── SCREEN: Experiment Detail ────────────────────────────────────────────────
function SavedExperimentsScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['saved-experiments'],
    queryFn: () => apiRequest<SavedExperimentData[]>('/saved-experiments/'),
  })
  const remove = useMutation({
    mutationFn: (slug: string) => apiRequest(`/experiments/${slug}/save/`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-experiments'] }),
  })

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }} className="fade-up">
      <button onClick={() => setScreen('library')} style={{ display: 'flex', gap: 6, alignItems: 'center', border: 0, background: 'none', color: C.t3, cursor: 'pointer', padding: 0, marginBottom: 24 }}>
        <ChevronLeft size={16} /> Back to Explore
      </button>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Saved experiments</h1>
      <p style={{ color: C.t3, marginBottom: 28 }}>Ideas you want to return to later.</p>
      {isLoading && <p style={{ color: C.t3 }}>Loading saved experiments…</p>}
      {error && <p role="alert" style={{ color: C.red }}>Saved experiments could not be loaded.</p>}
      {!isLoading && !items.length && <Card style={{ textAlign: 'center', padding: 32 }}>
        <Bookmark size={26} color={C.t4} />
        <h2 style={{ fontSize: 18, margin: '12px 0 6px' }}>Nothing saved yet</h2>
        <p style={{ color: C.t3, marginBottom: 18 }}>Bookmark an experiment while browsing to keep it here.</p>
        <Btn onClick={() => setScreen('library')}>Explore experiments</Btn>
      </Card>}
      <div style={{ display: 'grid', gap: 14 }}>
        {items.map(({ experiment }) => (
          <Card key={experiment.slug} onClick={() => navigate(`/app/experiments/${experiment.slug}`)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <Badge label={experiment.category} color={C.purple} />
                <h2 style={{ fontSize: 17, margin: '10px 0 6px' }}>{experiment.title}</h2>
                <p style={{ color: C.t3, fontSize: 14, margin: 0 }}>{experiment.duration_days} days · {experiment.minutes_per_day} min/day</p>
              </div>
              <button aria-label={`Remove ${experiment.title} from saved experiments`} onClick={(event) => { event.stopPropagation(); remove.mutate(experiment.slug) }} style={{ border: 0, background: 'none', color: C.acc, cursor: 'pointer', alignSelf: 'flex-start' }}>
                <Bookmark size={18} fill="currentColor" />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function DetailScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const slug = useLocation().pathname.split('/').pop() ?? ''
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = queryClient.getQueryData<UserData>(['me'])
  const { data: experiment, isLoading, error, refetch } = useQuery({
    queryKey: ['experiment', slug],
    queryFn: () => apiRequest<ExperimentData>(`/experiments/${slug}/`),
  })
  const { data: savedItems = [] } = useQuery({
    queryKey: ['saved-experiments'],
    queryFn: () => apiRequest<SavedExperimentData[]>('/saved-experiments/'),
    enabled: Boolean(user),
  })
  const isSaved = savedItems.some((item) => item.experiment.slug === slug)
  const saveExperiment = useMutation({
    mutationFn: () => apiRequest(`/experiments/${slug}/save/`, { method: isSaved ? 'DELETE' : 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-experiments'] }),
  })
  if (isLoading) return <LoadingBlock label="Loading experiment…" />
  if (error || !experiment) return <ErrorBlock message="This experiment could not be loaded." onRetry={() => refetch()} />
  const tasks = experiment.daily_tasks.slice(0, 3).map((task) => task.instructions)
  const testedTraits = (experiment.trait_weights ?? []).filter((item) => item.weight >= 3).slice(0, 3).map((item) => item.trait.name.toLowerCase())

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px' }} className="fade-up">
      {/* Back */}
      <button onClick={() => setScreen('library')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: C.t3, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, marginBottom: 28, padding: 0 }}>
        <ChevronLeft size={16} /> Back to experiments
      </button>

      {/* Hero */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 11, background: `${C.purple}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Star size={20} color={C.purple} />
          </div>
          <Badge label={experiment.category} color={C.purple} />
        </div>
        <h1 style={{ fontSize: 34, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.025em' }}>{experiment.title}</h1>
        <p style={{ fontSize: 17, color: C.t2, lineHeight: 1.65, marginBottom: 20 }}>
          {experiment.description}
        </p>
        <div style={{ display: 'flex', gap: 16 }}>
          {[
            { Icon: Calendar, label: `${experiment.duration_days} days` },
            { Icon: Clock, label: `${experiment.minutes_per_day} min/day` },
            { Icon: TrendingUp, label: 'Beginner' },
          ].map(({ Icon, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: C.t3 }}>
              <Icon size={14} color={C.t4} />{label}
            </div>
          ))}
        </div>
      </div>

      {/* Sections */}
      <Card style={{ marginBottom: 28, background: C.accS, border: `1px solid ${C.accB}` }}>
        <p style={{ fontSize: 14, color: C.t2, lineHeight: 1.65 }}>
          <strong style={{ color: C.acc }}>An experiment is a short, low-pressure trial.</strong> Do the activity, check in honestly, and use your responses as evidence about what fits you.
        </p>
      </Card>
      {[
        {
          title: 'What you will do',
          content: tasks.length
            ? `Follow one small prompt each day for about ${experiment.minutes_per_day} minutes, then record how the activity affected your energy, curiosity, meaning, and desire to continue. The goal is honest observation, not performance.`
            : `Try this activity for about ${experiment.minutes_per_day} minutes each day and record how the experience felt. The goal is honest observation, not performance.`,
        },
        {
          title: 'What this may reveal',
          content: testedTraits.length
            ? `This may reveal whether ${testedTraits.join(', ')} activities produce repeatable positive signals for you. One result is a clue, and later experiments help test whether it holds in another setting.`
            : 'This may reveal which parts of the activity energize you, hold your curiosity, or feel meaningful. One result is a clue, and later experiments help test whether it holds in another setting.',
        },
      ].map(({ title, content }) => (
        <div key={title} style={{ marginBottom: 28, paddingBottom: 28, borderBottom: `1px solid ${C.br}` }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{title}</h2>
          <p style={{ fontSize: 15, color: C.t2, lineHeight: 1.7 }}>{content}</p>
        </div>
      ))}

      {/* Daily tasks */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Sample daily tasks</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tasks.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '14px', background: C.s1, borderRadius: 12, border: `1px solid ${C.br}` }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: `${C.purple}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: C.purple, flexShrink: 0 }}>{i + 1}</div>
              <span style={{ fontSize: 14, color: C.t2, lineHeight: 1.55 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '24px', background: C.s1, borderRadius: 16, border: `1px solid ${C.accB}`, boxShadow: `0 0 0 1px ${C.accB}` }}>
        <p style={{ fontSize: 14, color: C.t3, marginBottom: 16 }}>
          You can stop at any time. Ending an experiment does not mean you failed — it is still useful evidence.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <Btn variant="primary" size="lg" onClick={() => user ? navigate(`/app/experiments/${slug}/commit`) : setScreen('login')}>
            Plan this experiment
          </Btn>
          <Btn variant="ghost" size="lg" disabled={saveExperiment.isPending} onClick={() => user ? saveExperiment.mutate() : setScreen('login')}>
            <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} /> {isSaved ? 'Saved' : 'Save for later'}
          </Btn>
        </div>
        {saveExperiment.error && <p role="alert" style={{ color: C.red, marginTop: 12 }}>{saveExperiment.error.message}</p>}
      </div>
    </div>
  )
}

// ─── SCREEN: Daily Check-in ───────────────────────────────────────────────────
function CommitmentScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const slug = location.pathname.split('/').filter(Boolean).at(-2) ?? ''
  const user = queryClient.getQueryData<UserData>(['me'])
  const today = (() => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  })()
  const [startDate, setStartDate] = useState(today)
  const [reason, setReason] = useState('')
  const [remindersEnabled, setRemindersEnabled] = useState(Boolean(user?.reminders_enabled))
  const [reminderTime, setReminderTime] = useState(user?.reminder_time?.slice(0, 5) ?? '19:30')
  const { data: experiment, isLoading } = useQuery({
    queryKey: ['experiment', slug],
    queryFn: () => apiRequest<ExperimentData>(`/experiments/${slug}/`),
  })
  const start = useMutation({
    mutationFn: () => apiRequest<ActiveExperiment>(`/experiments/${slug}/start/`, {
      method: 'POST',
      body: JSON.stringify({ start_date: startDate, reason, reminders_enabled: remindersEnabled, reminder_time: reminderTime }),
    }),
    onSuccess: (active) => {
      queryClient.setQueryData(['active-experiment'], active)
      queryClient.invalidateQueries({ queryKey: ['me'] })
      setScreen('home')
    },
  })

  if (isLoading || !experiment) return <div style={{ padding: 40, color: C.t3 }}>Preparing your experiment…</div>

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'grid', placeItems: 'center', padding: 24 }}>
      <Card style={{ width: '100%', maxWidth: 580, padding: 32 }} accent>
        <button onClick={() => navigate(`/app/experiments/${slug}`)} style={{ border: 0, background: 'none', color: C.t3, cursor: 'pointer', padding: 0, marginBottom: 22, display: 'flex', gap: 5 }}>
          <ChevronLeft size={16} /> Back
        </button>
        <Badge label="Make it practical" color={C.acc} />
        <h1 style={{ fontSize: 28, margin: '18px 0 8px' }}>Plan {experiment.title}</h1>
        <p style={{ color: C.t3, lineHeight: 1.6, marginBottom: 24 }}>A simple plan makes it easier to notice what the experience actually feels like.</p>

        <label style={{ display: 'block', color: C.t2, fontSize: 14, marginBottom: 18 }}>
          <span style={{ display: 'block', marginBottom: 7 }}>Start date</span>
          <input type="date" min={today} value={startDate} onChange={(event) => setStartDate(event.target.value)} style={{ width: '100%', background: C.s2, color: C.t1, border: `1px solid ${C.br}`, borderRadius: 10, padding: '12px 14px', font: 'inherit', boxSizing: 'border-box' }} />
        </label>
        <label style={{ display: 'block', color: C.t2, fontSize: 14, marginBottom: 18 }}>
          <span style={{ display: 'block', marginBottom: 7 }}>Why are you trying this? <span style={{ color: C.t4 }}>(optional)</span></span>
          <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="I want to see whether…" style={{ width: '100%', minHeight: 90, background: C.s2, color: C.t1, border: `1px solid ${C.br}`, borderRadius: 10, padding: '12px 14px', font: 'inherit', boxSizing: 'border-box', resize: 'vertical' }} />
        </label>
        <div style={{ padding: 16, background: C.s2, borderRadius: 12, marginBottom: 20 }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: C.t2, fontSize: 14, marginBottom: remindersEnabled ? 14 : 0 }}>
            Email reminder
            <input type="checkbox" checked={remindersEnabled} onChange={(event) => setRemindersEnabled(event.target.checked)} />
          </label>
          {remindersEnabled && <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: C.t2, fontSize: 14 }}>
            Preferred time
            <input type="time" value={reminderTime} onChange={(event) => setReminderTime(event.target.value)} style={{ background: C.s1, color: C.t1, border: `1px solid ${C.br}`, borderRadius: 8, padding: 8 }} />
          </label>}
        </div>
        <p style={{ color: C.t4, fontSize: 13, lineHeight: 1.55, marginBottom: 20 }}>If it is {reminderTime}, you will spend {experiment.minutes_per_day} minutes on this experiment. Timezone: {user?.timezone ?? 'Africa/Nairobi'}.</p>
        {start.error && <p role="alert" style={{ color: C.red }}>{start.error.message}</p>}
        <Btn full size="lg" disabled={start.isPending || !startDate} onClick={() => start.mutate()}>{start.isPending ? 'Starting…' : 'Start experiment'}</Btn>
      </Card>
    </div>
  )
}

function CheckinScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
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
      return apiRequest(`/user-experiments/${active.id}/checkins/`, {
        method: 'POST',
        body: JSON.stringify({
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
        }),
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

// Check-in done state
function CheckinDoneScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const { data: active } = useActiveExperiment()
  const latest = active?.recent_checkins[0]
  const signals = latest ? [
    { l: 'Enjoyment', v: latest.enjoyment },
    { l: 'Energy', v: latest.energy },
    { l: 'Curiosity', v: latest.curiosity },
    { l: 'Meaning', v: latest.meaning },
  ] : []
  const strongest = signals.reduce<{ l: string; v: number } | null>((best, signal) => !best || signal.v > best.v ? signal : best, null)
  const readyToFinish = Boolean(active && active.checkin_count >= active.experiment.duration_days)
  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }} className="fade-up">
        <div style={{
          width: 68, height: 68, borderRadius: '50%', background: C.accS,
          border: `1px solid ${C.accB}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', position: 'relative',
        }}>
          <Check size={28} color={C.acc} strokeWidth={2.2} />
          <div style={{ position: 'absolute', top: -5, right: -5, color: C.gold }}><Sparkles size={15} /></div>
        </div>
        <h1 className="font-serif" style={{ fontSize: 32, marginBottom: 8 }}>Check-in saved.</h1>
        <p style={{ fontSize: 15, color: C.t3, lineHeight: 1.6, marginBottom: 28 }}>
          You have added another piece of evidence. {active?.checkin_count ?? 1} check-in{active?.checkin_count === 1 ? '' : 's'} collected.
        </p>

        {latest && <Card style={{ textAlign: 'left', marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.t4, marginBottom: 12, letterSpacing: '0.05em' }}>TODAY'S SIGNALS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {signals.map(({ l, v }) => (
              <ScoreBar key={l} label={l} value={v * 20} />
            ))}
          </div>
        </Card>}

        {strongest && <Card style={{ background: C.accS, border: `1px solid ${C.accB}`, textAlign: 'left', marginBottom: 24 }}>
          <p style={{ fontSize: 14, color: C.t2, lineHeight: 1.6 }}>
            <strong style={{ color: C.acc }}>{strongest.l} was today&apos;s strongest signal at {strongest.v}/5.</strong> Keep checking in to see whether that signal repeats.
          </p>
        </Card>}

        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="ghost" full onClick={() => setScreen('home')}>Back to home</Btn>
          {readyToFinish && <Btn variant="secondary" full onClick={() => setScreen('reflection')}>Finish experiment</Btn>}
        </div>
        {!readyToFinish && active && <p style={{ color: C.t4, fontSize: 13, marginTop: 14 }}>{active.experiment.duration_days - active.checkin_count} planned check-in{active.experiment.duration_days - active.checkin_count === 1 ? '' : 's'} remaining before the final reflection.</p>}
      </div>
    </div>
  )
}

function FinalReflectionScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
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

// ─── SCREEN: Experiment Report ─────────────────────────────────────────────
function ReportScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const reportId = location.pathname.startsWith('/app/reports/') ? location.pathname.split('/').pop() : undefined
  const { data: report, isLoading, error, refetch } = useQuery({
    queryKey: ['experiment-report', reportId ?? 'latest'],
    queryFn: async () => {
      if (reportId) return apiRequest<ExperimentReport>(`/user-experiments/${reportId}/report/`)
      const reports = await apiRequest<ExperimentReport[]>('/evidence-vault/')
      return reports[0] ?? null
    },
  })
  const { data: insights } = useQuery({
    queryKey: ['insights'],
    queryFn: () => apiRequest<InsightsData>('/insights/'),
  })
  if (isLoading) return <LoadingBlock label="Building your report…" />
  if (error) return <ErrorBlock message="This report could not be loaded." onRetry={() => refetch()} />
  if (!report) return <div style={{ padding: 40, color: C.t3 }}>Complete an experiment to see your first report.</div>
  const dims = Object.entries(report.dimensions).map(([l, v]) => ({ l, v }))

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }} className="fade-up">
      {/* Header */}
      <button onClick={() => setScreen('home')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: C.t3, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, marginBottom: 28, padding: 0 }}>
        <ChevronLeft size={16} /> Back
      </button>

      {/* Experiment summary */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
          <Badge label={report.experiment.category} color={C.purple} />
          <span style={{ fontSize: 13, color: C.t4 }}>Started {report.start_date}</span>
        </div>
        <h1 className="font-serif" style={{ fontSize: 32, marginBottom: 4 }}>{report.experiment.title}</h1>
        <p style={{ fontSize: 15, color: C.t3 }}>{report.experiment.duration_days} days · {report.checkin_count} check-ins collected</p>
      </div>

      {/* Fit signal */}
      <Card accent style={{ textAlign: 'center', marginBottom: 24, padding: '32px 24px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.t4, letterSpacing: '0.06em', marginBottom: 12 }}>FIT SIGNAL</div>
        <div style={{ fontSize: 72, fontWeight: 800, color: C.acc, lineHeight: 1, marginBottom: 8, letterSpacing: '-0.04em' }}><AnimatedCounter value={report.fit_signal} suffix="%" /></div>
        {report.confidence && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: C.s2, border: `1px solid ${C.br}`, fontSize: 13, fontWeight: 600, color: C.t2, marginBottom: 12 }}>
            <span>Evidence confidence:</span>
            <span style={{ color: C.acc }}>{report.confidence.label} ({Math.round(report.confidence.score)}%)</span>
          </div>
        )}
        <p style={{ fontSize: 14, color: C.t3, maxWidth: 380, margin: '0 auto' }}>
          Based on your daily check-ins, completion consistency, and final reflection. This is not a score — it is a summary of your own responses.
        </p>
      </Card>

      {/* Before vs After Motivation Delta */}
      {report.before_after?.interpretation && (
        <Card style={{ marginBottom: 24, background: `${C.blue}0d`, border: `1px solid ${C.blue}22` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.blue, letterSpacing: '0.05em', marginBottom: 6 }}>BEFORE VS AFTER MOTIVATION</div>
          <p style={{ fontSize: 15, fontWeight: 600, color: C.t1, marginBottom: 4 }}>{report.before_after.interpretation}</p>
          <p style={{ fontSize: 13, color: C.t4 }}>
            Starting motivation: {report.before_after.motivation_before ? Math.round(report.before_after.motivation_before) + '%' : 'N/A'} ·
            Satisfaction after: {report.before_after.satisfaction_after ? Math.round(report.before_after.satisfaction_after) + '%' : 'N/A'}
          </p>
        </Card>
      )}

      {/* Dimension scores */}
      <Card style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>Dimension breakdown</h2>
        {dims.map((d, i) => <div key={d.l} className={`stagger-${Math.min(i + 1, 6)}`}><ScoreBar label={d.l} value={d.v} /></div>)}
      </Card>

      {/* Insight cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
        <Card style={{ background: `${C.acc}0e`, border: `1px solid ${C.acc}22` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.acc, letterSpacing: '0.05em', marginBottom: 8 }}>WHAT STOOD OUT</div>
          <p style={{ fontSize: 15, color: C.t2, lineHeight: 1.65 }}>
            {report.strongest_signal} was the clearest signal in your check-ins. This may be worth exploring through another {report.experiment.category.toLowerCase()} experiment.
          </p>
        </Card>
        {report.pattern_updates && report.pattern_updates.length > 0 && (
          <Card style={{ background: `${C.purple}0e`, border: `1px solid ${C.purple}22` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.purple, letterSpacing: '0.05em', marginBottom: 8 }}>PATTERN CONTRIBUTION</div>
            {report.pattern_updates.map((update, idx) => (
              <p key={idx} style={{ fontSize: 14, color: C.t2, lineHeight: 1.5, marginBottom: 4 }}>• {update}</p>
            ))}
          </Card>
        )}
      </div>

      {/* What this may suggest */}
      <Card style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>What this may suggest</h2>
        <p style={{ fontSize: 15, color: C.t2, lineHeight: 1.7 }}>
          {report.summary || 'Your responses suggest this activity deserves further exploration.'} This does not define your purpose; it is evidence you can compare with future experiments.
        </p>
      </Card>

      {/* Transparency */}
      <div style={{ padding: '14px 18px', background: C.s1, borderRadius: 12, border: `1px solid ${C.br}`, marginBottom: 28, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Shield size={15} color={C.t4} style={{ marginTop: 1, flexShrink: 0 }} />
        <p style={{ fontSize: 13, color: C.t4, lineHeight: 1.55 }}>
          This report summarizes your check-ins and final reflection. It is not a diagnosis, personality label, or permanent conclusion.
        </p>
      </div>

      {/* Next experiment */}
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Explore next</h2>
        <Card accent onClick={() => insights?.next_recommendation ? navigate(`/app/experiments/${insights.next_recommendation.recommended_experiment.slug}`) : setScreen('library')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 11, background: `${C.purple}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BookOpen size={20} color={C.purple} />
            </div>
            <div style={{ flex: 1 }}>
              <Badge label={insights?.next_recommendation?.recommended_experiment.category ?? 'Explore'} color={C.purple} />
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: '6px 0 4px' }}>{insights?.next_recommendation?.recommended_experiment.title ?? 'Choose another experiment'}</h3>
              <p style={{ fontSize: 13, color: C.t3 }}>{insights?.next_recommendation?.recommended_experiment.reason ?? 'Compare this result with another short trial from the library.'}</p>
            </div>
            <ChevronRight size={16} color={C.acc} />
          </div>
        </Card>
      </div>
    </div>
  )
}

// ─── SCREEN: Insights ──────────────────────────────────────────────────────
// ─── Evidence Map (data-driven SVG constellation) ────────────────────────────
type EvidenceNode = { id: number; label: string; category: string; fit_signal: number; strongest_signal: string }

function EvidenceMap({ nodes, categoryColors, onNodeClick }: {
  nodes: EvidenceNode[]; categoryColors: Record<string, string>; onNodeClick: (id: number) => void
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  const W = 720, H = 320, PAD = 60

  // ── Deterministic force-like layout ──
  // Spread nodes in a circle, then push apart nodes that share connections
  const positioned = (() => {
    if (!nodes.length) return []
    const count = nodes.length
    // Start with even circular distribution
    const pts = nodes.map((n, i) => {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2
      const rx = (W - PAD * 2) * 0.38
      const ry = (H - PAD * 2) * 0.38
      return {
        ...n,
        x: W / 2 + Math.cos(angle) * rx,
        y: H / 2 + Math.sin(angle) * ry,
      }
    })

    // Simple repulsion iterations to avoid overlap
    for (let iter = 0; iter < 30; iter++) {
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[j].x - pts[i].x
          const dy = pts[j].y - pts[i].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const minDist = 90
          if (dist < minDist && dist > 0) {
            const force = (minDist - dist) / dist * 0.3
            pts[i].x -= dx * force
            pts[i].y -= dy * force
            pts[j].x += dx * force
            pts[j].y += dy * force
          }
        }
        // Clamp to bounds
        pts[i].x = Math.max(PAD, Math.min(W - PAD, pts[i].x))
        pts[i].y = Math.max(PAD, Math.min(H - PAD, pts[i].y))
      }
    }
    return pts
  })()

  // ── Build edges ──
  // Solid green line = same strongest_signal, dashed gray = same category
  const edges: { from: number; to: number; type: 'signal' | 'category' }[] = []
  for (let i = 0; i < positioned.length; i++) {
    for (let j = i + 1; j < positioned.length; j++) {
      if (positioned[i].strongest_signal === positioned[j].strongest_signal) {
        edges.push({ from: i, to: j, type: 'signal' })
      } else if (positioned[i].category === positioned[j].category) {
        edges.push({ from: i, to: j, type: 'category' })
      }
    }
  }

  const nodeRadius = (fit: number) => Math.max(6, Math.min(14, fit / 8))

  if (!positioned.length) return <p style={{ color: C.t4, fontSize: 14 }}>Complete experiments to build your evidence map.</p>

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ overflow: 'visible', display: 'block' }}>
        <defs>
          <radialGradient id="em-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={C.acc} stopOpacity="0.4"/>
            <stop offset="100%" stopColor={C.acc} stopOpacity="0"/>
          </radialGradient>
          <filter id="em-shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Background grid dots */}
        {Array.from({ length: 12 }).map((_, i) =>
          Array.from({ length: 6 }).map((_, j) => (
            <circle key={`g-${i}-${j}`} cx={30 + i * 60} cy={20 + j * 55} r={1} fill="rgba(63,63,70,0.2)" />
          ))
        )}

        {/* Edges */}
        {edges.map(({ from, to, type }, i) => {
          const a = positioned[from], b = positioned[to]
          const isHighlighted = hovered !== null && (hovered === from || hovered === to)
          const baseOpacity = isHighlighted ? 0.7 : (hovered !== null ? 0.1 : type === 'signal' ? 0.4 : 0.2)
          return (
            <line key={`e-${i}`}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={type === 'signal' ? 'rgba(34,197,94,0.6)' : 'rgba(63,63,70,0.5)'}
              strokeWidth={type === 'signal' ? 1.8 : 1}
              strokeDasharray={type === 'category' ? '6 4' : undefined}
              opacity={baseOpacity}
              style={{ transition: 'opacity 0.25s' }}
            />
          )
        })}

        {/* Nodes */}
        {positioned.map((node, i) => {
          const color = categoryColors[node.category] ?? C.acc
          const r = nodeRadius(node.fit_signal)
          const isHovered = hovered === i
          const dimmed = hovered !== null && !isHovered && !edges.some(e => (e.from === hovered && e.to === i) || (e.to === hovered && e.from === i))
          return (
            <g key={node.id}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onNodeClick(node.id)}
              style={{ cursor: 'pointer', transition: 'opacity 0.25s' }}
              opacity={dimmed ? 0.25 : 1}
            >
              {/* Outer glow */}
              <circle cx={node.x} cy={node.y} r={r * 3} fill={`${color}10`} style={{ transition: 'r 0.2s' }} />
              {isHovered && <circle cx={node.x} cy={node.y} r={r * 4} fill={`${color}08`} />}

              {/* Core circle */}
              <circle cx={node.x} cy={node.y} r={isHovered ? r * 1.3 : r} fill={color}
                style={{ transition: 'r 0.2s', filter: isHovered ? 'url(#em-shadow)' : undefined }} />

              {/* Twinkle ring */}
              <circle cx={node.x} cy={node.y} r={r * 1.5} fill="none" stroke={color} strokeWidth={0.8}
                opacity={0.3} style={{ animation: `twinkle ${2.5 + i * 0.4}s ease-in-out infinite` }} />

              {/* Label */}
              <text x={node.x} y={node.y + r + 16} textAnchor="middle" fill={C.t2}
                fontSize={11} fontWeight={600} fontFamily="Manrope, sans-serif">
                {node.label.length > 18 ? node.label.slice(0, 16) + '…' : node.label}
              </text>
              <text x={node.x} y={node.y + r + 30} textAnchor="middle" fill={C.t4}
                fontSize={10} fontWeight={600} fontFamily="Manrope, sans-serif">
                {node.fit_signal}% fit
              </text>
            </g>
          )
        })}
      </svg>

      {/* Hover tooltip */}
      {hovered !== null && positioned[hovered] && (
        <div className="glass scale-in" style={{
          position: 'absolute',
          left: Math.min(positioned[hovered].x, W - 200),
          top: Math.max(0, positioned[hovered].y - 90),
          padding: '10px 14px', borderRadius: 10,
          fontSize: 12, pointerEvents: 'none', zIndex: 10,
          minWidth: 160,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: C.t1 }}>{positioned[hovered].label}</div>
          <div style={{ color: C.t3, marginBottom: 2 }}>
            <Badge label={positioned[hovered].category} color={categoryColors[positioned[hovered].category] ?? C.acc} />
          </div>
          <div style={{ color: C.t3, marginTop: 6 }}>Fit signal: <span style={{ color: C.acc, fontWeight: 700 }}>{positioned[hovered].fit_signal}%</span></div>
          <div style={{ color: C.t4, marginTop: 2 }}>Strongest: {positioned[hovered].strongest_signal}</div>
        </div>
      )}
    </div>
  )
}

// ─── Hypothesis Card & Learned Insights Component ─────────────────────────────
type EvidenceItem = { experiment_id: number; experiment_title: string; fit_score: number; confidence_score: number; weight: number }

function HypothesisCard({
  hypothesis,
  onViewEvidence,
  onTestAssumption,
}: {
  hypothesis: UserHypothesisData
  onViewEvidence: (id: number) => void
  onTestAssumption: (id: number) => void
}) {
  const statusColors: Record<string, string> = {
    supported: C.acc,
    emerging: C.amber,
    contradicted: C.red,
    uncertain: C.t4,
  }

  const color = statusColors[hypothesis.status] ?? C.acc
  const statusMeaning: Record<UserHypothesisData['status'], string> = {
    supported: 'Repeated, consistent evidence supports this for now.',
    emerging: 'Positive signals are repeating, but more contrast is useful.',
    uncertain: 'There is not enough consistent evidence yet.',
    contradicted: 'Repeated evidence has leaned against this assumption so far.',
  }

  return (
    <Card style={{ background: `${color}09`, border: `1px solid ${color}25`, marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <Badge label={hypothesis.status_display} color={color} />
        <span style={{ fontSize: 12, color: C.t4 }}>
          {hypothesis.evidence_count} experiment{hypothesis.evidence_count !== 1 ? 's' : ''}
        </span>
      </div>

      <h3 style={{ fontSize: 17, fontWeight: 700, color: C.t1, marginBottom: 6 }}>
        {hypothesis.trait.name}
      </h3>

      <p style={{ fontSize: 14, color: C.t2, lineHeight: 1.6, marginBottom: 14 }}>
        {hypothesis.status === 'contradicted'
          ? (hypothesis.trait.negative_hypothesis_text || `${hypothesis.trait.name} activities have not consistently produced positive signals yet.`)
          : (hypothesis.trait.positive_hypothesis_text || `${hypothesis.trait.name} activities repeatedly produce positive signals for you.`)}
      </p>
      <p style={{ fontSize: 12, color: C.t4, lineHeight: 1.55, margin: '-6px 0 14px' }}>{statusMeaning[hypothesis.status]} This can change as you test it in new settings.</p>

      <div style={{ display: 'flex', gap: 16, fontSize: 13, color: C.t3, marginBottom: 16, flexWrap: 'wrap' }}>
        <div>Support: <span style={{ fontWeight: 700, color: C.t1 }}>{Math.round(hypothesis.support_score)}%</span></div>
        <div>Confidence: <span style={{ fontWeight: 700, color: C.t1 }}>{Math.round(hypothesis.confidence_score)}%</span></div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Btn variant="ghost" size="sm" onClick={() => onViewEvidence(hypothesis.id)}>
          View evidence
        </Btn>
        {(hypothesis.status === 'emerging' || hypothesis.status === 'supported') && (
          <Btn variant="secondary" size="sm" onClick={() => onTestAssumption(hypothesis.id)}>
            Test this assumption
          </Btn>
        )}
      </div>
    </Card>
  )
}

function LearnedScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const navigate = useNavigate()
  const [selectedHypothesisId, setSelectedHypothesisId] = useState<number | null>(null)
  const [testHypothesisId, setTestHypothesisId] = useState<number | null>(null)

  const { data: hypotheses = [], isLoading, error, refetch } = useQuery({
    queryKey: ['hypotheses'],
    queryFn: () => apiRequest<UserHypothesisData[]>('/insights/hypotheses/'),
  })

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['hypothesis', selectedHypothesisId],
    queryFn: () => selectedHypothesisId ? apiRequest<UserHypothesisData & { evidence: EvidenceItem[] }>(`/insights/hypotheses/${selectedHypothesisId}/`) : null,
    enabled: !!selectedHypothesisId,
  })

  const { data: testData, isLoading: testLoading } = useQuery({
    queryKey: ['recommendation', 'hypothesis', testHypothesisId],
    queryFn: () => testHypothesisId ? apiRequest<ContrastRecommendationData>(`/insights/hypotheses/${testHypothesisId}/test/`, { method: 'POST' }) : null,
    enabled: !!testHypothesisId,
  })

  if (isLoading) return <LoadingBlock label="Analyzing user evidence & hypotheses…" />
  if (error) return <ErrorBlock message="Could not load your learned hypotheses." onRetry={() => refetch()} />

  const supported = hypotheses.filter(h => h.status === 'supported')
  const emerging = hypotheses.filter(h => h.status === 'emerging')
  const uncertain = hypotheses.filter(h => h.status === 'uncertain')
  const contradicted = hypotheses.filter(h => h.status === 'contradicted')

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', padding: '32px 24px' }} className="fade-up">
      <button onClick={() => setScreen('insights')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: C.t3, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, marginBottom: 20, padding: 0 }}>
        <ChevronLeft size={16} /> Back to insights
      </button>

      <div style={{ marginBottom: 28 }}>
        <h1 className="font-serif" style={{ fontSize: 32, marginBottom: 6 }}>What I've learned about myself</h1>
        <p style={{ fontSize: 15, color: C.t3 }}>Changeable hypotheses built from your completed experiment evidence—not labels or final conclusions.</p>
      </div>

      {/* 1. Strongest Current Patterns */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.acc, letterSpacing: '0.06em', marginBottom: 14 }}>STRONGEST CURRENT PATTERNS</div>
        {supported.map(h => (
          <HypothesisCard
            key={h.id}
            hypothesis={h}
            onViewEvidence={setSelectedHypothesisId}
            onTestAssumption={setTestHypothesisId}
          />
        ))}
        {!supported.length && (
          <Card style={{ color: C.t4, fontSize: 14 }}>
            No fully supported patterns yet. Complete 3+ experiments with strong consistent signals to establish a supported pattern.
          </Card>
        )}
      </div>

      {/* 2. Emerging Patterns */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.amber, letterSpacing: '0.06em', marginBottom: 14 }}>EMERGING PATTERNS</div>
        {emerging.map(h => (
          <HypothesisCard
            key={h.id}
            hypothesis={h}
            onViewEvidence={setSelectedHypothesisId}
            onTestAssumption={setTestHypothesisId}
          />
        ))}
        {!emerging.length && (
          <Card style={{ color: C.t4, fontSize: 14 }}>
            No emerging patterns detected yet. Complete 2 experiments with positive signals to reveal an emerging hypothesis.
          </Card>
        )}
      </div>

      {/* 3. Still Uncertain */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.t4, letterSpacing: '0.06em', marginBottom: 14 }}>STILL UNCERTAIN</div>
        {uncertain.map(h => (
          <HypothesisCard
            key={h.id}
            hypothesis={h}
            onViewEvidence={setSelectedHypothesisId}
            onTestAssumption={setTestHypothesisId}
          />
        ))}
        {!uncertain.length && (
          <Card style={{ color: C.t4, fontSize: 14 }}>
            No uncertain hypotheses at present.
          </Card>
        )}
      </div>

      {/* 4. Contradicted assumptions */}
      {contradicted.length > 0 && <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.red, letterSpacing: '0.06em', marginBottom: 14 }}>LEANING AGAINST</div>
        <p style={{ color: C.t4, fontSize: 13, lineHeight: 1.55, marginBottom: 14 }}>These assumptions have received several low-fit signals. They may still change with a different context.</p>
        {contradicted.map(h => <HypothesisCard key={h.id} hypothesis={h} onViewEvidence={setSelectedHypothesisId} onTestAssumption={setTestHypothesisId} />)}
      </div>}

      {/* View Evidence Modal */}
      {selectedHypothesisId && (
        <ConfirmModal
          open={!!selectedHypothesisId}
          title={`Evidence for ${detailData?.trait.name ?? 'hypothesis'}`}
          message="Experiments that contributed to this trait hypothesis:"
          confirmLabel="Close"
          confirmVariant="primary"
          onConfirm={() => setSelectedHypothesisId(null)}
          onCancel={() => setSelectedHypothesisId(null)}
        >
          {detailLoading ? (
            <p style={{ color: C.t3 }}>Loading evidence…</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '12px 0' }}>
              {detailData?.evidence.map((ev, i) => (
                <div key={i} style={{ padding: 12, borderRadius: 8, background: C.s2, border: `1px solid ${C.br}`, fontSize: 13 }}>
                  <div style={{ fontWeight: 700, color: C.t1, marginBottom: 4 }}>{ev.experiment_title}</div>
                  <div style={{ display: 'flex', gap: 12, color: C.t3 }}>
                    <span>Fit score: <strong style={{ color: C.acc }}>{Math.round(ev.fit_score)}%</strong></span>
                    <span>Confidence: <strong>{Math.round(ev.confidence_score)}%</strong></span>
                    <span>Trait weight: <strong>{ev.weight}/5</strong></span>
                  </div>
                </div>
              ))}
              {!detailData?.evidence?.length && <p style={{ color: C.t4 }}>No supporting evidence records found.</p>}
            </div>
          )}
        </ConfirmModal>
      )}

      {/* Test Assumption Contrast Recommendation Modal */}
      {testHypothesisId && (
        <ConfirmModal
          open={!!testHypothesisId}
          title="Test this assumption"
          message="We found an experiment to test this specific hypothesis:"
          confirmLabel="Explore experiment"
          confirmVariant="primary"
          onConfirm={() => {
            const slug = testData?.recommended_experiment.slug
            setTestHypothesisId(null)
            if (slug) navigate(`/app/experiments/${slug}`)
            else setScreen('library')
          }}
          onCancel={() => setTestHypothesisId(null)}
        >
          {testLoading ? (
            <p style={{ color: C.t3 }}>Finding contrast test experiment…</p>
          ) : testData ? (
            <div style={{ margin: '12px 0' }}>
              <Card accent style={{ marginBottom: 14 }}>
                <Badge label={testData.recommended_experiment.category} color={C.purple} />
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: '8px 0 6px' }}>{testData.recommended_experiment.title}</h3>
                <p style={{ fontSize: 14, color: C.t3, marginBottom: 8 }}>
                  {testData.recommended_experiment.duration_days} days · ~{testData.recommended_experiment.minutes_per_day} min/day
                </p>
                <p style={{ fontSize: 14, color: C.t2, lineHeight: 1.55 }}>
                  {testData.recommended_experiment.description}
                </p>
              </Card>

              <Card style={{ background: `${C.blue}0d`, border: `1px solid ${C.blue}22` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.blue, letterSpacing: '0.05em', marginBottom: 6 }}>WHY THIS EXPERIMENT?</div>
                <p style={{ fontSize: 14, color: C.t2, lineHeight: 1.6 }}>
                  {testData.recommended_experiment.reason}
                </p>
              </Card>
            </div>
          ) : (
            <p style={{ color: C.t4 }}>No candidate experiment found for this hypothesis yet.</p>
          )}
        </ConfirmModal>
      )}
    </div>
  )
}

function HowUnfoldLearns() {
  const steps = [
    { label: 'You try', Icon: Play },
    { label: 'Reflect', Icon: Sparkles },
    { label: 'Evidence', Icon: Archive },
    { label: 'Patterns', Icon: TrendingUp },
    { label: 'Hypothesis', Icon: Brain },
    { label: 'Test again', Icon: Compass },
  ]
  return (
    <Card style={{ marginBottom: 28, background: `linear-gradient(135deg, ${C.accS}, ${C.s1})`, border: `1px solid ${C.accB}` }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.acc, letterSpacing: '0.05em', marginBottom: 8 }}>HOW UNFOLD LEARNS</div>
      <p style={{ color: C.t3, fontSize: 14, lineHeight: 1.6, marginBottom: 18 }}>Unfold does not assign you a fixed identity. It turns repeated, self-reported experiences into assumptions you can test.</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {steps.map(({ label, Icon }, index) => <div key={label} style={{ display: 'contents' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 11px', borderRadius: 10, background: C.s2, border: `1px solid ${C.br}`, fontSize: 12, fontWeight: 700, color: C.t2 }}><Icon size={14} color={C.acc} />{label}</div>
          {index < steps.length - 1 && <ArrowRight size={14} color={C.t4} aria-hidden="true" />}
        </div>)}
      </div>
    </Card>
  )
}

function InsightsScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const navigate = useNavigate()
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['insights'],
    queryFn: () => apiRequest<InsightsData>('/insights/'),
  })
  if (isLoading) return <LoadingBlock label="Finding patterns in your evidence…" />
  if (error) return <ErrorBlock message="Your insights could not be loaded." onRetry={() => refetch()} />
  if (!data?.completed_count) return <div style={{ maxWidth: 840, margin: '0 auto', padding: '32px 24px' }} className="fade-up">
    <h1 className="font-serif" style={{ fontSize: 32, marginBottom: 6 }}>Your insights</h1>
    <p style={{ fontSize: 15, color: C.t3, marginBottom: 28 }}>Patterns grow as you complete experiments.</p>
    <HowUnfoldLearns />
    <EmptyState title="Patterns need more than one clue" copy="Complete your first experiment to begin seeing personal patterns." action="Explore experiments" onAction={() => setScreen('library')} />
  </div>
  const patterns = (data?.patterns ?? []).map((text, index) => ({ text, color: [C.purple, C.blue, C.acc][index % 3], Icon: [Star, Brain, TrendingUp][index % 3] }))
  const categoryColors: Record<string, string> = { Creative: C.purple, Technical: C.blue, Social: C.orange, Nature: C.acc, Service: C.teal, Business: C.indigo, Physical: C.amber }
  const categories = data.categories.map((item) => ({ label: item.label, v: item.value, n: item.count, color: categoryColors[item.label] ?? C.acc }))

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', padding: '32px 24px' }} className="fade-up">
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="font-serif" style={{ fontSize: 32, marginBottom: 6 }}>Your insights</h1>
          <p style={{ fontSize: 15, color: C.t3 }}>Patterns from {data?.completed_count ?? 0} completed experiments.</p>
        </div>
        <Btn variant="secondary" size="sm" onClick={() => setScreen('learned')}>
          What I've learned <ChevronRight size={14} />
        </Btn>
      </div>

      <HowUnfoldLearns />

      {/* Constellation evidence map */}
      <Card style={{ marginBottom: 28, padding: '28px', overflow: 'hidden', position: 'relative', background: `radial-gradient(ellipse at 30% 30%, rgba(34,197,94,0.05) 0%, transparent 60%)` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.t4, letterSpacing: '0.05em', marginBottom: 16 }}>EVIDENCE MAP</div>
        <EvidenceMap nodes={data.evidence_map} categoryColors={categoryColors} onNodeClick={(id) => navigate(`/app/reports/${id}`)} />
        <div style={{ display: 'flex', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
          {Object.entries(
            data.evidence_map.reduce<Record<string, string>>((acc, n) => { acc[n.category] = categoryColors[n.category] ?? C.acc; return acc }, {})
          ).map(([cat, color]) => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.t3 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
              {cat}
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.t4 }}>
            <div style={{ width: 20, height: 2, background: 'rgba(34,197,94,0.35)' }} />
            shared signal
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.t4 }}>
            <div style={{ width: 20, height: 2, background: 'rgba(63,63,70,0.4)', borderTop: '1px dashed rgba(63,63,70,0.6)' }} />
            same category
          </div>
        </div>
      </Card>

      {/* Pattern cards */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.t4, letterSpacing: '0.05em', marginBottom: 14 }}>EMERGING PATTERNS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {patterns.map(({ text, color, Icon }) => (
            <Card key={text} style={{ background: `${color}0d`, border: `1px solid ${color}20` }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={17} color={color} />
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: C.t1 }}>{text}</p>
              </div>
            </Card>
          ))}
          {!patterns.length && <p style={{ color: C.t4 }}>Complete more experiments to reveal repeated signals.</p>}
        </div>
      </div>

      {/* Category fit scores */}
      <Card style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>Category fit signals</h2>
        {categories.map(({ label, v, color, n }) => (
          <div key={label} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Badge label={label} color={color} />
                <span style={{ fontSize: 12, color: C.t4 }}>{n} experiment{n > 1 ? 's' : ''}</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: v >= 70 ? C.acc : C.t2 }}>{v}%</span>
            </div>
            <div style={{ height: 8, background: C.s2, borderRadius: 999 }}>
              <div style={{ height: '100%', width: `${v}%`, background: color, borderRadius: 999, opacity: 0.85 }} />
            </div>
          </div>
        ))}
      </Card>

      {/* Metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
        {[
          { label: 'Avg fit signal', value: data?.average_fit ?? 0, sfx: '%', sub: `across ${data?.completed_count ?? 0} experiments`, color: C.acc },
          { label: 'Curiosity rate', value: Math.round((data.average_curiosity ?? 0) * 10) / 10, sfx: '/5', sub: 'avg across all check-ins', color: C.blue },
          { label: 'Repeat intent', value: data.average_repeat_intent ?? 0, sfx: '%', sub: 'from final reflections', color: C.purple },
          { label: 'Consistency', value: data.average_consistency ?? 0, sfx: '%', sub: 'planned days with check-ins', color: C.amber },
        ].map(({ label, value, sfx, sub, color }) => (
          <Card key={label} style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color, marginBottom: 4 }}><AnimatedCounter value={value} suffix={sfx} /></div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.t2, marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 12, color: C.t4 }}>{sub}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ─── SCREEN: Evidence Vault ───────────────────────────────────────────────────
function VaultScreen({ setScreen: _setScreen }: { setScreen: (s: Screen) => void }) {
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

// ─── SCREEN: Profile ──────────────────────────────────────────────────────────
type ProfileActivityData = {
  today: string
  days: { date: string; count: number }[]
  total_checkins: number
  active_days: number
  current_streak: number
  longest_streak: number
}

function StreakTracker({ activity, loading }: { activity?: ProfileActivityData; loading: boolean }) {
  const weekCount = 20
  const today = new Date(`${activity?.today ?? new Date().toISOString().slice(0, 10)}T12:00:00`)
  const latestSunday = new Date(today)
  latestSunday.setDate(today.getDate() - today.getDay())
  const firstSunday = new Date(latestSunday)
  firstSunday.setDate(latestSunday.getDate() - (weekCount - 1) * 7)
  const activityByDate = new Map((activity?.days ?? []).map((day) => [day.date, day.count]))
  const toDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  const weeks = Array.from({ length: weekCount }, (_, weekIndex) => Array.from({ length: 7 }, (_, dayIndex) => {
    const date = new Date(firstSunday)
    date.setDate(firstSunday.getDate() + weekIndex * 7 + dayIndex)
    const key = toDateKey(date)
    return { date, key, count: activityByDate.get(key) ?? 0 }
  }))

  return (
    <Card className="streak-card" style={{ marginBottom: 20, padding: 0, overflow: 'hidden' }}>
      <div className="streak-card-header">
        <div>
          <div className="ui-eyebrow">Activity streak</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: '7px 0 4px' }}>Your consistency map</h2>
          <p style={{ color: C.t3, fontSize: 13, margin: 0 }}>Every completed check-in adds a signal.</p>
        </div>
        <div className="streak-current"><Flame size={19} strokeWidth={2.2} /><strong>{activity?.current_streak ?? 0}</strong><span>day streak</span></div>
      </div>

      <div className="streak-chart-scroll" aria-label="Check-in activity over the last 20 weeks">
        <div className="streak-chart-inner">
          <div className="streak-month-row" aria-hidden="true">
            <span />
            <div className="streak-months">
              {weeks.map((week, index) => {
                const monthChanged = index === 0 || week[0].date.getMonth() !== weeks[index - 1][0].date.getMonth()
                return <span key={week[0].key}>{monthChanged ? week[0].date.toLocaleDateString(undefined, { month: 'short' }) : ''}</span>
              })}
            </div>
          </div>
          <div className="streak-grid-row">
            <div className="streak-day-labels" aria-hidden="true"><span>Mon</span><span>Wed</span><span>Fri</span></div>
            <div className={`streak-weeks${loading ? ' skeleton' : ''}`}>
              {weeks.map((week) => <div className="streak-week" key={week[0].key}>
                {week.map(({ date, key, count }) => {
                  const level = count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : count === 3 ? 3 : 4
                  const future = date > today
                  const label = `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}: ${count} check-in${count === 1 ? '' : 's'}`
                  return <span key={key} className={`streak-cell level-${future ? 0 : level}${future ? ' future' : ''}`} title={label} aria-label={label} />
                })}
              </div>)}
            </div>
          </div>
        </div>
      </div>

      <div className="streak-card-footer">
        {[
          { value: activity?.longest_streak ?? 0, label: 'Best streak' },
          { value: activity?.active_days ?? 0, label: 'Active days' },
          { value: activity?.total_checkins ?? 0, label: 'Check-ins' },
        ].map((stat) => <div key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}
        <div className="streak-legend" aria-label="Activity intensity"><span>Less</span>{[0, 1, 2, 3, 4].map((level) => <i key={level} className={`streak-cell level-${level}`} />)}<span>More</span></div>
      </div>
    </Card>
  )
}

function ProfileScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const [theme, setTheme] = useState<ThemePreference>(() => (localStorage.getItem('unfold-theme') as ThemePreference | null) ?? 'dark')
  const [showConsents, setShowConsents] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const queryClient = useQueryClient()
  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => apiRequest<UserData | null>('/auth/me/') })
  const { data: activity, isPending: activityLoading } = useQuery({
    queryKey: ['profile-activity'],
    queryFn: () => apiRequest<ProfileActivityData>('/profile/activity/'),
  })
  const [displayName, setDisplayName] = useState(user?.display_name ?? '')
  const [reminderTime, setReminderTime] = useState(user?.reminder_time?.slice(0, 5) ?? '19:30')
  const [timezone, setTimezone] = useState(user?.timezone ?? 'Africa/Nairobi')
  useEffect(() => {
    if (!user) return
    setDisplayName(user.display_name ?? '')
    setReminderTime(user.reminder_time?.slice(0, 5) ?? '19:30')
    setTimezone(user.timezone ?? 'Africa/Nairobi')
  }, [user])
  const updateProfile = useMutation({
    mutationFn: (data: object) => apiRequest<UserData>('/auth/me/', { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: (data) => { queryClient.setQueryData(['me'], data); addToast('Settings saved') },
  })
  const { data: consents = [] } = useQuery({
    queryKey: ['consent-history'],
    queryFn: () => apiRequest<{ id: number; kind: string; granted: boolean; policy_version: string; created_at: string }[]>('/auth/consents/'),
    enabled: showConsents,
  })
  const exportData = useMutation({
    mutationFn: () => apiRequest<Record<string, any>>('/auth/export/'),
    onSuccess: (data) => {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const W = 210, M = 20
      const contentW = W - M * 2
      let y = 0

      const ensurePage = (need: number) => {
        if (y + need > 277) { doc.addPage(); y = M; }
      }

      // ── Helper: draw a horizontal rule ──
      const hr = () => {
        doc.setDrawColor(200, 200, 200)
        doc.setLineWidth(0.3)
        doc.line(M, y, W - M, y)
        y += 6
      }

      // ── Helper: draw colored bar ──
      const bar = (x: number, _w: number, value: number, maxW: number, color: [number, number, number]) => {
        doc.setFillColor(240, 240, 240)
        doc.roundedRect(x, y, maxW, 4, 2, 2, 'F')
        doc.setFillColor(...color)
        doc.roundedRect(x, y, Math.max(2, (value / 100) * maxW), 4, 2, 2, 'F')
      }

      // ══════════════ COVER ══════════════
      doc.setFillColor(9, 9, 11)
      doc.rect(0, 0, W, 297, 'F')

      // Green accent circle
      doc.setFillColor(34, 197, 94)
      doc.circle(W / 2, 100, 18, 'F')
      doc.setFillColor(9, 9, 11)
      doc.circle(W / 2, 100, 14, 'F')
      doc.setFillColor(34, 197, 94)
      doc.circle(W / 2, 100, 4, 'F')

      doc.setTextColor(250, 250, 250)
      doc.setFontSize(32)
      doc.text('Unfold', W / 2, 138, { align: 'center' })
      doc.setFontSize(12)
      doc.setTextColor(161, 161, 170)
      doc.text('Your Personal Evidence Report', W / 2, 150, { align: 'center' })

      doc.setFontSize(10)
      doc.setTextColor(113, 113, 122)
      const profile = data.profile || {}
      doc.text(profile.display_name || profile.email || 'Explorer', W / 2, 175, { align: 'center' })
      doc.text(`Exported ${new Date(data.exported_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, W / 2, 182, { align: 'center' })

      const experiments = data.experiments || []
      const completed = experiments.filter((e: any) => e.status === 'completed')
      doc.setTextColor(161, 161, 170)
      doc.text(`${completed.length} experiments completed  •  ${experiments.reduce((s: number, e: any) => s + (e.checkin_count || 0), 0)} total check-ins`, W / 2, 200, { align: 'center' })

      // ══════════════ EXPERIMENTS ══════════════
      experiments.forEach((exp: any, idx: number) => {
        doc.addPage()
        y = M

        // Header bar
        doc.setFillColor(24, 24, 27)
        doc.roundedRect(M, y, contentW, 32, 3, 3, 'F')

        doc.setFontSize(16)
        doc.setTextColor(250, 250, 250)
        doc.text(exp.experiment?.title || `Experiment ${idx + 1}`, M + 10, y + 13)

        doc.setFontSize(9)
        doc.setTextColor(161, 161, 170)
        const meta = [exp.experiment?.category, `${exp.experiment?.duration_days || '?'} days`, exp.status].filter(Boolean).join('  •  ')
        doc.text(meta, M + 10, y + 23)

        // Fit signal badge
        const fit = exp.fit_signal || 0
        const fitColor: [number, number, number] = fit >= 70 ? [34, 197, 94] : fit >= 45 ? [245, 158, 11] : [161, 161, 170]
        doc.setFillColor(...fitColor)
        doc.roundedRect(W - M - 30, y + 6, 20, 20, 3, 3, 'F')
        doc.setFontSize(14)
        doc.setTextColor(9, 9, 11)
        doc.text(`${fit}%`, W - M - 20, y + 19, { align: 'center' })

        y += 40

        // Start date & strongest signal
        doc.setFontSize(10)
        doc.setTextColor(100, 100, 110)
        doc.text(`Started: ${exp.start_date || 'N/A'}`, M, y)
        doc.text(`Strongest signal: ${exp.strongest_signal || 'N/A'}`, M + 80, y)
        y += 10

        // Dimension breakdown
        if (exp.dimensions) {
          doc.setFontSize(11)
          doc.setTextColor(60, 60, 68)
          doc.text('Dimension Breakdown', M, y)
          y += 8

          Object.entries(exp.dimensions as Record<string, number>).forEach(([dim, val]) => {
            ensurePage(12)
            doc.setFontSize(9)
            doc.setTextColor(100, 100, 110)
            doc.text(dim, M, y + 3)
            doc.text(`${val}%`, M + 42, y + 3)
            const barColor: [number, number, number] = val >= 70 ? [34, 197, 94] : val >= 45 ? [245, 158, 11] : [161, 161, 170]
            bar(M + 52, contentW - 52, val, contentW - 52, barColor)
            y += 9
          })
          y += 4
        }

        // Summary
        if (exp.summary) {
          ensurePage(25)
          hr()
          doc.setFontSize(10)
          doc.setTextColor(60, 60, 68)
          doc.text('Final Reflection', M, y)
          y += 6
          doc.setFontSize(9)
          doc.setTextColor(80, 80, 88)
          const lines = doc.splitTextToSize(exp.summary, contentW)
          doc.text(lines, M, y)
          y += lines.length * 4.5 + 4
        }

        // Reason
        if (exp.reason) {
          ensurePage(20)
          doc.setFontSize(10)
          doc.setTextColor(60, 60, 68)
          doc.text('Why you started', M, y)
          y += 6
          doc.setFontSize(9)
          doc.setTextColor(80, 80, 88)
          const lines = doc.splitTextToSize(exp.reason, contentW)
          doc.text(lines, M, y)
          y += lines.length * 4.5 + 4
        }

        // Check-ins table
        const checkins = exp.checkins || []
        if (checkins.length) {
          ensurePage(20)
          hr()
          doc.setFontSize(10)
          doc.setTextColor(60, 60, 68)
          doc.text(`Check-ins (${checkins.length})`, M, y)
          y += 7

          // Table header
          doc.setFillColor(245, 245, 248)
          doc.rect(M, y, contentW, 7, 'F')
          doc.setFontSize(8)
          doc.setTextColor(100, 100, 110)
          const cols = [M + 2, M + 22, M + 42, M + 62, M + 82, M + 102]
          const headers = ['Day', 'Energy', 'Curiosity', 'Meaning', 'Difficulty', 'Note']
          headers.forEach((h, i) => doc.text(h, cols[i], y + 5))
          y += 9

          checkins.forEach((ci: any) => {
            ensurePage(8)
            doc.setFontSize(8)
            doc.setTextColor(70, 70, 78)
            doc.text(String(ci.day_number || ''), cols[0], y + 3)
            doc.text(`${ci.energy}/5`, cols[1], y + 3)
            doc.text(`${ci.curiosity}/5`, cols[2], y + 3)
            doc.text(`${ci.meaning}/5`, cols[3], y + 3)
            doc.text(`${ci.difficulty}/5`, cols[4], y + 3)
            const note = ci.notes ? (ci.notes.length > 30 ? ci.notes.slice(0, 28) + '…' : ci.notes) : '—'
            doc.text(note, cols[5], y + 3)

            doc.setDrawColor(235, 235, 238)
            doc.setLineWidth(0.2)
            doc.line(M, y + 5, W - M, y + 5)
            y += 7
          })
          y += 4
        }
      })

      // ══════════════ SAVED EXPERIMENTS ══════════════
      const saved = data.saved_experiments || []
      if (saved.length) {
        doc.addPage()
        y = M
        doc.setFontSize(14)
        doc.setTextColor(40, 40, 44)
        doc.text('Saved Experiments', M, y)
        y += 10
        saved.forEach((s: any) => {
          ensurePage(10)
          doc.setFontSize(10)
          doc.setTextColor(60, 60, 68)
          doc.text(`• ${s.experiment?.title || 'Untitled'}`, M, y)
          doc.setTextColor(140, 140, 148)
          doc.text(s.experiment?.category || '', M + 120, y)
          y += 7
        })
      }

      // ══════════════ FOOTER on every page ══════════════
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(180, 180, 185)
        doc.text('Unfold — Evidence-based self-discovery', M, 290)
        doc.text(`Page ${i} of ${pageCount}`, W - M, 290, { align: 'right' })
      }

      doc.save(`unfold-report-${new Date().toISOString().slice(0, 10)}.pdf`)
      addToast('PDF report downloaded')
    },
  })
  const deleteUser = useMutation({
    mutationFn: () => apiRequest('/auth/delete-account/', { method: 'POST', body: JSON.stringify({ confirmation: 'DELETE' }) }),
    onSuccess: () => { queryClient.clear(); setScreen('landing') },
  })
  const logoutUser = useMutation({
    mutationFn: () => apiRequest('/auth/logout/', { method: 'POST' }),
    onSuccess: () => { queryClient.clear(); setScreen('landing') },
  })
  const chooseTheme = (preference: ThemePreference) => {
    setTheme(preference)
    localStorage.setItem('unfold-theme', preference)
    applyThemePreference(preference)
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }} className="fade-up">
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 28, letterSpacing: '-0.02em' }}>Profile & settings</h1>

      {/* Avatar */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: `linear-gradient(135deg, ${C.purple}44, ${C.blue}44)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: C.purple }}>{(user?.display_name || user?.email || 'U')[0].toUpperCase()}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{user?.display_name || 'Explorer'}</div>
            <div style={{ color: C.t4, fontSize: 14 }}>{user?.email}</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px', gap: 10, marginBottom: 16 }}>
          <input aria-label="Display name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Display name" style={{ background: C.s2, border: `1px solid ${C.br}`, color: C.t1, borderRadius: 9, padding: '10px 12px', font: 'inherit' }} />
          <Btn size="sm" disabled={updateProfile.isPending} onClick={() => updateProfile.mutate({ display_name: displayName })}>Save name</Btn>
        </div>
        {[
          { label: 'Display name', value: user?.display_name || 'Not set' },
          { label: 'Email', value: user?.email || '' },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: `1px solid ${C.br}` }}>
            <span style={{ fontSize: 14, color: C.t3 }}>{label}</span>
            <span style={{ fontSize: 14, color: C.t1 }}>{value}</span>
          </div>
        ))}
        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: `1px solid ${C.br}`, color: C.t3, fontSize: 14 }}>
          Timezone
          <select value={timezone} onChange={(event) => { setTimezone(event.target.value); updateProfile.mutate({ timezone: event.target.value }) }} style={{ background: C.s2, color: C.t1, border: `1px solid ${C.br}`, borderRadius: 8, padding: 8 }}>
            {['Africa/Nairobi', 'Africa/Lagos', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Tokyo', 'Australia/Sydney'].map((zone) => <option key={zone}>{zone}</option>)}
          </select>
        </label>
      </Card>

      <StreakTracker activity={activity} loading={activityLoading} />

      {/* Reminders */}
      <Card style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Reminders</h2>
        {[
          { label: 'Enable reminders', field: 'reminders_enabled', active: Boolean(user?.reminders_enabled) },
          { label: 'Send by email', field: 'email_reminders_enabled', active: Boolean(user?.email_reminders_enabled) },
        ].map(({ label, field, active }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 14, color: C.t2 }}>{label}</span>
            <button role="switch" aria-checked={active} aria-label={label} onClick={() => updateProfile.mutate({ [field]: !active })} style={{ width: 44, height: 24, padding: 0, border: 0, borderRadius: 12, background: active ? C.acc : C.s2, position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
              <div style={{ position: 'absolute', top: 3, left: active ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: C.t1, transition: 'left 0.2s' }} />
            </button>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: `1px solid ${C.br}` }}>
          <span style={{ fontSize: 14, color: C.t2 }}>Preferred time</span>
          <input aria-label="Preferred reminder time" type="time" value={reminderTime} onChange={(event) => { setReminderTime(event.target.value); updateProfile.mutate({ reminder_time: event.target.value }) }} style={{ background: C.s2, border: `1px solid ${C.br}`, color: C.t1, borderRadius: 8, padding: 8 }} />
        </div>
        <p style={{ color: C.t4, fontSize: 12, margin: '12px 0 0' }}>Reminders use {timezone}. A preview: “Today’s experiment is ready when you are.”</p>
        {updateProfile.error && <p role="alert" style={{ color: C.red, fontSize: 13 }}>{updateProfile.error.message}</p>}
      </Card>

      {/* Appearance */}
      <Card style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Appearance</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          {([['dark', 'Dark', Moon], ['light', 'Light', Sun], ['system', 'System', Settings]] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => chooseTheme(id)} style={{
              flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${theme === id ? C.accB : C.br}`,
              background: theme === id ? C.accS : C.s1, color: theme === id ? C.acc : C.t3,
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transition: 'all 0.15s',
            }}>
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </Card>

      {/* Privacy */}
      <Card style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lock size={16} color={C.t4} /> Privacy & data
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 10, background: C.s2 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, color: C.t2, fontSize: 14 }}><BarChart2 size={15} color={C.t4} />Optional analytics</span>
            <button role="switch" aria-checked={Boolean(user?.analytics_consent)} aria-label="Optional analytics consent" onClick={() => updateProfile.mutate({ analytics_consent: !user?.analytics_consent })} style={{ width: 44, height: 24, padding: 0, border: 0, borderRadius: 12, background: user?.analytics_consent ? C.acc : C.bg2, position: 'relative', cursor: 'pointer' }}>
              <span style={{ position: 'absolute', top: 3, left: user?.analytics_consent ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: C.t1, transition: 'left 0.2s' }} />
            </button>
          </div>
          <button onClick={() => setShowConsents((visible) => !visible)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: C.s2, border: 'none', color: C.t2, fontFamily: 'inherit', fontSize: 14, cursor: 'pointer' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Shield size={15} color={C.t4} />View consent history</span>
            <ChevronRight size={14} color={C.t4} style={{ transform: showConsents ? 'rotate(90deg)' : undefined }} />
          </button>
          {showConsents && <div style={{ background: C.bg2, borderRadius: 10, padding: '4px 14px' }}>
            {!consents.length && <p style={{ color: C.t4, fontSize: 13 }}>No consent records found.</p>}
            {consents.map((record) => <div key={record.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: `1px solid ${C.br}`, fontSize: 12 }}>
              <span style={{ color: C.t2 }}>{record.kind}: {record.granted ? 'Granted' : 'Declined'}</span>
              <span style={{ color: C.t4 }}>{new Date(record.created_at).toLocaleDateString()}</span>
            </div>)}
          </div>}
          <button disabled={exportData.isPending} onClick={() => exportData.mutate()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: C.s2, border: 'none', color: C.t2, fontFamily: 'inherit', fontSize: 14, cursor: 'pointer' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Download size={15} color={C.t4} />{exportData.isPending ? 'Preparing PDF…' : 'Export as PDF'}</span>
            <ChevronRight size={14} color={C.t4} />
          </button>
          <button disabled={deleteUser.isPending} onClick={() => setShowDeleteModal(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.07)', border: `1px solid rgba(239,68,68,0.2)`, color: C.red, fontFamily: 'inherit', fontSize: 14, cursor: 'pointer' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Trash2 size={15} />Delete account</span>
            <ChevronRight size={14} />
          </button>
          {(exportData.error || deleteUser.error) && <p role="alert" style={{ color: C.red, fontSize: 13 }}>{(exportData.error || deleteUser.error)?.message}</p>}
        </div>
      </Card>
      <Btn variant="ghost" full disabled={logoutUser.isPending} onClick={() => logoutUser.mutate()}>Log out</Btn>

      <ConfirmModal
        open={showDeleteModal}
        title="Delete your account?"
        message="This permanently deletes your account and all evidence. This action cannot be undone."
        confirmLabel="Delete account permanently"
        confirmVariant="danger"
        onConfirm={() => { if (deleteConfirmation === 'DELETE') { setShowDeleteModal(false); deleteUser.mutate() } }}
        onCancel={() => { setShowDeleteModal(false); setDeleteConfirmation('') }}
      >
        <label style={{ display: 'block', color: C.t2, fontSize: 14 }}>
          <span style={{ display: 'block', marginBottom: 7 }}>Type DELETE to confirm</span>
          <input value={deleteConfirmation} onChange={e => setDeleteConfirmation(e.target.value)} placeholder="DELETE" style={{ width: '100%', background: C.s2, color: C.t1, border: `1px solid ${deleteConfirmation === 'DELETE' ? C.red : C.br}`, borderRadius: 10, padding: '12px 14px', font: 'inherit' }} />
        </label>
      </ConfirmModal>
    </div>
  )
}

// ─── SCREEN: Help ─────────────────────────────────────────────────────────────
function HelpScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
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

// ─── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const preference = (localStorage.getItem('unfold-theme') as ThemePreference | null) ?? 'dark'
    applyThemePreference(preference)
    const media = window.matchMedia('(prefers-color-scheme: light)')
    const handleSystemTheme = () => {
      if ((localStorage.getItem('unfold-theme') ?? 'dark') === 'system') applyThemePreference('system')
    }
    media.addEventListener('change', handleSystemTheme)
    return () => media.removeEventListener('change', handleSystemTheme)
  }, [])
  useEffect(() => {
    const updateConnection = () => setIsOnline(navigator.onLine)
    window.addEventListener('online', updateConnection)
    window.addEventListener('offline', updateConnection)
    return () => {
      window.removeEventListener('online', updateConnection)
      window.removeEventListener('offline', updateConnection)
    }
  }, [])
  const paths: Record<Screen, string> = {
    landing: '/', login: '/login', register: '/register', 'forgot-password': '/forgot-password', 'reset-password': '/reset-password',
    privacy: '/privacy', terms: '/terms', onboarding: '/onboarding', home: '/app', library: '/app/explore',
    detail: '/app/experiments/photography-walk', commit: '/app/experiments/photography-walk/commit', saved: '/app/saved', checkin: '/app/check-in',
    'checkin-done': '/app/check-in/complete', reflection: '/app/reflection', report: '/app/report',
    insights: '/app/insights', learned: '/app/insights/learned', vault: '/app/vault', profile: '/app/profile', help: '/app/help',
  }
  const screen = (location.pathname.startsWith('/app/reports/') ? 'report' :
    location.pathname.endsWith('/commit') && location.pathname.startsWith('/app/experiments/') ? 'commit' :
    location.pathname.startsWith('/app/experiments/') ? 'detail' :
    Object.entries(paths).find(([, path]) => path === location.pathname)?.[0] ?? 'landing') as Screen
  const setScreen = (next: Screen) => navigate(paths[next])
  const { data: user, isLoading: authLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => apiRequest<UserData | null>('/auth/me/'),
    retry: false,
  })

  const authenticatedScreens: Screen[] = ['onboarding', 'home', 'library', 'detail', 'commit', 'saved', 'checkin', 'checkin-done', 'reflection', 'report', 'insights', 'learned', 'vault', 'profile', 'help']
  const isAuthenticated = authenticatedScreens.includes(screen)

  const renderScreen = () => {
    switch (screen) {
      case 'landing':    return <LandingScreen setScreen={setScreen} />
      case 'login':      return <AuthScreen mode="login" setScreen={setScreen} />
      case 'register':   return <AuthScreen mode="register" setScreen={setScreen} />
      case 'forgot-password': return <ForgotPasswordScreen setScreen={setScreen} />
      case 'reset-password': return <ResetPasswordScreen setScreen={setScreen} />
      case 'privacy':    return <LegalScreen kind="privacy" setScreen={setScreen} />
      case 'terms':      return <LegalScreen kind="terms" setScreen={setScreen} />
      default: break
    }

    if (isAuthenticated) {
      if (authLoading) return <LoadingBlock label="Restoring your session…" />
      if (!user) return <AuthScreen mode="login" setScreen={setScreen} />
      if (screen === 'onboarding') return <OnboardingScreen setScreen={setScreen} />
      if (screen === 'checkin') return <CheckinScreen setScreen={setScreen} />
      if (screen === 'checkin-done') return <CheckinDoneScreen setScreen={setScreen} />
      if (screen === 'reflection') return <FinalReflectionScreen setScreen={setScreen} />
      const content = (() => {
        switch (screen) {
          case 'home':     return <HomeScreen setScreen={setScreen} />
          case 'library':  return <LibraryScreen setScreen={setScreen} />
          case 'detail':   return <DetailScreen setScreen={setScreen} />
          case 'commit':   return <CommitmentScreen setScreen={setScreen} />
          case 'saved':    return <SavedExperimentsScreen setScreen={setScreen} />
          case 'report':   return <ReportScreen setScreen={setScreen} />
          case 'insights': return <InsightsScreen setScreen={setScreen} />
          case 'learned':  return <LearnedScreen setScreen={setScreen} />
          case 'vault':    return <VaultScreen setScreen={setScreen} />
          case 'profile':  return <ProfileScreen setScreen={setScreen} />
          case 'help':     return <HelpScreen setScreen={setScreen} />
          default:         return null
        }
      })()

      return <AppShell screen={screen} setScreen={setScreen}>{content}</AppShell>
    }
  }

  return (
    <div>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <ToastContainer />
      {!isOnline && <div role="status" style={{ position: 'fixed', zIndex: 100, top: 0, left: 0, right: 0, padding: '9px 16px', textAlign: 'center', background: C.amber, color: '#271500', fontSize: 13, fontWeight: 700 }}>You appear to be offline. Check-in progress is kept on this device.</div>}
      {renderScreen()}
    </div>
  )
}
