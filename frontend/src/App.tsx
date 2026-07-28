import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import {
  Home, Compass, BarChart2, Archive, User, Bell, Bookmark,
  ChevronRight, ChevronLeft, ArrowRight, Check, X, Play,
  Star, Heart, Brain, TrendingUp, Calendar, Clock,
  BookOpen, Leaf, Users, Dumbbell, Settings,
  HelpCircle, Search, MoreHorizontal,
  Shield, Lock, Download, Trash2, Moon, Sun
} from 'lucide-react'

// ─── Color tokens ────────────────────────────────────────────────────────────
const C = {
  bg:      '#09090B',
  bg2:     '#111113',
  s1:      '#18181B',
  s2:      '#27272A',
  br:      '#3F3F46',
  t1:      '#FAFAFA',
  t2:      '#D4D4D8',
  t3:      '#A1A1AA',
  t4:      '#71717A',
  acc:     '#22C55E',
  accH:    '#16A34A',
  accS:    'rgba(34,197,94,0.12)',
  accB:    'rgba(34,197,94,0.28)',
  purple:  '#8B5CF6',
  blue:    '#3B82F6',
  orange:  '#FB923C',
  teal:    '#14B8A6',
  amber:   '#F59E0B',
  indigo:  '#6366F1',
  red:     '#EF4444',
  sky:     '#38BDF8',
}

type Screen = 'landing' | 'home' | 'library' | 'detail' | 'checkin' | 'checkin-done' | 'report' | 'insights' | 'vault' | 'onboarding' | 'profile'

// ─── Shared primitives ───────────────────────────────────────────────────────

function Btn({
  children, variant = 'primary', onClick, size = 'md', full = false, disabled = false
}: {
  children: React.ReactNode; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  onClick?: () => void; size?: 'sm' | 'md' | 'lg'; full?: boolean; disabled?: boolean
}) {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    fontFamily: 'inherit', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none', borderRadius: 10, transition: 'all 0.15s',
    width: full ? '100%' : undefined, opacity: disabled ? 0.45 : 1,
    letterSpacing: '0.01em',
  }
  const sizes = { sm: { padding: '8px 14px', fontSize: 13 }, md: { padding: '11px 20px', fontSize: 15 }, lg: { padding: '14px 28px', fontSize: 16 } }
  const variants: Record<string, React.CSSProperties> = {
    primary:   { background: C.acc, color: '#052e16' },
    secondary: { background: C.s2, color: C.t1, border: `1px solid ${C.br}` },
    ghost:     { background: 'transparent', color: C.t2, border: `1px solid ${C.br}` },
    danger:    { background: 'rgba(239,68,68,0.1)', color: C.red, border: `1px solid rgba(239,68,68,0.3)` },
  }
  return (
    <button style={{ ...base, ...sizes[size], ...variants[variant] }} onClick={onClick} disabled={disabled}
      onMouseEnter={e => { if (!disabled) (e.currentTarget.style.filter = 'brightness(1.1)') }}
      onMouseLeave={e => { e.currentTarget.style.filter = '' }}>
      {children}
    </button>
  )
}

function Card({ children, style, onClick, accent = false }: {
  children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void; accent?: boolean
}) {
  const base: React.CSSProperties = {
    background: C.s1, borderRadius: 16, padding: '20px 24px',
    border: accent ? `1px solid ${C.accB}` : `1px solid ${C.br}`,
    boxShadow: accent
      ? `0 0 0 1px ${C.accB}, 0 12px 30px rgba(34,197,94,0.07)`
      : '0 8px 24px rgba(0,0,0,0.2)',
    cursor: onClick ? 'pointer' : undefined,
    transition: 'all 0.18s',
    ...style,
  }
  return (
    <div style={base} onClick={onClick}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = C.br.replace('46','56') } }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = accent ? C.accB : C.br }}>
      {children}
    </div>
  )
}

function CategoryChip({ label, color, icon: Icon, active = false, onClick }: {
  label: string; color: string; icon?: React.ElementType; active?: boolean; onClick?: () => void
}) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px',
      borderRadius: 999, fontFamily: 'inherit', fontSize: 13, fontWeight: 500, cursor: 'pointer',
      background: active ? `${color}1e` : 'transparent',
      color: active ? color : C.t3,
      border: `1px solid ${active ? `${color}55` : C.br}`,
      transition: 'all 0.15s',
    }}>
      {Icon && <Icon size={13} />}
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
      <div style={{ height: 6, background: C.s2, borderRadius: 999, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: C.acc, borderRadius: 999,
          transition: 'width 0.6s ease',
          boxShadow: `0 0 8px ${C.accS}`,
        }} />
      </div>
    </div>
  )
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 9px',
      borderRadius: 999, fontSize: 12, fontWeight: 600,
      background: `${color}1a`, color, border: `1px solid ${color}33`,
    }}>{label}</span>
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
function Constellation({ w = 560, h = 320 }: { w?: number; h?: number }) {
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

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bg, overflow: 'hidden' }}>
      {/* Sidebar – visible md+ */}
      <aside style={{
        width: 220, flexShrink: 0, background: C.bg2,
        borderRight: `1px solid ${C.br}`,
        display: 'flex', flexDirection: 'column',
        padding: '20px 12px',
      }} className="hidden md:flex">
        {/* Logo */}
        <div style={{ padding: '8px 12px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, background: C.accS,
              border: `1px solid ${C.accB}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: C.acc }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: C.t1, letterSpacing: '-0.01em' }}>Purpose</span>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(({ id, label, Icon }) => {
            const active = screen === id
            return (
              <button key={id} onClick={() => setScreen(id)} style={{
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
          {[{ Icon: Settings, label: 'Settings' }, { Icon: HelpCircle, label: 'Help' }].map(({ Icon, label }) => (
            <button key={label} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
              borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 13, fontWeight: 500, background: 'transparent', color: C.t4,
              transition: 'all 0.15s',
            }}>
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <main style={{ flex: 1, overflowY: 'auto', padding: '0 0 80px' }} className="md:pb-0">
          {children}
        </main>

        {/* Bottom nav – mobile */}
        <nav className="md:hidden" style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: C.bg2, borderTop: `1px solid ${C.br}`,
          display: 'flex', padding: '8px 0 12px',
          zIndex: 50,
        }}>
          {navItems.map(({ id, label, Icon }) => {
            const active = screen === id
            return (
              <button key={id} onClick={() => setScreen(id)} style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 10, fontWeight: 600, color: active ? C.acc : C.t4,
                padding: '4px 0', transition: 'color 0.15s',
              }}>
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
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 40px', borderBottom: `1px solid ${C.br}`,
        position: 'sticky', top: 0, background: C.bg, zIndex: 40,
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7, background: C.accS,
            border: `1px solid ${C.accB}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: C.acc }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em' }}>Purpose</span>
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={() => setScreen('library')} style={{ background: 'none', border: 'none', color: C.t3, fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', padding: '6px 12px' }}>Browse experiments</button>
          <Btn variant="ghost" size="sm" onClick={() => setScreen('home')}>Log in</Btn>
          <Btn variant="primary" size="sm" onClick={() => setScreen('onboarding')}>Start free</Btn>
        </nav>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 40px 60px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
        <div className="fade-up">
          <div style={{ marginBottom: 16 }}>
            <Badge label="Evidence-based self-discovery" color={C.acc} />
          </div>
          <h1 style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.08, marginBottom: 20, letterSpacing: '-0.03em' }}>
            Discover yourself<br />
            <span style={{ color: C.acc }}>through real experiments.</span>
          </h1>
          <p style={{ fontSize: 18, color: C.t2, lineHeight: 1.65, maxWidth: 480, marginBottom: 36 }}>
            Try short activities, record how they feel, and uncover patterns about what energizes you, matters to you, and deserves more of your attention.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Btn variant="primary" size="lg" onClick={() => setScreen('onboarding')}>
              Start your first experiment <ArrowRight size={16} />
            </Btn>
            <Btn variant="ghost" size="lg" onClick={() => setScreen('library')}>
              Browse experiments
            </Btn>
          </div>
          <div style={{ marginTop: 32, display: 'flex', gap: 24 }}>
            {[{ n: '2,400+', l: 'experiments started' }, { n: '94%', l: 'find it insightful' }, { n: '5 min', l: 'to first check-in' }].map(({ n, l }) => (
              <div key={l}>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.t1 }}>{n}</div>
                <div style={{ fontSize: 13, color: C.t4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Constellation hero visual */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            position: 'relative', width: 480, height: 320,
            background: `radial-gradient(ellipse at 40% 40%, rgba(34,197,94,0.06) 0%, transparent 65%)`,
            borderRadius: 24, border: `1px solid ${C.br}`, overflow: 'hidden',
          }}>
            <Constellation w={480} h={320} />
            <div style={{
              position: 'absolute', bottom: 20, left: 20, right: 20,
              background: C.s1, borderRadius: 12, padding: '12px 16px',
              border: `1px solid ${C.br}`, backdropFilter: 'blur(8px)',
            }}>
              <div style={{ fontSize: 12, color: C.t4, marginBottom: 4 }}>Evidence forming</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.t1 }}>Photography Walk — Day 3 of 7</div>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
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
          <button onClick={() => setScreen('library')} style={{ background: 'none', border: 'none', color: C.acc, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit', fontWeight: 600 }}>
            See all <ChevronRight size={15} />
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {experiments.map(({ title, cat, color, duration, time, Icon }) => (
            <Card key={title} onClick={() => setScreen('detail')} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={17} color={color} />
                </div>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.t4, padding: 0 }}><Bookmark size={15} /></button>
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
        <span style={{ fontSize: 13, color: C.t4 }}>© 2025 Purpose Discovery</span>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Privacy', 'Terms', 'Help'].map(l => <a key={l} href="#" style={{ fontSize: 13, color: C.t4, textDecoration: 'none' }}>{l}</a>)}
        </div>
      </footer>
    </div>
  )
}

// ─── SCREEN: Onboarding ───────────────────────────────────────────────────────
function OnboardingScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({})

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
            <Btn variant="ghost" onClick={() => step < steps.length - 1 ? setStep(s => s + 1) : setScreen('home')}>Skip</Btn>
            <Btn variant="primary" onClick={() => step < steps.length - 1 ? setStep(s => s + 1) : setScreen('home')}>
              {step < steps.length - 1 ? 'Next' : 'See recommendations'} <ChevronRight size={15} />
            </Btn>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── SCREEN: Home ─────────────────────────────────────────────────────────────
function HomeScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }} className="fade-up">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <p style={{ color: C.t4, fontSize: 13, marginBottom: 4 }}>Monday, July 28</p>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.02em' }}>Good evening, Eyyu</h1>
          <p style={{ color: C.t3, fontSize: 14 }}>One experiment at a time.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ width: 38, height: 38, borderRadius: 9, background: C.s1, border: `1px solid ${C.br}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
            <Bell size={16} color={C.t3} />
            <div style={{ position: 'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: '50%', background: C.acc }} />
          </button>
          <div style={{ width: 38, height: 38, borderRadius: 9, background: `${C.purple}22`, border: `1px solid ${C.purple}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: C.purple }}>E</div>
        </div>
      </div>

      {/* Active experiment card */}
      <div style={{
        background: C.s1, borderRadius: 20, padding: '24px', border: `1px solid ${C.accB}`,
        boxShadow: `0 0 0 1px ${C.accB}, 0 20px 40px rgba(34,197,94,0.06)`,
        marginBottom: 24, position: 'relative', overflow: 'hidden',
      }}>
        {/* Background glow */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <Badge label="Creative" color={C.purple} />
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.t4 }}><MoreHorizontal size={18} /></button>
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.02em' }}>Photography Walk</h2>
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, fontSize: 13, color: C.t3 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={13} /> Day 3 of 7</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={13} /> ~30 min/day</span>
        </div>

        <ProgressBar value={3} max={7} label="Progress" />

        {/* Day indicators */}
        <div style={{ display: 'flex', gap: 6, margin: '16px 0 20px' }}>
          {[1,2,3,4,5,6,7].map(d => (
            <div key={d} style={{
              width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600,
              background: d < 3 ? C.acc : d === 3 ? C.accS : C.s2,
              color: d < 3 ? '#052e16' : d === 3 ? C.acc : C.t4,
              border: d === 3 ? `1px solid ${C.accB}` : 'none',
            }}>
              {d < 3 ? <Check size={13} /> : d}
            </div>
          ))}
        </div>

        {/* Today's task */}
        <div style={{ background: C.s2, borderRadius: 12, padding: '16px', marginBottom: 20, border: `1px solid ${C.br}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.t4, letterSpacing: '0.06em', marginBottom: 8, textTransform: 'uppercase' }}>Today's task</div>
          <p style={{ fontSize: 15, fontWeight: 600, color: C.t1, marginBottom: 6 }}>Take ten photos focused on shadows and light contrast.</p>
          <div style={{ display: 'flex', gap: 12, fontSize: 13, color: C.t4 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> 30 minutes</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Bell size={12} /> Reminder at 7:30 PM</span>
          </div>
        </div>

        <Btn variant="primary" full size="lg" onClick={() => setScreen('checkin')}>
          <Play size={16} />
          Begin today's task
        </Btn>
      </div>

      {/* Recent evidence */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Recent evidence</h3>
          <button style={{ background: 'none', border: 'none', color: C.acc, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>View all</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { day: 'Day 2', note: '"Noticed I kept taking more than ten photos."', signals: [{ l: 'Curiosity', v: 5 }, { l: 'Energy', v: 4 }] },
            { day: 'Day 1', note: '"Felt self-conscious at first, then focused."', signals: [{ l: 'Enjoyment', v: 4 }, { l: 'Meaning', v: 3 }] },
          ].map(({ day, note, signals }) => (
            <Card key={day} style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.t4 }}>{day}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {signals.map(({ l, v }) => (
                    <span key={l} style={{ fontSize: 12, color: C.t3 }}>{l}: <strong style={{ color: v >= 4 ? C.acc : C.t2 }}>{v}/5</strong></span>
                  ))}
                </div>
              </div>
              <p style={{ fontSize: 14, color: C.t2, fontStyle: 'italic' }}>{note}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Pattern hint */}
      <Card style={{ background: `${C.purple}0e`, border: `1px solid ${C.purple}25` }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: `${C.purple}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <TrendingUp size={17} color={C.purple} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.purple, marginBottom: 4, letterSpacing: '0.04em' }}>PATTERN FORMING</div>
            <p style={{ fontSize: 14, color: C.t2, lineHeight: 1.55 }}>Your curiosity scores have been consistently high. A pattern may be emerging around creative observation.</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

// ─── SCREEN: Library ─────────────────────────────────────────────────────────
function LibraryScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const [activeFilter, setActiveFilter] = useState('All')

  const filters = [
    { label: 'All', color: C.t1 },
    { label: 'Creative', color: C.purple, Icon: Star },
    { label: 'Technical', color: C.blue, Icon: Brain },
    { label: 'Social', color: C.orange, Icon: Users },
    { label: 'Nature', color: C.acc, Icon: Leaf },
    { label: 'Service', color: C.teal, Icon: Heart },
    { label: 'Physical', color: C.amber, Icon: Dumbbell },
  ]

  const exps = [
    { title: 'Write One Page a Day', cat: 'Creative', color: C.purple, Icon: BookOpen, days: 7, mins: 20, desc: 'Build a short daily writing practice and observe how creativity and curiosity shift.', badge: 'Good first experiment' },
    { title: 'Photography Walk', cat: 'Creative', color: C.purple, Icon: Star, days: 7, mins: 30, desc: 'Take focused photo walks and discover how visual attention changes your experience.' },
    { title: 'Teach Someone Something', cat: 'Service', color: C.teal, Icon: Users, days: 5, mins: 25, desc: 'Prepare short lessons and observe how it feels to share knowledge.' },
    { title: 'Code a Small Project', cat: 'Technical', color: C.blue, Icon: Brain, days: 14, mins: 30, desc: 'Build a small tool from scratch and notice where your focus and energy go.', badge: 'Popular' },
    { title: 'Morning Nature Walk', cat: 'Nature', color: C.acc, Icon: Leaf, days: 7, mins: 20, desc: 'Begin each day outdoors and track how natural environments affect your mental state.' },
    { title: 'Volunteer One Hour', cat: 'Service', color: C.teal, Icon: Heart, days: 5, mins: 60, desc: 'Give structured time to a cause and observe feelings of contribution and meaning.' },
    { title: 'Strength Training Basics', cat: 'Physical', color: C.amber, Icon: Dumbbell, days: 14, mins: 30, desc: 'Follow a beginner routine and notice how physical effort changes your energy.' },
    { title: 'Public Speaking Practice', cat: 'Social', color: C.orange, Icon: Users, days: 7, mins: 20, desc: 'Record short video talks and observe how communication feels under your own direction.' },
  ]

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }} className="fade-up">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em' }}>Explore experiments</h1>
        <p style={{ fontSize: 15, color: C.t3 }}>Pick one that feels worth exploring. You can always try another after.</p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={16} color={C.t4} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
        <input placeholder="Search experiments..." style={{
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
          {exps.slice(0, 2).map(({ title, cat, color, Icon, days, mins, desc, badge }) => (
            <Card key={title} accent onClick={() => setScreen('detail')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={17} color={color} />
                  </div>
                  <Badge label={cat} color={color} />
                </div>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.t4 }}><Bookmark size={15} /></button>
              </div>
              {badge && <div style={{ fontSize: 11, fontWeight: 700, color: C.acc, marginBottom: 6, letterSpacing: '0.04em' }}>✦ {badge.toUpperCase()}</div>}
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
          {exps.map(({ title, cat, color, Icon, days, mins, desc }) => (
            <Card key={title} onClick={() => setScreen('detail')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={17} color={color} />
                  </div>
                  <Badge label={cat} color={color} />
                </div>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.t4 }}><Bookmark size={15} /></button>
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
function DetailScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const tasks = [
    'Choose a location with interesting light — early morning or late afternoon works well.',
    'Take at least ten photos focusing on shadows, contrast, and negative space.',
    'Review your photos and pick one that surprises you.',
  ]

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
          <Badge label="Creative" color={C.purple} />
        </div>
        <h1 style={{ fontSize: 34, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.025em' }}>Photography Walk</h1>
        <p style={{ fontSize: 17, color: C.t2, lineHeight: 1.65, marginBottom: 20 }}>
          Take focused daily photo walks and discover how visual attention changes the way you experience ordinary environments.
        </p>
        <div style={{ display: 'flex', gap: 16 }}>
          {[
            { Icon: Calendar, label: '7 days' },
            { Icon: Clock, label: '30 min/day' },
            { Icon: TrendingUp, label: 'Beginner' },
          ].map(({ Icon, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: C.t3 }}>
              <Icon size={14} color={C.t4} />{label}
            </div>
          ))}
        </div>
      </div>

      {/* Sections */}
      {[
        {
          title: 'What you will do',
          content: 'Each day you will take a 30-minute walk with the specific goal of photographing a theme — shadows, textures, movement, color. You will record what you noticed and how the activity felt, not whether the photos were good.',
        },
        {
          title: 'What this may reveal',
          content: 'This experiment may help you notice whether creative work energizes you, whether you naturally want to improve your craft, and whether you enjoy producing something tangible regularly. It may also surface how you respond to constraints and open-ended tasks.',
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
          <Btn variant="primary" size="lg" onClick={() => setScreen('home')}>
            Start this experiment
          </Btn>
          <Btn variant="ghost" size="lg">
            <Bookmark size={16} /> Save for later
          </Btn>
        </div>
      </div>
    </div>
  )
}

// ─── SCREEN: Daily Check-in ───────────────────────────────────────────────────
function CheckinScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})

  const questions = [
    { q: 'Did you complete today\'s task?', type: 'yn' },
    { q: 'How enjoyable was it?', labels: ['Not at all', 'Very much'] },
    { q: 'How energized did you feel afterward?', labels: ['Drained', 'Energized'] },
    { q: 'How curious did it make you?', labels: ['Not curious', 'Very curious'] },
    { q: 'How meaningful did it feel?', labels: ['Not meaningful', 'Very meaningful'] },
    { q: 'Would you want to continue tomorrow?', labels: ['Definitely not', 'Absolutely yes'] },
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
        <button onClick={() => setScreen('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.t3 }}><X size={20} /></button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.t4 }}>Photography Walk — Day 3</span>
            <span style={{ fontSize: 13, color: C.t4 }}>{step + 1}/{total}</span>
          </div>
          <div style={{ height: 4, background: C.s2, borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${((step + 1) / total) * 100}%`, background: C.acc, transition: 'width 0.4s ease', borderRadius: 2 }} />
          </div>
        </div>
      </div>

      {/* Question */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 24px', maxWidth: 520, margin: '0 auto', width: '100%' }} className="fade-up" key={step}>
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
            <textarea placeholder="What stood out today? What surprised you? (optional)" style={{
              width: '100%', height: 120, padding: '14px', borderRadius: 12,
              background: C.s1, border: `1px solid ${C.br}`, color: C.t1,
              fontFamily: 'inherit', fontSize: 15, lineHeight: 1.6, resize: 'none', outline: 'none',
              boxSizing: 'border-box',
            }} />
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <Btn variant="ghost" full onClick={() => setScreen('checkin-done')}>Skip</Btn>
              <Btn variant="primary" full onClick={() => setScreen('checkin-done')}>
                <Check size={16} /> Save check-in
              </Btn>
            </div>
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
  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }} className="fade-up">
        <div style={{
          width: 72, height: 72, borderRadius: '50%', background: C.accS,
          border: `2px solid ${C.accB}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px', boxShadow: `0 0 0 12px rgba(34,197,94,0.06)`,
        }} className="pulse-acc">
          <Check size={30} color={C.acc} strokeWidth={2.5} />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Check-in saved.</h1>
        <p style={{ fontSize: 16, color: C.t3, lineHeight: 1.6, marginBottom: 32 }}>
          You have added another piece of evidence. Three check-ins collected.
        </p>

        <Card style={{ textAlign: 'left', marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.t4, marginBottom: 12, letterSpacing: '0.04em' }}>TODAY'S SIGNALS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[{ l: 'Enjoyment', v: 4 }, { l: 'Energy', v: 5 }, { l: 'Curiosity', v: 5 }, { l: 'Meaning', v: 3 }].map(({ l, v }) => (
              <ScoreBar key={l} label={l} value={v * 20} />
            ))}
          </div>
        </Card>

        <Card style={{ background: C.accS, border: `1px solid ${C.accB}`, textAlign: 'left', marginBottom: 24 }}>
          <p style={{ fontSize: 14, color: C.t2, lineHeight: 1.6 }}>
            <strong style={{ color: C.acc }}>Your curiosity was higher today.</strong> On your best days this week, curiosity reached 5/5. A pattern may be forming.
          </p>
        </Card>

        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="ghost" full onClick={() => setScreen('home')}>Back to home</Btn>
          <Btn variant="secondary" full onClick={() => setScreen('report')}>View progress</Btn>
        </div>
      </div>
    </div>
  )
}

// ─── SCREEN: Experiment Report ─────────────────────────────────────────────
function ReportScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const dims = [
    { l: 'Curiosity', v: 92 },
    { l: 'Enjoyment', v: 84 },
    { l: 'Desire to continue', v: 88 },
    { l: 'Energy', v: 74 },
    { l: 'Meaning', v: 68 },
    { l: 'Desire to improve', v: 80 },
    { l: 'Consistency', v: 71 },
  ]

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }} className="fade-up">
      {/* Header */}
      <button onClick={() => setScreen('home')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: C.t3, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, marginBottom: 28, padding: 0 }}>
        <ChevronLeft size={16} /> Back
      </button>

      {/* Experiment summary */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
          <Badge label="Creative" color={C.purple} />
          <span style={{ fontSize: 13, color: C.t4 }}>Completed April 18, 2025</span>
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.02em' }}>Photography Walk</h1>
        <p style={{ fontSize: 15, color: C.t3 }}>7 days · 6 of 7 completed · 3.2 hours total</p>
      </div>

      {/* Fit signal */}
      <Card accent style={{ textAlign: 'center', marginBottom: 24, padding: '32px 24px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.t4, letterSpacing: '0.06em', marginBottom: 12 }}>FIT SIGNAL</div>
        <div style={{ fontSize: 72, fontWeight: 800, color: C.acc, lineHeight: 1, marginBottom: 8, letterSpacing: '-0.04em' }}>82%</div>
        <p style={{ fontSize: 14, color: C.t3, maxWidth: 380, margin: '0 auto' }}>
          Based on your daily check-ins, completion consistency, and final reflection. This is not a score — it is a summary of your own responses.
        </p>
      </Card>

      {/* Dimension scores */}
      <Card style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>Dimension breakdown</h2>
        {dims.map(d => <ScoreBar key={d.l} label={d.l} value={d.v} />)}
      </Card>

      {/* Insight cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
        <Card style={{ background: `${C.acc}0e`, border: `1px solid ${C.acc}22` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.acc, letterSpacing: '0.05em', marginBottom: 8 }}>WHAT STOOD OUT</div>
          <p style={{ fontSize: 15, color: C.t2, lineHeight: 1.65 }}>
            You consistently wanted to continue after the task, and your curiosity stayed high even on lower-energy days. This may be worth exploring through another creative experiment.
          </p>
        </Card>
        <Card style={{ background: `${C.amber}0e`, border: `1px solid ${C.amber}22` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.amber, letterSpacing: '0.05em', marginBottom: 8 }}>A MIXED SIGNAL</div>
          <p style={{ fontSize: 15, color: C.t2, lineHeight: 1.65 }}>
            You enjoyed the activity, but completing it consistently was difficult. The activity may fit you better in a shorter or less structured daily format.
          </p>
        </Card>
      </div>

      {/* What this may suggest */}
      <Card style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>What this may suggest</h2>
        <p style={{ fontSize: 15, color: C.t2, lineHeight: 1.7 }}>
          A pattern may be forming around visual creativity and observation. The high curiosity and desire to continue — even on constrained days — suggests the activity may deserve further exploration. This does not mean photography is your purpose. It means the signal is strong enough to investigate.
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
        <Card accent onClick={() => setScreen('detail')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 11, background: `${C.purple}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BookOpen size={20} color={C.purple} />
            </div>
            <div style={{ flex: 1 }}>
              <Badge label="Creative" color={C.purple} />
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: '6px 0 4px' }}>Write One Page a Day</h3>
              <p style={{ fontSize: 13, color: C.t3 }}>7 days · 20 min/day · Your curiosity pattern suggests this fits.</p>
            </div>
            <ChevronRight size={16} color={C.acc} />
          </div>
        </Card>
      </div>
    </div>
  )
}

// ─── SCREEN: Insights ──────────────────────────────────────────────────────
function InsightsScreen({ setScreen: _setScreen }: { setScreen: (s: Screen) => void }) {
  const patterns = [
    { text: 'Creative activities repeatedly energize you', color: C.purple, Icon: Star },
    { text: 'You show high curiosity in observational tasks', color: C.blue, Icon: Brain },
    { text: 'You tend to want to improve when the activity is visual', color: C.acc, Icon: TrendingUp },
  ]

  const categories = [
    { label: 'Creative', v: 85, color: C.purple, n: 3 },
    { label: 'Technical', v: 62, color: C.blue, n: 1 },
    { label: 'Service', v: 54, color: C.teal, n: 1 },
    { label: 'Physical', v: 41, color: C.amber, n: 1 },
  ]

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', padding: '32px 24px' }} className="fade-up">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em' }}>Your insights</h1>
        <p style={{ fontSize: 15, color: C.t3 }}>Patterns from 6 completed experiments.</p>
      </div>

      {/* Constellation evidence map */}
      <Card style={{ marginBottom: 28, padding: '28px', overflow: 'hidden', position: 'relative', background: `radial-gradient(ellipse at 30% 30%, rgba(34,197,94,0.05) 0%, transparent 60%)` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.t4, letterSpacing: '0.05em', marginBottom: 16 }}>EVIDENCE MAP</div>
        <div style={{ position: 'relative', height: 260 }}>
          <Constellation w={720} h={260} />
          {/* Labels */}
          {[
            { x: '13%', y: '30%', label: 'Photography', color: C.purple },
            { x: '32%', y: '12%', label: 'Writing', color: C.purple },
            { x: '56%', y: '22%', label: 'Coding', color: C.blue },
            { x: '46%', y: '52%', label: 'Teaching', color: C.teal },
          ].map(({ x, y, label, color }) => (
            <div key={label} style={{ position: 'absolute', left: x, top: y, fontSize: 11, fontWeight: 700, color, background: `${color}14`, padding: '3px 8px', borderRadius: 6, border: `1px solid ${color}25`, whiteSpace: 'nowrap' }}>
              {label}
            </div>
          ))}
        </div>
        <p style={{ fontSize: 13, color: C.t4, marginTop: 8 }}>Each node represents a completed experiment. Connected nodes share strong signals.</p>
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
          { label: 'Avg fit signal', value: '74%', sub: 'across 6 experiments', color: C.acc },
          { label: 'Curiosity rate', value: '4.3/5', sub: 'avg across all check-ins', color: C.blue },
          { label: 'Repeat intent', value: '83%', sub: 'of days you wanted to continue', color: C.purple },
          { label: 'Consistency', value: '78%', sub: 'tasks completed on schedule', color: C.amber },
        ].map(({ label, value, sub, color }) => (
          <Card key={label} style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color, marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.t2, marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 12, color: C.t4 }}>{sub}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ─── SCREEN: Evidence Vault ───────────────────────────────────────────────────
function VaultScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const entries = [
    { title: 'Photography Walk', cat: 'Creative', color: C.purple, date: 'April 18, 2025', fit: 82, signal: 'Curiosity', quote: '"You wanted to keep walking past the planned time."', status: 'completed' },
    { title: 'Write One Page a Day', cat: 'Creative', color: C.purple, date: 'March 22, 2025', fit: 87, signal: 'Curiosity', quote: '"Writing felt urgent and natural by day 5."', status: 'completed' },
    { title: 'Code a Small Project', cat: 'Technical', color: C.blue, date: 'February 11, 2025', fit: 63, signal: 'Energy', quote: '"Problem-solving was engaging but finishing was hard."', status: 'completed' },
    { title: 'Teach Someone Something', cat: 'Service', color: C.teal, date: 'January 5, 2025', fit: 55, signal: 'Meaning', quote: '"Felt meaningful but draining to prepare consistently."', status: 'completed' },
    { title: 'Strength Training Basics', cat: 'Physical', color: C.amber, date: 'December 2024', fit: 44, signal: 'Consistency', quote: '"Enjoyed the effort but found the routine rigid."', status: 'abandoned', abandonDay: 4 },
  ]

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }} className="fade-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em' }}>Evidence Vault</h1>
          <p style={{ fontSize: 15, color: C.t3 }}>Your personal archive of completed experiments.</p>
        </div>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.t4, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: 'inherit' }}>
          <Download size={14} /> Export
        </button>
      </div>

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
        {[{ n: '5', l: 'experiments' }, { n: '74%', l: 'avg fit signal' }, { n: '31', l: 'check-ins' }].map(({ n, l }) => (
          <Card key={l} style={{ textAlign: 'center', padding: '16px 12px' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.t1, marginBottom: 2 }}>{n}</div>
            <div style={{ fontSize: 12, color: C.t4 }}>{l}</div>
          </Card>
        ))}
      </div>

      {/* Entries */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {entries.map(({ title, cat, color, date, fit, signal, quote, status, abandonDay }) => (
          <Card key={title} onClick={() => setScreen('report')} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Badge label={cat} color={color} />
                {status === 'abandoned' && <span style={{ fontSize: 11, color: C.t4, fontWeight: 600 }}>Ended day {abandonDay}</span>}
              </div>
              <span style={{ fontSize: 13, color: C.t4 }}>Completed {date}</span>
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>{title}</h3>
            <div style={{ display: 'flex', gap: 20, marginBottom: 12, fontSize: 14 }}>
              <div>
                <span style={{ color: C.t4, fontSize: 12 }}>Fit signal </span>
                <strong style={{ color: fit >= 70 ? C.acc : fit >= 50 ? C.amber : C.t2 }}>{fit}%</strong>
              </div>
              <div>
                <span style={{ color: C.t4, fontSize: 12 }}>Strongest signal </span>
                <strong style={{ color: C.t2 }}>{signal}</strong>
              </div>
            </div>
            <div style={{ borderTop: `1px solid ${C.br}`, paddingTop: 12 }}>
              <p style={{ fontSize: 13, color: C.t3, fontStyle: 'italic', margin: 0 }}>{quote}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ─── SCREEN: Profile ──────────────────────────────────────────────────────────
function ProfileScreen() {
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark')

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 24px' }} className="fade-up">
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 28, letterSpacing: '-0.02em' }}>Profile & settings</h1>

      {/* Avatar */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${C.purple}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: C.purple }}>E</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Eyyu</div>
            <div style={{ color: C.t4, fontSize: 14 }}>eyyu@example.com</div>
          </div>
        </div>
        {[
          { label: 'Display name', value: 'Eyyu' },
          { label: 'Email', value: 'eyyu@example.com' },
          { label: 'Timezone', value: 'UTC+3 (East Africa Time)' },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: `1px solid ${C.br}` }}>
            <span style={{ fontSize: 14, color: C.t3 }}>{label}</span>
            <span style={{ fontSize: 14, color: C.t1 }}>{value}</span>
          </div>
        ))}
      </Card>

      {/* Reminders */}
      <Card style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Reminders</h2>
        {[
          { label: 'Daily reminders', active: true },
          { label: 'Email reminders', active: false },
        ].map(({ label, active }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 14, color: C.t2 }}>{label}</span>
            <div style={{ width: 44, height: 24, borderRadius: 12, background: active ? C.acc : C.s2, position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
              <div style={{ position: 'absolute', top: 3, left: active ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: C.t1, transition: 'left 0.2s' }} />
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: `1px solid ${C.br}` }}>
          <span style={{ fontSize: 14, color: C.t2 }}>Preferred time</span>
          <span style={{ fontSize: 14, color: C.t1 }}>7:30 PM (UTC+3)</span>
        </div>
      </Card>

      {/* Appearance */}
      <Card style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Appearance</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          {([['dark', 'Dark', Moon], ['light', 'Light', Sun], ['system', 'System', Settings]] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTheme(id)} style={{
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
          {[{ label: 'View consent history', Icon: Shield }, { label: 'Export your data', Icon: Download }].map(({ label, Icon }) => (
            <button key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: C.s2, border: 'none', color: C.t2, fontFamily: 'inherit', fontSize: 14, cursor: 'pointer' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Icon size={15} color={C.t4} />{label}</span>
              <ChevronRight size={14} color={C.t4} />
            </button>
          ))}
          <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.07)', border: `1px solid rgba(239,68,68,0.2)`, color: C.red, fontFamily: 'inherit', fontSize: 14, cursor: 'pointer' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Trash2 size={15} />Delete account</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </Card>
    </div>
  )
}

// ─── Demo screen navigator ────────────────────────────────────────────────────
function ScreenNav({ screen, setScreen }: { screen: Screen; setScreen: (s: Screen) => void }) {
  const screens: { id: Screen; label: string }[] = [
    { id: 'landing', label: 'Landing' },
    { id: 'onboarding', label: 'Onboarding' },
    { id: 'home', label: 'Home' },
    { id: 'library', label: 'Library' },
    { id: 'detail', label: 'Detail' },
    { id: 'checkin', label: 'Check-in' },
    { id: 'checkin-done', label: 'Check-in done' },
    { id: 'report', label: 'Report' },
    { id: 'insights', label: 'Insights' },
    { id: 'vault', label: 'Vault' },
    { id: 'profile', label: 'Profile' },
  ]

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: '#050507', borderBottom: `1px solid ${C.br}`,
      padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto',
    }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: C.t4, letterSpacing: '0.05em', flexShrink: 0, marginRight: 4 }}>SCREENS</span>
      {screens.map(({ id, label }) => (
        <button key={id} onClick={() => setScreen(id)} style={{
          padding: '4px 10px', borderRadius: 6, border: `1px solid ${screen === id ? C.accB : C.br}`,
          background: screen === id ? C.accS : 'transparent',
          color: screen === id ? C.acc : C.t4,
          fontFamily: 'inherit', fontSize: 11, fontWeight: 600, cursor: 'pointer',
          whiteSpace: 'nowrap', transition: 'all 0.12s', flexShrink: 0,
        }}>
          {label}
        </button>
      ))}
    </div>
  )
}

// ─── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const paths: Record<Screen, string> = {
    landing: '/', onboarding: '/onboarding', home: '/app', library: '/app/explore',
    detail: '/app/experiments/photography-walk', checkin: '/app/check-in',
    'checkin-done': '/app/check-in/complete', report: '/app/report',
    insights: '/app/insights', vault: '/app/vault', profile: '/app/profile',
  }
  const screen = (Object.entries(paths).find(([, path]) => path === location.pathname)?.[0] ?? 'landing') as Screen
  const setScreen = (next: Screen) => navigate(paths[next])

  const authenticatedScreens: Screen[] = ['home', 'library', 'detail', 'report', 'insights', 'vault', 'profile']
  const isAuthenticated = authenticatedScreens.includes(screen)

  const renderScreen = () => {
    switch (screen) {
      case 'landing':    return <LandingScreen setScreen={setScreen} />
      case 'onboarding': return <OnboardingScreen setScreen={setScreen} />
      case 'checkin':    return <CheckinScreen setScreen={setScreen} />
      case 'checkin-done': return <CheckinDoneScreen setScreen={setScreen} />
      default: break
    }

    if (isAuthenticated) {
      const content = (() => {
        switch (screen) {
          case 'home':     return <HomeScreen setScreen={setScreen} />
          case 'library':  return <LibraryScreen setScreen={setScreen} />
          case 'detail':   return <DetailScreen setScreen={setScreen} />
          case 'report':   return <ReportScreen setScreen={setScreen} />
          case 'insights': return <InsightsScreen setScreen={setScreen} />
          case 'vault':    return <VaultScreen setScreen={setScreen} />
          case 'profile':  return <ProfileScreen />
          default:         return null
        }
      })()

      return <AppShell screen={screen} setScreen={setScreen}>{content}</AppShell>
    }
  }

  return (
    <div style={{ paddingTop: 38 }}>
      <ScreenNav screen={screen} setScreen={setScreen} />
      {renderScreen()}
    </div>
  )
}
