import { X } from 'lucide-react'
import styles from '../CheckInPage.module.css'

type CheckInHeaderProps = {
  experimentTitle: string
  day: number
  step: number
  total: number
  onClose: () => void
}

export function CheckInHeader({ experimentTitle, day, step, total, onClose }: CheckInHeaderProps) {
  return (
    <header className={styles.header}>
      <button className={styles.closeButton} aria-label="Close check-in" onClick={onClose}>
        <X size={20} />
      </button>
      <div className={styles.headerContent}>
        <div className={styles.headerMeta}>
          <span className={styles.experimentLabel}>
            {experimentTitle} — Day {day}
          </span>
          <span className={styles.stepLabel}>
            {step + 1}/{total}
          </span>
        </div>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${((step + 1) / total) * 100}%` }}
          />
        </div>
      </div>
    </header>
  )
}
