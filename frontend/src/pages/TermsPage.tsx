import { LegalPage } from './LegalPage'
import type { Screen } from '@/types'

export default function TermsPage({ setScreen }: { setScreen: (screen: Screen) => void }) {
  return <LegalPage kind="terms" setScreen={setScreen} />
}
