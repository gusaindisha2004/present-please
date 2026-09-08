import { Link, useParams } from "react-router-dom"
import { ArrowLeft, ClipboardList } from "lucide-react"

import {
  useStudentSchedule,
  STUDENT_STATUS_CLASS,
  STUDENT_STATUS_LABEL,
} from "@/hooks/useStudentSchedule"
import { rateTone } from "@/lib/attendance"
import { formatTime } from "@/lib/scheduling"
import { AttendanceInsight } from "@/components/attendance/AttendanceInsight"
import { BlobIllustration } from "@/components/illustrations/BlobIllustration"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  day: "numeric",
  month: "short",
})

export default function StudentSubjectAttendancePage() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const { loading, subjects, classes, statsBySubject } = useStudentSchedule()

  const subject = subjects.find((s) => s.id === subjectId)
  const stats = subjectId ? statsBySubject[subjectId] : undefined
  const now = new Date()

  const own = classes.filter((c) => c.subject_id === subjectId)
  const past = own
    .filter((c) => c.start <= now || c.status !== "upcoming")
    .sort((a, b) => b.start.getTime() - a.start.getTime())
  const upcoming = own
    .filter((c) => c.start > now && c.status === "upcoming")
    .sort((a, b) => a.start.getTime() - b.start.getTime())

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    )
  }

  if (!subject) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <div className="flex flex-col items-center gap-5 py-16 text-center">
          <BlobIllustration icon={ClipboardList} className="scale-75" />
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Subject not found
            </h2>
            <p className="text-muted-foreground mt-1 max-w-sm text-balance">
              You're not enrolled in this subject, or it no longer exists.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/s/attendance">Back to attendance</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <Link
        to="/s/attendance"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Attendance
      </Link>

      <div className="mt-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          {subject.name}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {subject.code} · Section {subject.section}
        </p>
      </div>

      <Card className="mt-6 rounded-2xl">
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-muted-foreground text-sm">Attendance</p>
              {stats && stats.conducted > 0 ? (
                <p className="mt-1 text-sm">
                  {stats.present} present · {stats.absent} absent
                </p>
              ) : (
                <p className="text-muted-foreground mt-1 text-sm">
                  Attendance will appear once your classes are conducted.
                </p>
              )}
            </div>
            <p
              className={`text-3xl font-semibold tabular-nums ${stats && stats.conducted > 0 ? rateTone(stats.rate) : "text-muted-foreground"}`}
            >
              {stats && stats.conducted > 0 ? `${stats.rate}%` : "—"}
            </p>
          </div>

          {stats && (
            <AttendanceInsight
              present={stats.present}
              conducted={stats.conducted}
              className="mt-4"
            />
          )}
        </CardContent>
      </Card>

      <h2 className="mt-8 text-lg font-semibold tracking-tight">
        Classes &amp; attendance
      </h2>

      {own.length === 0 ? (
        <Card className="mt-3 rounded-2xl">
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            No classes scheduled for this subject yet.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mt-3 space-y-2">
            {past.map((cls) => (
              <ClassRow key={cls.id} cls={cls} />
            ))}
          </div>

          {upcoming.length > 0 && (
            <>
              <h3 className="text-muted-foreground mt-6 text-xs font-medium tracking-wide uppercase">
                Upcoming
              </h3>
              <div className="mt-2 space-y-2">
                {upcoming.map((cls) => (
                  <ClassRow key={cls.id} cls={cls} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

function ClassRow({
  cls,
}: {
  cls: ReturnType<typeof useStudentSchedule>["classes"][number]
}) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">
            {dateFormatter.format(cls.start)}
            <span className="text-muted-foreground font-normal">
              {" · "}
              {formatTime(cls.start_time)}
            </span>
          </p>
          {cls.status === "cancelled" && cls.cancel_reason && (
            <p className="text-muted-foreground mt-0.5 text-xs">
              {cls.cancel_reason}
            </p>
          )}
        </div>
        <Badge className={STUDENT_STATUS_CLASS[cls.status]}>
          {STUDENT_STATUS_LABEL[cls.status]}
        </Badge>
      </CardContent>
    </Card>
  )
}
