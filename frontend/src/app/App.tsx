import { useEffect, useState } from 'react'

import { AppRoutes } from './routes'
import { C, applyThemePreference } from './theme'
import type { ThemePreference } from '@/types'
import { ToastContainer } from '@/components/common/toast'

export default function App() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const preference = (localStorage.getItem('unfold-theme') as ThemePreference | null) ?? 'dark'
    applyThemePreference(preference)
    const media = window.matchMedia('(prefers-color-scheme: light)')
    const handleSystemTheme = () => {
      if ((localStorage.getItem('unfold-theme') ?? 'dark') === 'system')
        applyThemePreference('system')
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

  return (
    <div>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <ToastContainer />
      {!isOnline && (
        <div
          role="status"
          style={{
            position: 'fixed',
            zIndex: 100,
            top: 0,
            left: 0,
            right: 0,
            padding: '9px 16px',
            textAlign: 'center',
            background: C.amber,
            color: '#271500',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          You appear to be offline. Check-in progress is kept on this device.
        </div>
      )}
      <AppRoutes />
    </div>
  )
}
