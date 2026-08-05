import { useEffect, useState } from "react"
import { Users, Share2, BookOpen } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import type { Subject } from "@/types/database"
import { SubjectCard } from "@/components/subjects/SubjectCard"
import { CreateSubjectDialog } from "@/components/subjects/CreateSubjectDialog"
import { ShareSubjectDialog } from "@/components/subjects/ShareSubjectDialog"
import { BlobIllustration } from "@/components/illustrations/BlobIllustration"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

type SubjectWithCount = Subject & { enrollments: { count: number }[] }

export default function TeacherSubjectsPage() {
  const { profile } = useAuth()
  const [subjects, setSubjects] = useState<SubjectWithCount[] | null>(null)
  const [shareSubject, setShareSubject] = useState<Subject | null>(null)

  const loadSubjects = async (teacherId: string) => {
    const { data, error } = await supabase
      .from("subjects")
      .select("*, enrollments(count)")
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false })

    if (!error) setSubjects((data as SubjectWithCount[]) ?? [])
  }

  useEffect(() => {
    if (profile) loadSubjects(profile.id)
  }, [profile])

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
          <CreateSubjectDialog
            teacherId={profile.id}
            onCreated={(subject) =>
              setSubjects((prev) => [
                { ...subject, enrollments: [{ count: 0 }] },
                ...(prev ?? []),
              ])
            }
          />
        )}
      </div>

      <div className="mt-8">
        {subjects === null ? (
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
            {subjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                name={subject.name}
                code={subject.code}
                section={subject.section}
                stats={[
                  {
                    icon: Users,
                    label: "students",
                    value: subject.enrollments?.[0]?.count ?? 0,
                  },
                ]}
                footer={
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setShareSubject(subject)}
                  >
                    <Share2 />
                    Share
                  </Button>
                }
              />
            ))}
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
