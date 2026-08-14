import { Check } from 'lucide-react'
import { Btn } from '@/components/common'
import styles from '../CheckInPage.module.css'

type NotesQuestionProps = {
  notes: string
  isPending: boolean
  error?: Error | null
  onChange: (value: string) => void
  onSkip: () => void
  onSubmit: () => void
}

export function NotesQuestion({
  notes,
  isPending,
  error,
  onChange,
  onSkip,
  onSubmit,
}: NotesQuestionProps) {
  return (
    <div>
      <textarea
        className={styles.noteInput}
        value={notes}
        onChange={(event) => onChange(event.target.value)}
        placeholder="What stood out today? What surprised you? (optional)"
      />
      <div className={styles.noteCount}>{notes.length} / 500</div>
      <div className={styles.noteActions}>
        <Btn variant="ghost" full onClick={onSkip}>
          Skip note
        </Btn>
        <Btn variant="primary" full disabled={isPending} onClick={onSubmit}>
          <Check size={16} /> {isPending ? 'Saving…' : 'Save check-in'}
        </Btn>
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error.message}
        </p>
      )}
    </div>
  )
}
