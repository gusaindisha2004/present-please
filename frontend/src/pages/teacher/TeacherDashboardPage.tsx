import { useState } from "react"
import { Link } from "react-router-dom"
import {
  BookOpen,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  TrendingUp,
} from "lucide-react"

import { useAuth } from "@/context/AuthContext"
import { useTeacherSchedule, type ClassView } from "@/hooks/useTeacherSchedule"
import {
  STATUS_CLASS,
  STATUS_LABEL,
  formatTime,
  groupLabel,
  toDateKey,
} from "@/lib/scheduling"
import { rateTone } from "@/lib/attendance"
import {
  ClassDetailDialog,
  type ClassDetail,
} from "@/components/timetable/ClassDetailDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function greeting(date = new Date()): string {
  const hour = date.getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function toDetail(cls: ClassView): ClassDetail {
  return {
    id: cls.id,
    subject_id: cls.subject_id,
    slot_id: cls.slot_id,
    class_date: cls.class_date,
    start_time: cls.start_time,
    end_time: cls.end_time,
    room: cls.room,
    branch: cls.branch,
    year: cls.year,
    cancel_reason: cls.cancel_reason,
    status: cls.status,
    subjectName: cls.subject.name,
    subjectCode: cls.subject.code,
    subjectSection: cls.subject.section,
  }
}

export default function TeacherDashboardPage() {
  const { profile } = useAuth()
  const { loading, subjects, classes, statsBySubject, reload } =
    useTeacherSchedule()
  const [selected, setSelected] = useState<ClassDetail | null>(null)

  const todayKey = toDateKey(new Date())
  const todaysClasses = classes.filter((c) => c.class_date === todayKey)
  const pendingCount = classes.filter((c) => c.status === "pending").length

  const totals = Object.values(statsBySubject).reduce(
    (acc, s) => ({
      present: acc.present + s.presentRecords,
      total: acc.total + s.totalRecords,
    }),
    { present: 0, total: 0 }
  )
  const averageAttendance =
    totals.total === 0 ? null : Math.round((totals.present / totals.total) * 100)

  const summary = [
    {
      icon: BookOpen,
      label: "Subjects",
      value: subjects.length,
      hint: "currently teaching",
    },
    {
      icon: CalendarDays,
      label: "Today's classes",
      value: todaysClasses.length,
      hint: todaysClasses.length === 1 ? "scheduled today" : "scheduled today",
    },
    {
      icon: ClipboardCheck,
      label: "Attendance pending",
      value: pendingCount,
      hint: "waiting to be taken",
    },
    {
      icon: TrendingUp,
      label: "Average attendance",
      value: averageAttendance === null ? "—" : `${averageAttendance}%`,
      hint: averageAttendance === null ? "no attendance yet" : "across subjects",
      tone: averageAttendance === null ? "" : rateTone(averageAttendance),
    },
  ]

  return (
    <div className="mx-auto max-w-5xl py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting()}, {profile?.full_name?.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Here's your teaching schedule and attendance overview.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))
          : summary.map(({ icon: Icon, label, value, hint, tone }) => (
              <Card key={label} className="rounded-2xl">
                <CardContent>
                  <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                    <Icon className="size-4" />
                    {label}
                  </div>
                  <p
                    className={`mt-2 text-2xl font-semibold tabular-nums ${tone ?? ""}`}
                  >
                    {value}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-xs">{hint}</p>
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="mt-8 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight">Today's classes</h2>
        <Button asChild variant="outline" size="sm">
          <Link to="/t/timetable">
            <CalendarDays />
            Timetable
          </Link>
        </Button>
      </div>

      <div className="mt-3">
        {loading ? (
          <Skeleton className="h-32 rounded-2xl" />
        ) : todaysClasses.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <CalendarClock className="text-muted-foreground size-6" />
              <div>
                <p className="text-sm font-medium">No classes scheduled today</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {classes.length === 0
                    ? "Set up your timetable to see your classes here."
                    : "Enjoy the quiet one."}
                </p>
              </div>
              {classes.length === 0 && (
                <Button asChild size="sm">
                  <Link to="/t/timetable">Set up timetable</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-2xl">
            <CardContent className="divide-border/60 divide-y p-0">
              {todaysClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-(--card-spacing) py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 items-baseline gap-4">
                    <span className="text-muted-foreground w-20 shrink-0 text-sm tabular-nums">
                      {formatTime(cls.start_time)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {cls.subject.name}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {[
                          cls.subject.code,
                          groupLabel(cls.branch, cls.year),
                          `Section ${cls.subject.section}`,
                          cls.room,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={STATUS_CLASS[cls.status]}>
                      {STATUS_LABEL[cls.status]}
                    </Badge>
                    {cls.status === "pending" ? (
                      <Button asChild size="sm">
                        <Link
                          to={`/t/attendance/${cls.subject_id}?classId=${cls.id}`}
                        >
                          Take attendance
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelected(toDetail(cls))}
                      >
                        View
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <ClassDetailDialog
        cls={selected}
        onOpenChange={(open) => !open && setSelected(null)}
        onChanged={reload}
      />
    </div>
  )
}
