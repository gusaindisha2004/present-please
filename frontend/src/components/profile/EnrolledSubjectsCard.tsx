import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { BookOpen } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import type { Enrollment, SubjectWithTeacher } from "@/types/database"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type EnrollmentWithSubject = Enrollment & { subjects: SubjectWithTeacher }

/**
 * The subjects a student is enrolled in, and who teaches each one. Kept to a
 * read-only summary: enrolling and leaving still happen on the Subjects page,
 * so there is only ever one place to manage them.
 */
export function EnrolledSubjectsCard() {
  const { profile } = useAuth()
  const [rows, setRows] = useState<EnrollmentWithSubject[] | null>(null)

  useEffect(() => {
    if (!profile) return

    const load = async () => {
      const { data, error } = await supabase
        .from("enrollments")
        .select("*, subjects(*, profiles(full_name))")
        .eq("student_id", profile.id)
        .order("created_at", { ascending: false })

      setRows(error ? [] : ((data as EnrollmentWithSubject[]) ?? []))
    }

    load()
  }, [profile])

  return (
    <Card className="rounded-2xl">
      <CardContent>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold tracking-tight">Your subjects</h2>
            <p className="text-muted-foreground mt-0.5 text-sm">
              The subjects you're enrolled in and who teaches them.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/s/subjects">Manage</Link>
          </Button>
        </div>

        {rows === null ? (
          <Skeleton className="mt-4 h-16 rounded-xl" />
        ) : rows.length === 0 ? (
          <div className="text-muted-foreground mt-4 flex items-center gap-2 text-sm">
            <BookOpen className="size-4 shrink-0" />
            You're not enrolled in any subjects yet.
          </div>
        ) : (
          <ul className="divide-border/60 mt-4 divide-y">
            {rows.map(({ id, subjects }) => (
              <li
                key={id}
                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{subjects.name}</p>
                  <p className="text-muted-foreground mt-0.5 truncate text-sm">
                    {subjects.profiles?.full_name
                      ? `Taught by ${subjects.profiles.full_name}`
                      : "Teacher not listed"}
                  </p>
                </div>
                <Badge variant="outline" className="font-mono">
                  {subjects.code}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
