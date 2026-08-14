import { ChevronLeft, ChevronRight } from 'lucide-react'
import styles from '../CheckInPage.module.css'

type CheckInNavigationProps = {
  step: number
  onPrevious: () => void
  onSkip: () => void
}

export function CheckInNavigation({ step, onPrevious, onSkip }: CheckInNavigationProps) {
  return (
    <nav className={styles.navigation} aria-label="Check-in questions">
      <button className={styles.navigationButton} onClick={onPrevious}>
        {step > 0 && (
          <>
            <ChevronLeft size={15} /> Previous
          </>
        )}
      </button>
      <button className={styles.navigationButton} onClick={onSkip}>
        Skip <ChevronRight size={15} />
      </button>
    </nav>
  )
}
