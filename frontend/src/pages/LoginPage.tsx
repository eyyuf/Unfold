import { AuthPage } from './AuthPage'
import type { Screen } from '@/types'

export default function LoginPage({ setScreen }: { setScreen: (screen: Screen) => void }) {
  return <AuthPage mode="login" setScreen={setScreen} />
}
