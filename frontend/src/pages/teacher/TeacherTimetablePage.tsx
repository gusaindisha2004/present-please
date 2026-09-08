import { useState } from "react"
import { Link } from "react-router-dom"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"

import { useTeacherSchedule, type ClassView } from "@/hooks/useTeacherSchedule"
import {
  STATUS_CLASS,
  STATUS_LABEL,
  WEEKDAYS,
  WEEKDAYS_SHORT,
  addDays,
  formatTime,
  startOfWeek,
  toDateKey,
} from "@/lib/scheduling"
import { AddSlotDialog } from "@/components/timetable/AddSlotDialog"
import {
  ClassDetailDialog,
  type ClassDetail,
} from "@/components/timetable/ClassDetailDialog"
import { BlobIllustration } from "@/components/illustrations/BlobIllustration"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const rangeFormatter = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
})

function toDetail(cls: ClassView): ClassDetail {
  return {
    id: cls.id,
    subject_id: cls.subject_id,
    class_date: cls.class_date,
    start_time: cls.start_time,
    end_time: cls.end_time,
    room: cls.room,
    cancel_reason: cls.cancel_reason,
    status: cls.status,
    subjectName: cls.subject.name,
    subjectCode: cls.subject.code,
    subjectSection: cls.subject.section,
  }
}

export default function TeacherTimetablePage() {
  const { loading, subjects, classes, reload } = useTeacherSchedule()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [selected, setSelected] = useState<ClassDetail | null>(null)

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const weekKeys = weekDates.map(toDateKey)
  const weekClasses = classes.filter((c) => weekKeys.includes(c.class_date))

  // Show Mon–Fri plus any other day that actually has a class, so a
  // Saturday slot can never be invisible.
  const daysWithClasses = new Set(weekClasses.map((c) => c.start.getDay()))
  const visibleDays = [0, 1, 2, 3, 4, 5, 6].filter(
    (d) => (d >= 1 && d <= 5) || daysWithClasses.has(d)
  )

  // Rows are the distinct time bands actually in use this week.
  const timeBands = Array.from(
    new Set(weekClasses.map((c) => `${c.start_time}|${c.end_time}`))
  )
    .sort()
    .map((band) => {
      const [start, end] = band.split("|")
      return { start, end }
    })

  const todayKey = toDateKey(new Date())

  return (
    <div className="mx-auto max-w-6xl py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Timetable</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Your weekly teaching schedule. Click a class to take attendance or
            cancel it.
          </p>
        </div>
        <AddSlotDialog subjects={subjects} onCreated={reload} />
      </div>

      <div className="mt-6 flex items-center gap-2">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Previous week"
          onClick={() => setWeekStart(addDays(weekStart, -7))}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Next week"
          onClick={() => setWeekStart(addDays(weekStart, 7))}
        >
          <ChevronRight />
        </Button>
        <span className="text-sm font-medium">
          {rangeFormatter.format(weekStart)} –{" "}
          {rangeFormatter.format(addDays(weekStart, 6))}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setWeekStart(startOfWeek(new Date()))}
        >
          This week
        </Button>
      </div>

      {loading ? (
        <Skeleton className="mt-6 h-64 rounded-2xl" />
      ) : subjects.length === 0 ? (
        <EmptyState
          title="No subjects yet"
          body="Create a subject first, then add its classes to your timetable."
          action={
            <Button asChild>
              <Link to="/t/subjects">Go to subjects</Link>
            </Button>
          }
        />
      ) : classes.length === 0 ? (
        <EmptyState
          title="No classes scheduled yet"
          body="Add your weekly classes and they'll appear here, ready for attendance."
          action={<AddSlotDialog subjects={subjects} onCreated={reload} />}
        />
      ) : (
        <>
          {/* Desktop: the week as a grid */}
          <div className="mt-6 hidden overflow-x-auto md:block">
            {weekClasses.length === 0 ? (
              <Card className="rounded-2xl">
                <CardContent className="text-muted-foreground py-10 text-center text-sm">
                  No classes scheduled this week.
                </CardContent>
              </Card>
            ) : (
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
                        const cls = weekClasses.find(
                          (c) =>
                            c.start.getDay() === day &&
                            c.start_time === band.start &&
                            c.end_time === band.end
                        )
                        return (
                          <td key={day} className="align-top">
                            {cls ? (
                              <button
                                type="button"
                                onClick={() => setSelected(toDetail(cls))}
                                className="ring-foreground/10 hover:bg-muted/60 w-full rounded-xl p-2.5 text-left ring-1 transition-colors"
                              >
                                <p className="truncate text-sm font-medium">
                                  {cls.subject.name}
                                </p>
                                <p className="text-muted-foreground truncate text-xs">
                                  {cls.subject.code}
                                  {cls.room ? ` · ${cls.room}` : ""}
                                </p>
                                <Badge
                                  className={`mt-1.5 ${STATUS_CLASS[cls.status]}`}
                                >
                                  {STATUS_LABEL[cls.status]}
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
            )}
          </div>

          {/* Mobile: day by day, rather than five squeezed columns */}
          <div className="mt-6 space-y-5 md:hidden">
            {weekClasses.length === 0 ? (
              <Card className="rounded-2xl">
                <CardContent className="text-muted-foreground py-10 text-center text-sm">
                  No classes scheduled this week.
                </CardContent>
              </Card>
            ) : (
              visibleDays
                .map((day) => ({
                  day,
                  items: weekClasses.filter((c) => c.start.getDay() === day),
                }))
                .filter((group) => group.items.length > 0)
                .map(({ day, items }) => (
                  <div key={day}>
                    <p className="text-xs font-medium tracking-wide uppercase">
                      {WEEKDAYS[day]}
                      <span className="text-muted-foreground ml-1.5">
                        {weekDates[day].getDate()}
                      </span>
                    </p>
                    <div className="mt-2 space-y-2">
                      {items.map((cls) => (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => setSelected(toDetail(cls))}
                          className="ring-foreground/10 hover:bg-muted/60 flex w-full items-center justify-between gap-3 rounded-xl p-3 text-left ring-1 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-muted-foreground text-xs">
                              {formatTime(cls.start_time)}
                            </p>
                            <p className="truncate text-sm font-medium">
                              {cls.subject.name}
                            </p>
                            <p className="text-muted-foreground truncate text-xs">
                              {cls.subject.code} · Section{" "}
                              {cls.subject.section}
                            </p>
                          </div>
                          <Badge className={STATUS_CLASS[cls.status]}>
                            {STATUS_LABEL[cls.status]}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
            )}
          </div>
        </>
      )}

      <ClassDetailDialog
        cls={selected}
        onOpenChange={(open) => !open && setSelected(null)}
        onChanged={reload}
      />
    </div>
  )
}

function EmptyState({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-5 py-16 text-center">
      <BlobIllustration icon={CalendarDays} className="scale-75" />
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="text-muted-foreground mt-1 max-w-sm text-balance">
          {body}
        </p>
      </div>
      {action}
    </div>
  )
}
