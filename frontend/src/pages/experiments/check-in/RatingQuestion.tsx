import styles from '../CheckInPage.module.css'

type RatingQuestionProps = {
  labels: string[]
  selected?: number
  onSelect: (value: number) => void
}

export function RatingQuestion({ labels, selected, onSelect }: RatingQuestionProps) {
  return (
    <div>
      <div className={styles.ratingButtons}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            className={[styles.ratingButton, selected === value ? styles.ratingButtonSelected : '']
              .filter(Boolean)
              .join(' ')}
            onClick={() => onSelect(value)}
          >
            {value}
          </button>
        ))}
      </div>
      <div className={styles.ratingLabels}>
        <span>{labels[0]}</span>
        <span>{labels[1]}</span>
      </div>
    </div>
  )
}
