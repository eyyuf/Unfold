import { Flame } from 'lucide-react'
import { Card } from '@/components/common'
import { C } from '@/app/theme'
import type { ProfileActivityData } from '@/types'

export function StreakTracker({
  activity,
  loading,
}: {
  activity?: ProfileActivityData
  loading: boolean
}) {
  const weekCount = 20
  const today = new Date(`${activity?.today ?? new Date().toISOString().slice(0, 10)}T12:00:00`)
  const latestSunday = new Date(today)
  latestSunday.setDate(today.getDate() - today.getDay())
  const firstSunday = new Date(latestSunday)
  firstSunday.setDate(latestSunday.getDate() - (weekCount - 1) * 7)
  const activityByDate = new Map((activity?.days ?? []).map((day) => [day.date, day.count]))
  const toDateKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  const weeks = Array.from({ length: weekCount }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => {
      const date = new Date(firstSunday)
      date.setDate(firstSunday.getDate() + weekIndex * 7 + dayIndex)
      const key = toDateKey(date)
      return { date, key, count: activityByDate.get(key) ?? 0 }
    }),
  )

  return (
    <Card className="streak-card" style={{ marginBottom: 20, padding: 0, overflow: 'hidden' }}>
      <div className="streak-card-header">
        <div>
          <div className="ui-eyebrow">Activity streak</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: '7px 0 4px' }}>
            Your consistency map
          </h2>
          <p style={{ color: C.t3, fontSize: 13, margin: 0 }}>
            Every completed check-in adds a signal.
          </p>
        </div>
        <div className="streak-current">
          <Flame size={19} strokeWidth={2.2} />
          <strong>{activity?.current_streak ?? 0}</strong>
          <span>day streak</span>
        </div>
      </div>

      <div className="streak-chart-scroll" aria-label="Check-in activity over the last 20 weeks">
        <div className="streak-chart-inner">
          <div className="streak-month-row" aria-hidden="true">
            <span />
            <div className="streak-months">
              {weeks.map((week, index) => {
                const monthChanged =
                  index === 0 || week[0].date.getMonth() !== weeks[index - 1][0].date.getMonth()
                return (
                  <span key={week[0].key}>
                    {monthChanged
                      ? week[0].date.toLocaleDateString(undefined, { month: 'short' })
                      : ''}
                  </span>
                )
              })}
            </div>
          </div>
          <div className="streak-grid-row">
            <div className="streak-day-labels" aria-hidden="true">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
            </div>
            <div className={`streak-weeks${loading ? ' skeleton' : ''}`}>
              {weeks.map((week) => (
                <div className="streak-week" key={week[0].key}>
                  {week.map(({ date, key, count }) => {
                    const level =
                      count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : count === 3 ? 3 : 4
                    const future = date > today
                    const label = `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}: ${count} check-in${count === 1 ? '' : 's'}`
                    return (
                      <span
                        key={key}
                        className={`streak-cell level-${future ? 0 : level}${future ? ' future' : ''}`}
                        title={label}
                        aria-label={label}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="streak-card-footer">
        {[
          { value: activity?.longest_streak ?? 0, label: 'Best streak' },
          { value: activity?.active_days ?? 0, label: 'Active days' },
          { value: activity?.total_checkins ?? 0, label: 'Check-ins' },
        ].map((stat) => (
          <div key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
        <div className="streak-legend" aria-label="Activity intensity">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <i key={level} className={`streak-cell level-${level}`} />
          ))}
          <span>More</span>
        </div>
      </div>
    </Card>
  )
}
