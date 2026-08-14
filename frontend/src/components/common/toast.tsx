import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { C } from '@/app/theme'

type ToastItem = { id: number; message: string; type: 'success' | 'error' }
let toastListeners: Array<(toasts: ToastItem[]) => void> = []
let globalToasts: ToastItem[] = []
let toastId = 0

export function addToast(message: string, type: 'success' | 'error' = 'success') {
  const t = { id: ++toastId, message, type }
  globalToasts = [...globalToasts, t]
  toastListeners.forEach(fn => fn(globalToasts))
  setTimeout(() => {
    globalToasts = globalToasts.filter(x => x.id !== t.id)
    toastListeners.forEach(fn => fn(globalToasts))
  }, 3000)
}

function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  useEffect(() => {
    toastListeners.push(setToasts)
    return () => { toastListeners = toastListeners.filter(fn => fn !== setToasts) }
  }, [])
  return toasts
}

export function ToastContainer() {
  const toasts = useToasts()
  if (!toasts.length) return null
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className="toast-in" role="status" style={{
          padding: '12px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600,
          background: t.type === 'success' ? C.acc : C.red,
          color: t.type === 'success' ? '#052e16' : '#fff',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {t.type === 'success' ? <Check size={16} /> : <X size={16} />}
          {t.message}
        </div>
      ))}
    </div>
  )
}
