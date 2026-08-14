import { useEffect, useState } from 'react'
import { Brain, Dumbbell, Heart, Leaf, Sparkles, Star, TrendingUp, Users } from 'lucide-react'
import { C } from '@/app/theme'

export function BrandMark({ size = 38 }: { size?: number }) {
  return (
    <span aria-hidden="true" className="brand-mark" style={{ width: size, height: size }}>
      <Sparkles size={Math.round(size * 0.48)} strokeWidth={2.25} />
    </span>
  )
}

export function ConfirmModal({ open, title, message, confirmLabel = 'Confirm', confirmVariant = 'danger' as const, onConfirm, onCancel, children }: {
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

export function AnimatedCounter({ value, suffix = '', duration = 1200 }: { value: number; suffix?: string; duration?: number }) {
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

export function SkeletonCard() {
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

export function Btn({
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

export function LoadingBlock({ label }: { label: string }) {
  return <div role="status" aria-live="polite" style={{ maxWidth: 680, margin: '60px auto', padding: 24 }}>
    <div className="skeleton" style={{ width: '42%', height: 24, borderRadius: 8, marginBottom: 14 }} />
    <div className="skeleton" style={{ width: '100%', height: 120, borderRadius: 14, marginBottom: 12 }} />
    <span style={{ color: C.t3, fontSize: 14 }}>{label}</span>
  </div>
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div role="alert" style={{ maxWidth: 560, margin: '70px auto', padding: 24, textAlign: 'center' }}>
    <h2 className="font-serif" style={{ fontSize: 24, marginBottom: 8 }}>Something went wrong</h2>
    <p style={{ color: C.t3, marginBottom: 18 }}>{message} Your data was not deleted.</p>
    <Btn onClick={onRetry}>Try again</Btn>
  </div>
}

export function EmptyState({ title, copy, action, onAction }: { title: string; copy: string; action: string; onAction: () => void }) {
  return <div style={{ maxWidth: 580, margin: '60px auto', padding: '36px 32px', textAlign: 'center' }}>
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><BrandMark size={56} /></div>
    <h1 className="font-serif" style={{ fontSize: 28, marginBottom: 10 }}>{title}</h1>
    <p style={{ color: C.t3, lineHeight: 1.65, marginBottom: 24, fontSize: 15 }}>{copy}</p>
    <Btn onClick={onAction}>{action}</Btn>
  </div>
}

export function Card({ children, style, onClick, accent = false, className = '' }: {
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

export function CategoryChip({ label, color, icon: IconProp, active = false, onClick }: {
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

export function ProgressBar({ value, max, label }: { value: number; max: number; label?: string }) {
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

export function Badge({ label, color }: { label: string; color: string }) {
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

export function ScoreBar({ label, value }: { label: string; value: number }) {
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
