import { useEffect, useState } from "react"
import { UserMinus, BookOpen } from "lucide-react"
import { toast } from "sonner"

import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import type { Enrollment, Subject } from "@/types/database"
import { SubjectCard } from "@/components/subjects/SubjectCard"
import { EnrollDialog } from "@/components/subjects/EnrollDialog"
import { BlobIllustration } from "@/components/illustrations/BlobIllustration"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

type EnrollmentWithSubject = Enrollment & { subjects: Subject }

export default function StudentSubjectsPage() {
  const { profile } = useAuth()
  const [enrollments, setEnrollments] = useState<EnrollmentWithSubject[] | null>(null)

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
            onEnrolled={() => loadEnrollments(profile.id)}
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
            {enrollments.map((enrollment) => (
              <SubjectCard
                key={enrollment.id}
                name={enrollment.subjects.name}
                code={enrollment.subjects.code}
                section={enrollment.subjects.section}
                footer={
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive w-full"
                    onClick={() =>
                      handleUnenroll(enrollment.id, enrollment.subjects.name)
                    }
                  >
                    <UserMinus />
                    Unenroll
                  </Button>
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
