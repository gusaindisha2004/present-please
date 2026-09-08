import { useState } from "react"
import { Link } from "react-router-dom"
import { CalendarDays, ChevronLeft, ChevronRight, MapPin } from "lucide-react"

import {
  useStudentSchedule,
  STUDENT_STATUS_CLASS,
  STUDENT_STATUS_LABEL,
  type StudentClassView,
} from "@/hooks/useStudentSchedule"
import { addDays, formatTime, startOfWeek } from "@/lib/scheduling"
import { WeekGrid } from "@/components/timetable/WeekGrid"
import { BlobIllustration } from "@/components/illustrations/BlobIllustration"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const rangeFormatter = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
})

const dayFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  day: "numeric",
  month: "long",
})

export default function StudentTimetablePage() {
  const { loading, classes } = useStudentSchedule()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [selected, setSelected] = useState<StudentClassView | null>(null)

  return (
    <div className="mx-auto max-w-6xl py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Timetable</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Your weekly class schedule, with your attendance for each class.
        </p>
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
      ) : classes.length === 0 ? (
        <div className="flex flex-col items-center gap-5 py-16 text-center">
          <BlobIllustration icon={CalendarDays} className="scale-75" />
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              No classes scheduled
            </h2>
            <p className="text-muted-foreground mt-1 max-w-sm text-balance">
              Once you've joined a subject and your teacher sets up their
              timetable, your classes will appear here.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/s/subjects">Go to subjects</Link>
          </Button>
        </div>
      ) : (
        <WeekGrid
          weekStart={weekStart}
          items={classes.map((c) => ({
            id: c.id,
            class_date: c.class_date,
            start_time: c.start_time,
            end_time: c.end_time,
            start: c.start,
            title: c.subject.name,
            subtitle: `${c.subject.code}${c.room ? ` · ${c.room}` : ""}`,
            statusLabel: STUDENT_STATUS_LABEL[c.status],
            statusClass: STUDENT_STATUS_CLASS[c.status],
          }))}
          onSelect={(id) =>
            setSelected(classes.find((c) => c.id === id) ?? null)
          }
        />
      )}

      {/* Read-only: a student can look at a class, never change it. */}
      <Dialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.subject.name}</DialogTitle>
                <DialogDescription>
                  {selected.subject.code} · Section {selected.subject.section}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={STUDENT_STATUS_CLASS[selected.status]}>
                    {STUDENT_STATUS_LABEL[selected.status]}
                  </Badge>
                  {selected.room && (
                    <Badge variant="outline">
                      <MapPin className="size-3" />
                      {selected.room}
                    </Badge>
                  )}
                </div>

                <p className="text-sm">
                  {dayFormatter.format(selected.start)}
                  <span className="text-muted-foreground">
                    {" · "}
                    {formatTime(selected.start_time)} –{" "}
                    {formatTime(selected.end_time)}
                  </span>
                </p>

                {selected.status === "cancelled" && (
                  <p className="text-muted-foreground text-sm">
                    This class was cancelled
                    {selected.cancel_reason
                      ? ` — ${selected.cancel_reason}`
                      : ""}
                    . It doesn't count towards your attendance.
                  </p>
                )}
                {selected.status === "pending" && (
                  <p className="text-muted-foreground text-sm">
                    Your teacher hasn't recorded attendance for this class yet.
                  </p>
                )}
                {selected.status === "not-recorded" && (
                  <p className="text-muted-foreground text-sm">
                    Attendance was taken before you joined this subject, so it
                    doesn't count towards your attendance.
                  </p>
                )}
              </div>

              <Button asChild variant="outline">
                <Link to={`/s/attendance/${selected.subject_id}`}>
                  View subject attendance
                </Link>
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
