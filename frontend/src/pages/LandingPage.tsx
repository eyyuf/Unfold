import { Compass, BarChart2, Bookmark, ChevronRight, ArrowRight, Play, Star, Brain, BookOpen, Users, Shield, Sparkles } from 'lucide-react'
import { BrandMark, Btn, Card, ProgressBar, Badge, Constellation } from '@/components/common'
import { C } from '@/app/theme'
import type { Screen } from '@/types'

export default function LandingPage({ setScreen }: { setScreen: (s: Screen) => void }) {
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
            {[{ v: 'Short', l: 'real-world trials' }, { v: 'Daily', l: 'honest check-ins' }, { v: 'Private', l: 'personal evidence' }].map(({ v, l }) => (
              <div key={l}>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.t1 }}>{v}</div>
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
