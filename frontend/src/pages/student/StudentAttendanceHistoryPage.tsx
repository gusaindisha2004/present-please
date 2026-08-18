import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, ClipboardList } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import { METHOD_ICON, METHOD_LABEL, dateFormatter } from "@/lib/attendance"
import type { AttendanceMethod, Subject } from "@/types/database"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BlobIllustration } from "@/components/illustrations/BlobIllustration"

interface OwnRecord {
  id: string
  is_present: boolean
  confidence: number | null
  attendance_sessions: {
    id: string
    method: AttendanceMethod
    taken_at: string
  }
}

export default function StudentAttendanceHistoryPage() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const { profile } = useAuth()

  const [subject, setSubject] = useState<Subject | null>(null)
  const [records, setRecords] = useState<OwnRecord[] | null>(null)

  useEffect(() => {
    if (!subjectId || !profile) return

    supabase
      .from("subjects")
      .select("*")
      .eq("id", subjectId)
      .single()
      .then(({ data }) => setSubject(data as Subject | null))

    supabase
      .from("attendance_records")
      .select(
        "id, is_present, confidence, attendance_sessions!inner(id, method, taken_at, subject_id)"
      )
      .eq("student_id", profile.id)
      .eq("attendance_sessions.subject_id", subjectId)
      .order("attendance_sessions(taken_at)", { ascending: false })
      .then(({ data, error }) => {
        if (!error) setRecords((data as unknown as OwnRecord[]) ?? [])
      })
  }, [subjectId, profile])

  return (
    <div className="mx-auto max-w-2xl py-8">
      <Link
        to="/s/subjects"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Subjects
      </Link>

      <div className="mt-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Attendance history{subject && ` — ${subject.name}`}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Every attendance session recorded for you in this subject.
        </p>
      </div>

      <div className="mt-8 space-y-3">
        {records === null ? (
          <>
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
          </>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center gap-5 py-12 text-center">
            <BlobIllustration icon={ClipboardList} className="scale-75" />
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                No attendance recorded yet
              </h2>
              <p className="text-muted-foreground mt-1 max-w-sm text-balance">
                Once your teacher takes attendance, your record will show up
                here.
              </p>
            </div>
          </div>
        ) : (
          records.map((record) => {
            const session = record.attendance_sessions
            const MethodIcon = METHOD_ICON[session.method]

            return (
              <Card key={record.id} className="rounded-2xl">
                <CardContent className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      {dateFormatter.format(new Date(session.taken_at))}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline">
                        <MethodIcon className="size-3" />
                        {METHOD_LABEL[session.method]}
                      </Badge>
                      {record.confidence !== null && (
                        <Badge variant="outline" className="text-muted-foreground">
                          {Math.round(record.confidence * 100)}% confidence
                        </Badge>
                      )}
                    </div>
                  </div>
                  {record.is_present ? (
                    <Badge className="bg-success/15 text-success">Present</Badge>
                  ) : (
                    <Badge className="bg-destructive/15 text-destructive">
                      Absent
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
