import { REQUIRED_ATTENDANCE, attendanceRate, rateTone } from "@/lib/attendance"
import type { StudentClassView } from "@/hooks/useStudentSchedule"
import { Card, CardContent } from "@/components/ui/card"

const monthFormatter = new Intl.DateTimeFormat(undefined, { month: "short" })

/**
 * Attendance month by month, so a student can see whether things are
 * improving or slipping. Only counts classes that actually contributed to
 * their record — cancelled, upcoming and unmarked classes are absent from
 * this by construction.
 */
export function AttendanceTrend({ classes }: { classes: StudentClassView[] }) {
  const counted = classes.filter(
    (c) => c.status === "present" || c.status === "absent"
  )

  // One month is a data point, not a trend.
  const buckets = new Map<string, { label: string; present: number; total: number }>()
  for (const cls of counted) {
    const key = `${cls.start.getFullYear()}-${cls.start.getMonth()}`
    const entry = buckets.get(key) ?? {
      label: monthFormatter.format(cls.start),
      present: 0,
      total: 0,
    }
    entry.total += 1
    if (cls.status === "present") entry.present += 1
    buckets.set(key, entry)
  }

  const months = Array.from(buckets.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, v]) => ({ ...v, rate: attendanceRate(v.present, v.total) }))

  if (months.length < 2) return null

  const first = months[0].rate
  const last = months[months.length - 1].rate
  const direction =
    last > first + 5 ? "Improving" : last < first - 5 ? "Declining" : "Steady"

  return (
    <Card className="mt-4 rounded-2xl">
      <CardContent>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-muted-foreground text-sm">Attendance trend</p>
          <p className="text-sm font-medium">{direction}</p>
        </div>

        <div className="mt-4 flex items-end gap-3">
          {months.map((month) => (
            <div key={month.label} className="flex flex-1 flex-col items-center gap-1.5">
              <span
                className={`text-xs font-medium tabular-nums ${rateTone(month.rate)}`}
              >
                {month.rate}%
              </span>
              <div className="bg-muted relative h-24 w-full overflow-hidden rounded-md">
                <div
                  className={`absolute bottom-0 w-full rounded-md ${
                    month.rate >= REQUIRED_ATTENDANCE
                      ? "bg-success/40"
                      : "bg-warning/40"
                  }`}
                  style={{ height: `${Math.max(month.rate, 2)}%` }}
                />
              </div>
              <span className="text-muted-foreground text-xs">
                {month.label}
              </span>
              <span className="text-muted-foreground text-[0.7rem] tabular-nums">
                {month.present}/{month.total}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
