import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Download,
} from "lucide-react"

import { supabase } from "@/lib/supabase"
import { METHOD_ICON, METHOD_LABEL, dateFormatter } from "@/lib/attendance"
import type { AttendanceMethod, Subject } from "@/types/database"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BlobIllustration } from "@/components/illustrations/BlobIllustration"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface SessionRecord {
  id: string
  student_id: string
  is_present: boolean
  detected_by: AttendanceMethod | null
  confidence: number | null
  profiles: { full_name: string } | null
}

interface Session {
  id: string
  method: AttendanceMethod
  taken_at: string
  note: string | null
  attendance_records: SessionRecord[]
}

function csvField(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function downloadSessionCsv(session: Session, subject: Subject | null) {
  const rows = [...session.attendance_records]
    .sort((a, b) =>
      (a.profiles?.full_name ?? "").localeCompare(b.profiles?.full_name ?? "")
    )
    .map((record) => [
      record.profiles?.full_name ?? "Unknown",
      record.is_present ? "Present" : "Absent",
      record.confidence !== null ? `${Math.round(record.confidence * 100)}%` : "",
    ])

  const csv = [["Student", "Status", "Confidence"], ...rows]
    .map((row) => row.map(csvField).join(","))
    .join("\n")

  const dateSlug = session.taken_at.slice(0, 10)
  const subjectSlug = (subject?.code ?? "attendance").replace(/[^a-z0-9]+/gi, "-")
  const filename = `${subjectSlug}-${dateSlug}.csv`

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function TeacherAttendanceHistoryPage() {
  const { subjectId } = useParams<{ subjectId: string }>()

  const [subject, setSubject] = useState<Subject | null>(null)
  const [sessions, setSessions] = useState<Session[] | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (!subjectId) return

    supabase
      .from("subjects")
      .select("*")
      .eq("id", subjectId)
      .single()
      .then(({ data }) => setSubject(data as Subject | null))

    supabase
      .from("attendance_sessions")
      .select(
        "id, method, taken_at, note, attendance_records(id, student_id, is_present, detected_by, confidence, profiles(full_name))"
      )
      .eq("subject_id", subjectId)
      .order("taken_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error) setSessions((data as unknown as Session[]) ?? [])
      })
  }, [subjectId])

  return (
    <div className="mx-auto max-w-3xl py-8">
      <Link
        to="/t/subjects"
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
          Every attendance session taken for this subject.
        </p>
      </div>

      <div className="mt-8 space-y-3">
        {sessions === null ? (
          <>
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
          </>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center gap-5 py-12 text-center">
            <BlobIllustration icon={ClipboardList} className="scale-75" />
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                No attendance taken yet
              </h2>
              <p className="text-muted-foreground mt-1 max-w-sm text-balance">
                Sessions you save from Take Attendance will show up here.
              </p>
            </div>
          </div>
        ) : (
          sessions.map((session) => {
            const presentCount = session.attendance_records.filter(
              (r) => r.is_present
            ).length
            const absentCount = session.attendance_records.length - presentCount
            const expanded = expandedId === session.id
            const MethodIcon = METHOD_ICON[session.method]

            const sortedRecords = [...session.attendance_records].sort((a, b) =>
              (a.profiles?.full_name ?? "").localeCompare(b.profiles?.full_name ?? "")
            )

            return (
              <Card key={session.id} className="rounded-2xl">
                <CardContent>
                  <div className="flex w-full flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : session.id)}
                      className="flex flex-1 items-center gap-3 text-left"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {dateFormatter.format(new Date(session.taken_at))}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline">
                            <MethodIcon className="size-3" />
                            {METHOD_LABEL[session.method]}
                          </Badge>
                          <Badge className="bg-success/15 text-success">
                            {presentCount} present
                          </Badge>
                          <Badge className="bg-destructive/15 text-destructive">
                            {absentCount} absent
                          </Badge>
                        </div>
                      </div>
                      {expanded ? (
                        <ChevronUp className="text-muted-foreground size-4 shrink-0" />
                      ) : (
                        <ChevronDown className="text-muted-foreground size-4 shrink-0" />
                      )}
                    </button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadSessionCsv(session, subject)}
                    >
                      <Download />
                      Export CSV
                    </Button>
                  </div>

                  {expanded && (
                    <div className="mt-4 rounded-xl border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Confidence</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedRecords.map((record) => (
                            <TableRow key={record.id}>
                              <TableCell className="font-medium">
                                {record.profiles?.full_name ?? "Unknown"}
                              </TableCell>
                              <TableCell>
                                {record.is_present ? (
                                  <span className="text-success">Present</span>
                                ) : (
                                  <span className="text-destructive">Absent</span>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {record.confidence !== null
                                  ? `${Math.round(record.confidence * 100)}%`
                                  : "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
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
