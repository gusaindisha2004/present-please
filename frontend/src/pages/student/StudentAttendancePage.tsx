import { Link } from "react-router-dom"
import { ClipboardList } from "lucide-react"

import { useStudentSchedule } from "@/hooks/useStudentSchedule"
import { REQUIRED_ATTENDANCE, rateTone } from "@/lib/attendance"
import { AttendanceInsight } from "@/components/attendance/AttendanceInsight"
import { AttendanceTrend } from "@/components/attendance/AttendanceTrend"
import { BlobIllustration } from "@/components/illustrations/BlobIllustration"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function standing(rate: number, conducted: number) {
  if (conducted === 0) return null
  if (rate >= REQUIRED_ATTENDANCE)
    return { label: "On track", cls: "bg-success/15 text-success" }
  if (rate >= REQUIRED_ATTENDANCE - 10)
    return { label: "At risk", cls: "bg-warning/15 text-warning" }
  return { label: "Below requirement", cls: "bg-destructive/15 text-destructive" }
}

export default function StudentAttendancePage() {
  const { loading, subjects, classes, statsBySubject, overall } =
    useStudentSchedule()

  const overallStanding = standing(overall.rate, overall.conducted)

  return (
    <div className="mx-auto max-w-3xl py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Your overall attendance and how each subject is doing.
        </p>
      </div>

      {loading ? (
        <div className="mt-6 space-y-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      ) : subjects.length === 0 ? (
        <div className="flex flex-col items-center gap-5 py-16 text-center">
          <BlobIllustration icon={ClipboardList} className="scale-75" />
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              No subjects enrolled yet
            </h2>
            <p className="text-muted-foreground mt-1 max-w-sm text-balance">
              Join a subject with a code from your teacher to start tracking
              your attendance.
            </p>
          </div>
          <Button asChild>
            <Link to="/s/subjects">Go to subjects</Link>
          </Button>
        </div>
      ) : (
        <>
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
                      Attendance will appear here once your classes are
                      conducted.
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p
                    className={`text-4xl font-semibold tabular-nums ${overall.conducted > 0 ? rateTone(overall.rate) : "text-muted-foreground"}`}
                  >
                    {overall.conducted > 0 ? `${overall.rate}%` : "—"}
                  </p>
                  {overallStanding && (
                    <Badge className={`mt-1.5 ${overallStanding.cls}`}>
                      {overallStanding.label}
                    </Badge>
                  )}
                </div>
              </div>

              <AttendanceInsight
                present={overall.present}
                conducted={overall.conducted}
                className="mt-4"
              />
            </CardContent>
          </Card>

          <AttendanceTrend classes={classes} />

          <h2 className="mt-8 text-lg font-semibold tracking-tight">
            By subject
          </h2>

          <div className="mt-3 space-y-3">
            {subjects.map((subject) => {
              const stats = statsBySubject[subject.id]
              const mark = standing(stats.rate, stats.conducted)

              return (
                <Card key={subject.id} className="rounded-2xl">
                  <CardContent className="flex flex-wrap items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium">{subject.name}</p>
                      <p className="text-muted-foreground mt-0.5 text-sm">
                        {subject.code} · Section {subject.section}
                      </p>
                      <p className="mt-1.5 text-sm">
                        {stats.conducted > 0 ? (
                          <>
                            {stats.present} / {stats.conducted} classes attended
                          </>
                        ) : (
                          <span className="text-muted-foreground">
                            No classes conducted yet
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p
                          className={`text-2xl font-semibold tabular-nums ${stats.conducted > 0 ? rateTone(stats.rate) : "text-muted-foreground"}`}
                        >
                          {stats.conducted > 0 ? `${stats.rate}%` : "—"}
                        </p>
                        {mark && (
                          <Badge className={`mt-1 ${mark.cls}`}>
                            {mark.label}
                          </Badge>
                        )}
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/s/attendance/${subject.id}`}>
                          View details
                        </Link>
                      </Button>
                    </div>
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
