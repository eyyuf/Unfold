import { useLocation, useNavigate } from 'react-router'

import { LoadingBlock } from '@/components/common'
import AppLayout from '@/components/layout/AppLayout'
import DashboardPage from '@/pages/DashboardPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import HelpPage from '@/pages/HelpPage'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import OnboardingPage from '@/pages/OnboardingPage'
import PrivacyPage from '@/pages/PrivacyPage'
import ProfilePage from '@/pages/ProfilePage'
import RegisterPage from '@/pages/RegisterPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import TermsPage from '@/pages/TermsPage'
import CheckInCompletePage from '@/pages/experiments/CheckInCompletePage'
import CheckInPage from '@/pages/experiments/CheckInPage'
import ExperimentCommitPage from '@/pages/experiments/ExperimentCommitPage'
import ExperimentDetailsPage from '@/pages/experiments/ExperimentDetailsPage'
import ExperimentReportPage from '@/pages/experiments/ExperimentReportPage'
import ExperimentsPage from '@/pages/experiments/ExperimentsPage'
import ReflectionPage from '@/pages/experiments/ReflectionPage'
import SavedExperimentsPage from '@/pages/experiments/SavedExperimentsPage'
import EvidenceVaultPage from '@/pages/insights/EvidenceVaultPage'
import InsightsPage from '@/pages/insights/InsightsPage'
import LearnedPatternsPage from '@/pages/insights/LearnedPatternsPage'
import { useAuth } from '@/hooks/useAuth'
import type { Screen } from '@/types'

export const paths: Record<Screen, string> = {
  landing: '/', login: '/login', register: '/register', 'forgot-password': '/forgot-password', 'reset-password': '/reset-password',
  privacy: '/privacy', terms: '/terms', onboarding: '/onboarding', home: '/app', library: '/app/explore',
  detail: '/app/experiments/photography-walk', commit: '/app/experiments/photography-walk/commit', saved: '/app/saved', checkin: '/app/check-in',
  'checkin-done': '/app/check-in/complete', reflection: '/app/reflection', report: '/app/report',
  insights: '/app/insights', learned: '/app/insights/learned', vault: '/app/vault', profile: '/app/profile', help: '/app/help',
}

const authenticatedScreens: Screen[] = ['onboarding', 'home', 'library', 'detail', 'commit', 'saved', 'checkin', 'checkin-done', 'reflection', 'report', 'insights', 'learned', 'vault', 'profile', 'help']

function screenForPath(pathname: string): Screen {
  if (pathname.startsWith('/app/reports/')) return 'report'
  if (pathname.endsWith('/commit') && pathname.startsWith('/app/experiments/')) return 'commit'
  if (pathname.startsWith('/app/experiments/')) return 'detail'
  return (Object.entries(paths).find(([, path]) => path === pathname)?.[0] ?? 'landing') as Screen
}

export function AppRoutes() {
  const navigate = useNavigate()
  const location = useLocation()
  const screen = screenForPath(location.pathname)
  const setScreen = (next: Screen) => navigate(paths[next])
  const { data: user, isLoading: authLoading } = useAuth()

  switch (screen) {
    case 'landing': return <LandingPage setScreen={setScreen} />
    case 'login': return <LoginPage setScreen={setScreen} />
    case 'register': return <RegisterPage setScreen={setScreen} />
    case 'forgot-password': return <ForgotPasswordPage setScreen={setScreen} />
    case 'reset-password': return <ResetPasswordPage setScreen={setScreen} />
    case 'privacy': return <PrivacyPage setScreen={setScreen} />
    case 'terms': return <TermsPage setScreen={setScreen} />
    default: break
  }

  if (!authenticatedScreens.includes(screen)) return null
  if (authLoading) return <LoadingBlock label="Restoring your session…" />
  if (!user) return <LoginPage setScreen={setScreen} />
  if (screen === 'onboarding') return <OnboardingPage setScreen={setScreen} />
  if (screen === 'checkin') return <CheckInPage setScreen={setScreen} />
  if (screen === 'checkin-done') return <CheckInCompletePage setScreen={setScreen} />
  if (screen === 'reflection') return <ReflectionPage setScreen={setScreen} />

  const content = (() => {
    switch (screen) {
      case 'home': return <DashboardPage setScreen={setScreen} />
      case 'library': return <ExperimentsPage setScreen={setScreen} />
      case 'detail': return <ExperimentDetailsPage setScreen={setScreen} />
      case 'commit': return <ExperimentCommitPage setScreen={setScreen} />
      case 'saved': return <SavedExperimentsPage setScreen={setScreen} />
      case 'report': return <ExperimentReportPage setScreen={setScreen} />
      case 'insights': return <InsightsPage setScreen={setScreen} />
      case 'learned': return <LearnedPatternsPage setScreen={setScreen} />
      case 'vault': return <EvidenceVaultPage setScreen={setScreen} />
      case 'profile': return <ProfilePage setScreen={setScreen} />
      case 'help': return <HelpPage setScreen={setScreen} />
      default: return null
    }
  })()

  return <AppLayout screen={screen} setScreen={setScreen}>{content}</AppLayout>
}
