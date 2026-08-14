import styles from '../CheckInPage.module.css'

const options = [
  { label: 'Yes, I completed it', value: 1, className: styles.completionOptionComplete },
  { label: 'Partially completed', value: 2, className: styles.completionOptionPartial },
  { label: 'Not today', value: 0, className: styles.completionOptionMissed },
]

type CompletionQuestionProps = {
  selected?: number
  onSelect: (value: number) => void
}

export function CompletionQuestion({ selected, onSelect }: CompletionQuestionProps) {
  return (
    <div className={styles.completionOptions}>
      {options.map((option) => (
        <button
          key={option.value}
          className={[
            styles.completionOption,
            option.className,
            selected === option.value ? styles.completionOptionSelected : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => onSelect(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
