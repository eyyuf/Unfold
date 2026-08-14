import { LegalPage } from './LegalPage'
import type { Screen } from '@/types'

export default function PrivacyPage({ setScreen }: { setScreen: (screen: Screen) => void }) {
  return <LegalPage kind="privacy" setScreen={setScreen} />
}
