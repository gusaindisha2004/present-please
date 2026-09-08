import { useState } from "react"
import { Link } from "react-router-dom"
import { Users, Share2, BookOpen, ScanFace, CalendarRange } from "lucide-react"

import { useTeacherSchedule } from "@/hooks/useTeacherSchedule"
import { useAuth } from "@/context/AuthContext"
import { formatTime, toDateKey } from "@/lib/scheduling"
import { rateTone } from "@/lib/attendance"
import type { Subject } from "@/types/database"
import { SubjectCard } from "@/components/subjects/SubjectCard"
import { CreateSubjectDialog } from "@/components/subjects/CreateSubjectDialog"
import { ShareSubjectDialog } from "@/components/subjects/ShareSubjectDialog"
import { BlobIllustration } from "@/components/illustrations/BlobIllustration"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export default function TeacherSubjectsPage() {
  const { profile } = useAuth()
  const { loading, subjects, statsBySubject, reload } = useTeacherSchedule()
  const [shareSubject, setShareSubject] = useState<Subject | null>(null)

  const todayKey = toDateKey(new Date())

  return (
    <div className="mx-auto max-w-5xl py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Subjects</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Create subjects and share join codes with your students.
          </p>
        </div>
        {profile && (
          <CreateSubjectDialog teacherId={profile.id} onCreated={reload} />
        )}
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : subjects.length === 0 ? (
          <div className="flex flex-col items-center gap-5 py-12 text-center">
            <BlobIllustration icon={BookOpen} className="scale-75" />
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                No subjects yet
              </h2>
              <p className="text-muted-foreground mt-1 max-w-sm text-balance">
                Create your first subject to get a join code you can share
                with students.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => {
              const stats = statsBySubject[subject.id]
              const next = stats?.nextClass
              const nextLabel = next
                ? `${next.class_date === todayKey ? "Today" : next.start.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })} · ${formatTime(next.start_time)}`
                : "Nothing scheduled"

              return (
                <SubjectCard
                  key={subject.id}
                  name={subject.name}
                  code={subject.code}
                  section={subject.section}
                  stats={[
                    {
                      icon: Users,
                      label:
                        (subject.enrollments?.[0]?.count ?? 0) === 1
                          ? "student"
                          : "students",
                      value: subject.enrollments?.[0]?.count ?? 0,
                    },
                  ]}
                  meta={
                    <>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">Next class</span>
                        <span className="text-right font-medium">
                          {nextLabel}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">Attendance</span>
                        <span className="text-right font-medium">
                          {stats && stats.totalRecords > 0 ? (
                            <>
                              <span className={rateTone(stats.rate)}>
                                {stats.rate}%
                              </span>
                              <span className="text-muted-foreground">
                                {" · "}
                                {stats.conducted}{" "}
                                {stats.conducted === 1 ? "class" : "classes"}
                              </span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">
                              Not taken yet
                            </span>
                          )}
                        </span>
                      </div>
                    </>
                  }
                  footer={
                    <>
                      <Button asChild size="sm" className="flex-1">
                        <Link to={`/t/attendance/${subject.id}`}>
                          <ScanFace />
                          Take attendance
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/t/subjects/${subject.id}/classes`}>
                          <CalendarRange />
                          Classes
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShareSubject(subject)}
                      >
                        <Share2 />
                        Share
                      </Button>
                    </>
                  }
                />
              )
            })}
          </div>
        )}
      </div>

      <ShareSubjectDialog
        subject={shareSubject}
        onOpenChange={(open) => !open && setShareSubject(null)}
      />
    </div>
  )
}
