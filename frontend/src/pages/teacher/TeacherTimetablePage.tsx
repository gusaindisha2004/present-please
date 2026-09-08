import { useState } from "react"
import { Link } from "react-router-dom"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"

import { useTeacherSchedule, type ClassView } from "@/hooks/useTeacherSchedule"
import { STATUS_CLASS, STATUS_LABEL, addDays, startOfWeek } from "@/lib/scheduling"
import { AddSlotDialog } from "@/components/timetable/AddSlotDialog"
import {
  ClassDetailDialog,
  type ClassDetail,
} from "@/components/timetable/ClassDetailDialog"
import { WeekGrid } from "@/components/timetable/WeekGrid"
import { BlobIllustration } from "@/components/illustrations/BlobIllustration"
import { Button } from "@/components/ui/button"
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
            statusLabel: STATUS_LABEL[c.status],
            statusClass: STATUS_CLASS[c.status],
          }))}
          onSelect={(id) => {
            const found = classes.find((c) => c.id === id)
            if (found) setSelected(toDetail(found))
          }}
        />
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
