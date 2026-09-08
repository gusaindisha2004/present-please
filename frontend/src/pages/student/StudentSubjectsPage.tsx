import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { UserMinus, BookOpen, ClipboardCheck } from "lucide-react"
import { toast } from "sonner"

import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import { useStudentSchedule } from "@/hooks/useStudentSchedule"
import { rateTone } from "@/lib/attendance"
import { formatTime, toDateKey } from "@/lib/scheduling"
import type { Enrollment, Subject } from "@/types/database"
import { SubjectCard } from "@/components/subjects/SubjectCard"
import { EnrollDialog } from "@/components/subjects/EnrollDialog"
import { BlobIllustration } from "@/components/illustrations/BlobIllustration"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

type EnrollmentWithSubject = Enrollment & { subjects: Subject }

export default function StudentSubjectsPage() {
  const { profile } = useAuth()
  const { statsBySubject, reload: reloadSchedule } = useStudentSchedule()
  const [enrollments, setEnrollments] = useState<EnrollmentWithSubject[] | null>(null)
  const todayKey = toDateKey(new Date())

  const loadEnrollments = async (studentId: string) => {
    const { data, error } = await supabase
      .from("enrollments")
      .select("*, subjects(*)")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })

    if (!error) setEnrollments((data as EnrollmentWithSubject[]) ?? [])
  }

  useEffect(() => {
    if (profile) loadEnrollments(profile.id)
  }, [profile])

  const handleUnenroll = async (enrollmentId: string, subjectName: string) => {
    const { error } = await supabase
      .from("enrollments")
      .delete()
      .eq("id", enrollmentId)

    if (error) {
      toast.error("Couldn't unenroll — please try again")
      return
    }

    toast.success(`Unenrolled from ${subjectName}`)
    setEnrollments((prev) => prev?.filter((e) => e.id !== enrollmentId) ?? null)
    reloadSchedule()
  }

  return (
    <div className="mx-auto max-w-5xl py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Subjects</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Your enrolled subjects. Join more with a code from your teacher.
          </p>
        </div>
        {profile && (
          <EnrollDialog
            studentId={profile.id}
            onEnrolled={() => {
              loadEnrollments(profile.id)
              reloadSchedule()
            }}
          />
        )}
      </div>

      <div className="mt-8">
        {enrollments === null ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
        ) : enrollments.length === 0 ? (
          <div className="flex flex-col items-center gap-5 py-12 text-center">
            <BlobIllustration icon={BookOpen} className="scale-75" />
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                No subjects yet
              </h2>
              <p className="text-muted-foreground mt-1 max-w-sm text-balance">
                Ask your teacher for a join code, then enroll to see it here.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((enrollment) => {
              const stats = statsBySubject[enrollment.subjects.id]
              const next = stats?.nextClass
              return (
              <SubjectCard
                key={enrollment.id}
                name={enrollment.subjects.name}
                code={enrollment.subjects.code}
                section={enrollment.subjects.section}
                meta={
                  <>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">Attendance</span>
                      <span className="text-right font-medium">
                        {stats && stats.conducted > 0 ? (
                          <>
                            <span className={rateTone(stats.rate)}>
                              {stats.rate}%
                            </span>
                            <span className="text-muted-foreground">
                              {" · "}
                              {stats.present}/{stats.conducted} classes
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">
                            No classes yet
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">Next class</span>
                      <span className="text-right font-medium">
                        {next
                          ? `${next.class_date === todayKey ? "Today" : next.start.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })} · ${formatTime(next.start_time)}`
                          : "Nothing scheduled"}
                      </span>
                    </div>
                  </>
                }
                footer={
                  <>
                    <Button asChild size="sm" className="flex-1">
                      <Link to={`/s/attendance/${enrollment.subjects.id}`}>
                        <ClipboardCheck />
                        View attendance
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() =>
                        handleUnenroll(enrollment.id, enrollment.subjects.name)
                      }
                    >
                      <UserMinus />
                      Unenroll
                    </Button>
                  </>
                }
              />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
