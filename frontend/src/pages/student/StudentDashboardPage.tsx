import { Link } from "react-router-dom"
import { BookOpen, CalendarClock, CalendarDays, TriangleAlert } from "lucide-react"

import { useAuth } from "@/context/AuthContext"
import { useStudentSchedule } from "@/hooks/useStudentSchedule"
import { REQUIRED_ATTENDANCE, rateTone } from "@/lib/attendance"
import { formatTime, toDateKey } from "@/lib/scheduling"
import {
  STUDENT_STATUS_CLASS,
  STUDENT_STATUS_LABEL,
} from "@/hooks/useStudentSchedule"
import { AttendanceInsight } from "@/components/attendance/AttendanceInsight"
import { BlobIllustration } from "@/components/illustrations/BlobIllustration"
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

const upcomingFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  day: "numeric",
  month: "short",
})

export default function StudentDashboardPage() {
  const { profile } = useAuth()
  const { loading, subjects, classes, statsBySubject, overall } =
    useStudentSchedule()

  const todayKey = toDateKey(new Date())
  const now = new Date()
  const todaysClasses = classes.filter((c) => c.class_date === todayKey)
  const upcoming = classes
    .filter((c) => c.start > now && c.status === "upcoming")
    .slice(0, 4)

  const belowRequirement =
    overall.conducted > 0 && overall.rate < REQUIRED_ATTENDANCE

  return (
    <div className="mx-auto max-w-4xl py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting()}, {profile?.full_name?.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Here's your schedule and attendance overview.
        </p>
      </div>

      {loading ? (
        <div className="mt-6 space-y-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      ) : subjects.length === 0 ? (
        <div className="flex flex-col items-center gap-5 py-16 text-center">
          <BlobIllustration icon={BookOpen} className="scale-75" />
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              No subjects enrolled yet
            </h2>
            <p className="text-muted-foreground mt-1 max-w-sm text-balance">
              Ask your teacher for a join code, then enroll to see your
              schedule and attendance here.
            </p>
          </div>
          <Button asChild>
            <Link to="/s/subjects">Join a subject</Link>
          </Button>
        </div>
      ) : (
        <>
          {belowRequirement && (
            <Card className="border-warning/40 mt-6 rounded-2xl border">
              <CardContent className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-2.5">
                  <TriangleAlert className="text-warning mt-0.5 size-5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">
                      Attendance needs attention
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                      Your current attendance is {overall.rate}%, which is
                      below the required {REQUIRED_ATTENDANCE}%. Attending
                      your upcoming classes consistently will bring it up.
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to="/s/attendance">View attendance</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="mt-6 rounded-2xl">
            <CardContent>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-muted-foreground text-sm">
                    Overall attendance
                  </p>
                  {overall.conducted > 0 ? (
                    <p className="mt-1 text-sm">
                      {overall.present} / {overall.conducted} classes attended
                    </p>
                  ) : (
                    <p className="text-muted-foreground mt-1 text-sm">
                      Attendance data will appear after your classes are
                      conducted.
                    </p>
                  )}
                </div>
                <p
                  className={`text-4xl font-semibold tabular-nums ${overall.conducted > 0 ? rateTone(overall.rate) : "text-muted-foreground"}`}
                >
                  {overall.conducted > 0 ? `${overall.rate}%` : "—"}
                </p>
              </div>

              <AttendanceInsight
                present={overall.present}
                conducted={overall.conducted}
                className="mt-4"
              />
            </CardContent>
          </Card>

          <div className="mt-8 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight">
              Today's classes
            </h2>
            <Button asChild variant="outline" size="sm">
              <Link to="/s/timetable">
                <CalendarDays />
                Timetable
              </Link>
            </Button>
          </div>

          <div className="mt-3">
            {todaysClasses.length === 0 ? (
              <Card className="rounded-2xl">
                <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
                  <CalendarClock className="text-muted-foreground size-6" />
                  <p className="text-sm font-medium">
                    No classes scheduled for today
                  </p>
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
                            {cls.subject.code} · Section {cls.subject.section}
                            {cls.room ? ` · ${cls.room}` : ""}
                          </p>
                        </div>
                      </div>
                      <Badge className={STUDENT_STATUS_CLASS[cls.status]}>
                        {STUDENT_STATUS_LABEL[cls.status]}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <h2 className="mt-8 text-lg font-semibold tracking-tight">Upcoming</h2>
          <div className="mt-3">
            {upcoming.length === 0 ? (
              <Card className="rounded-2xl">
                <CardContent className="text-muted-foreground py-8 text-center text-sm">
                  No upcoming classes.
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-2xl">
                <CardContent className="divide-border/60 divide-y p-0">
                  {upcoming.map((cls) => (
                    <div
                      key={cls.id}
                      className="flex flex-wrap items-center justify-between gap-3 px-(--card-spacing) py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {cls.subject.name}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {cls.subject.code} · Section {cls.subject.section}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          {upcomingFormatter.format(cls.start)}
                        </p>
                        <p className="text-muted-foreground text-xs tabular-nums">
                          {formatTime(cls.start_time)}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <h2 className="mt-8 text-lg font-semibold tracking-tight">
            Subject attendance
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {subjects.map((subject) => {
              const stats = statsBySubject[subject.id]
              return (
                <Card key={subject.id} className="rounded-2xl">
                  <CardContent className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {subject.name}
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {stats.conducted > 0
                          ? `${stats.present} / ${stats.conducted} attended`
                          : "No classes conducted yet"}
                      </p>
                    </div>
                    <Link
                      to={`/s/attendance/${subject.id}`}
                      className={`text-lg font-semibold tabular-nums ${stats.conducted > 0 ? rateTone(stats.rate) : "text-muted-foreground"}`}
                    >
                      {stats.conducted > 0 ? `${stats.rate}%` : "—"}
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
