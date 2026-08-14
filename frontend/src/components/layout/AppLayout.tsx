import { Home, Compass, BarChart2, Archive, User, Settings, HelpCircle } from 'lucide-react'
import { BrandMark } from '@/components/common'
import { C } from '@/app/theme'
import type { Screen } from '@/types'

export default function AppLayout({
  screen,
  setScreen,
  children,
}: {
  screen: Screen
  setScreen: (s: Screen) => void
  children: React.ReactNode
}) {
  const navItems = [
    { id: 'home' as Screen, label: 'Home', Icon: Home },
    { id: 'library' as Screen, label: 'Explore', Icon: Compass },
    { id: 'insights' as Screen, label: 'Insights', Icon: BarChart2 },
    { id: 'vault' as Screen, label: 'Vault', Icon: Archive },
    { id: 'profile' as Screen, label: 'Profile', Icon: User },
  ]
  const screenTitles: Partial<Record<Screen, string>> = {
    home: 'Dashboard',
    library: 'Explore',
    detail: 'Experiment',
    commit: 'Commitment',
    saved: 'Saved',
    checkin: 'Daily check-in',
    'checkin-done': 'Check-in complete',
    reflection: 'Reflection',
    report: 'Report',
    insights: 'Insights',
    learned: 'What you learned',
    vault: 'Evidence vault',
    onboarding: 'Set up',
    profile: 'Settings',
    help: 'Help centre',
  }
  const screenTitle = screenTitles[screen] ?? 'Unfold'

  return (
    <div
      className="unfold-shell"
      style={{ display: 'flex', height: '100vh', background: C.bg, overflow: 'hidden' }}
    >
      {/* Sidebar – visible md+ */}
      <aside
        style={{
          width: 220,
          flexShrink: 0,
          background: C.bg2,
          borderRight: `1px solid ${C.br}`,
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 12px',
        }}
        className="desktop-sidebar app-sidebar"
      >
        {/* Logo */}
        <div style={{ padding: '8px 12px 24px' }}>
          <div className="app-sidebar-brand">
            <BrandMark />
            <div>
              <span
                style={{
                  display: 'block',
                  fontWeight: 800,
                  fontSize: 18,
                  color: C.t1,
                  letterSpacing: '-0.04em',
                }}
              >
                Unfold
              </span>
              <span className="app-sidebar-kicker">Personal lab</span>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav
          className="app-sidebar-nav"
          style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          {navItems.map(({ id, label, Icon }) => {
            const active = screen === id
            return (
              <button
                className={`sidebar-nav-button${active ? ' active' : ''}`}
                key={id}
                onClick={() => setScreen(id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 14,
                  fontWeight: active ? 600 : 500,
                  background: active ? C.accS : 'transparent',
                  color: active ? C.acc : C.t3,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = C.s1
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = 'transparent'
                }}
              >
                <Icon size={17} />
                {label}
              </button>
            )
          })}
        </nav>

        {/* Bottom sidebar links */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            paddingTop: 12,
            borderTop: `1px solid ${C.br}`,
          }}
        >
          {(
            [
              { id: 'profile', Icon: Settings, label: 'Settings' },
              { id: 'help', Icon: HelpCircle, label: 'Help' },
            ] as const
          ).map(({ id, Icon, label }) => {
            const active = screen === id
            return (
              <button
                key={id}
                onClick={() => setScreen(id)}
                aria-current={active ? 'page' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  background: active ? C.accS : 'transparent',
                  color: active ? C.acc : C.t4,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(event) => {
                  if (!active) event.currentTarget.style.background = C.s1
                }}
                onMouseLeave={(event) => {
                  if (!active) event.currentTarget.style.background = 'transparent'
                }}
              >
                <Icon size={15} />
                {label}
              </button>
            )
          })}
        </div>
      </aside>

      {/* Main content */}
      <div
        className="app-main-column"
        style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <header className="app-topbar">
          <div>
            <div className="app-topbar-kicker">Your personal evidence lab</div>
            <div className="app-topbar-title">{screenTitle}</div>
          </div>
          <div className="app-topbar-actions">
            <button
              className="app-icon-button"
              aria-label="Open help"
              onClick={() => setScreen('help')}
            >
              <HelpCircle size={17} />
            </button>
            <button
              className="app-icon-button"
              aria-label="Open settings"
              onClick={() => setScreen('profile')}
            >
              <Settings size={17} />
            </button>
          </div>
        </header>
        <main
          id="main-content"
          style={{ flex: 1, overflowY: 'auto', padding: '0 0 80px' }}
          className="md:pb-0 app-scroll-area"
        >
          {children}
        </main>

        {/* Bottom nav – mobile */}
        <nav
          className="mobile-nav"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: C.bg2,
            borderTop: `1px solid ${C.br}`,
            display: 'flex',
            padding: '8px 0 12px',
            zIndex: 50,
          }}
        >
          {navItems.map(({ id, label, Icon }) => {
            const active = screen === id
            return (
              <button
                key={id}
                onClick={() => setScreen(id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 10,
                  fontWeight: 600,
                  color: active ? C.acc : C.t4,
                  padding: '4px 0',
                  transition: 'color 0.15s',
                }}
              >
                {active && (
                  <div
                    className="nav-dot"
                    style={{ width: 4, height: 4, borderRadius: '50%', background: C.acc }}
                  />
                )}
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
