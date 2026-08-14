import { AuthPage } from './AuthPage'
import type { Screen } from '@/types'

export default function RegisterPage({ setScreen }: { setScreen: (screen: Screen) => void }) {
  return <AuthPage mode="register" setScreen={setScreen} />
}
