import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { BookOpen } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import type { Enrollment, SubjectWithTeacher } from "@/types/database"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="text-primary size-5" />
          Your subjects
        </CardTitle>
        <CardDescription>
          The subjects you're enrolled in and who teaches them.
        </CardDescription>
        <CardAction>
          <Button asChild variant="outline" size="sm">
            <Link to="/s/subjects">Manage</Link>
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        {rows === null ? (
          <Skeleton className="h-14 rounded-xl" />
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            You're not enrolled in any subjects yet.
          </p>
        ) : (
          <ol className="divide-border/60 divide-y">
            {/* Rows don't wrap: a long subject name ellipsizes rather than
                shunting its code onto a line of its own. */}
            {rows.map(({ id, subjects }, index) => (
              <li
                key={id}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 items-baseline gap-2.5">
                  {/* min-w rather than a fixed width, so a tenth subject
                      doesn't shunt the names out of alignment. */}
                  <span className="text-muted-foreground min-w-4 shrink-0 text-sm tabular-nums">
                    {index + 1}.
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {subjects.name}
                    </p>
                    <p className="text-muted-foreground mt-0.5 truncate text-sm">
                      {subjects.profiles?.full_name
                        ? `Taught by ${subjects.profiles.full_name}`
                        : "Teacher not listed"}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="font-mono">
                  {subjects.code}
                </Badge>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
