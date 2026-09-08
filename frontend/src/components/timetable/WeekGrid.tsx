import {
  WEEKDAYS,
  WEEKDAYS_SHORT,
  addDays,
  formatTime,
  toDateKey,
} from "@/lib/scheduling"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

/**
 * One class as the grid needs it — role-agnostic on purpose, so the teacher
 * (upcoming / pending / completed) and the student (present / absent / …)
 * can render the same week with their own labels.
 */
export interface WeekGridItem {
  id: string
  class_date: string
  start_time: string
  end_time: string
  start: Date
  title: string
  subtitle: string
  statusLabel: string
  statusClass: string
}

export function WeekGrid({
  weekStart,
  items,
  onSelect,
}: {
  weekStart: Date
  items: WeekGridItem[]
  onSelect: (id: string) => void
}) {
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const weekKeys = weekDates.map(toDateKey)
  const weekItems = items.filter((i) => weekKeys.includes(i.class_date))

  // Mon–Fri always, plus any other day that actually has a class, so a
  // Saturday slot can never be invisible.
  const daysWithClasses = new Set(weekItems.map((i) => i.start.getDay()))
  const visibleDays = [0, 1, 2, 3, 4, 5, 6].filter(
    (d) => (d >= 1 && d <= 5) || daysWithClasses.has(d)
  )

  const timeBands = Array.from(
    new Set(weekItems.map((i) => `${i.start_time}|${i.end_time}`))
  )
    .sort()
    .map((band) => {
      const [start, end] = band.split("|")
      return { start, end }
    })

  const todayKey = toDateKey(new Date())

  if (weekItems.length === 0) {
    return (
      <Card className="mt-6 rounded-2xl">
        <CardContent className="text-muted-foreground py-10 text-center text-sm">
          No classes scheduled this week.
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Desktop: the week as a grid */}
      <div className="mt-6 hidden overflow-x-auto md:block">
        <table className="w-full border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="w-24" />
              {visibleDays.map((day) => {
                const date = weekDates[day]
                const isToday = toDateKey(date) === todayKey
                return (
                  <th key={day} className="p-2 text-left">
                    <span
                      className={`text-sm font-medium ${isToday ? "text-primary" : ""}`}
                    >
                      {WEEKDAYS_SHORT[day]}
                    </span>
                    <span className="text-muted-foreground ml-1 text-xs">
                      {date.getDate()}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {timeBands.map((band) => (
              <tr key={`${band.start}-${band.end}`}>
                <td className="text-muted-foreground align-top text-xs whitespace-nowrap">
                  {formatTime(band.start)}
                </td>
                {visibleDays.map((day) => {
                  const item = weekItems.find(
                    (i) =>
                      i.start.getDay() === day &&
                      i.start_time === band.start &&
                      i.end_time === band.end
                  )
                  return (
                    <td key={day} className="align-top">
                      {item ? (
                        <button
                          type="button"
                          onClick={() => onSelect(item.id)}
                          className="ring-foreground/10 hover:bg-muted/60 w-full rounded-xl p-2.5 text-left ring-1 transition-colors"
                        >
                          <p className="truncate text-sm font-medium">
                            {item.title}
                          </p>
                          <p className="text-muted-foreground truncate text-xs">
                            {item.subtitle}
                          </p>
                          <Badge className={`mt-1.5 ${item.statusClass}`}>
                            {item.statusLabel}
                          </Badge>
                        </button>
                      ) : (
                        <div className="text-muted-foreground/40 py-2 text-center text-xs">
                          —
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: day by day, rather than five squeezed columns */}
      <div className="mt-6 space-y-5 md:hidden">
        {visibleDays
          .map((day) => ({
            day,
            items: weekItems.filter((i) => i.start.getDay() === day),
          }))
          .filter((group) => group.items.length > 0)
          .map(({ day, items: dayItems }) => (
            <div key={day}>
              <p className="text-xs font-medium tracking-wide uppercase">
                {WEEKDAYS[day]}
                <span className="text-muted-foreground ml-1.5">
                  {weekDates[day].getDate()}
                </span>
              </p>
              <div className="mt-2 space-y-2">
                {dayItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item.id)}
                    className="ring-foreground/10 hover:bg-muted/60 flex w-full items-center justify-between gap-3 rounded-xl p-3 text-left ring-1 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-muted-foreground text-xs">
                        {formatTime(item.start_time)}
                      </p>
                      <p className="truncate text-sm font-medium">
                        {item.title}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {item.subtitle}
                      </p>
                    </div>
                    <Badge className={item.statusClass}>
                      {item.statusLabel}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          ))}
      </div>
    </>
  )
}
