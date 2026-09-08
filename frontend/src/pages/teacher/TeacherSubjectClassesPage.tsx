import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import {
  ArrowLeft,
  CalendarRange,
  ChevronDown,
  ChevronUp,
  Download,
  ScanFace,
} from "lucide-react"

import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import { attendanceRate, rateTone } from "@/lib/attendance"
import {
  STATUS_CLASS,
  STATUS_LABEL,
  classStart,
  deriveStatus,
  formatTime,
  groupLabel,
  type ClassStatus,
} from "@/lib/scheduling"
import type { AttendanceMethod, ScheduledClass, Subject } from "@/types/database"
import { BlobIllustration } from "@/components/illustrations/BlobIllustration"
import {
  ClassDetailDialog,
  type ClassDetail,
} from "@/components/timetable/ClassDetailDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
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
  confidence: number | null
  profiles: { full_name: string } | null
}

interface Session {
  id: string
  method: AttendanceMethod
  taken_at: string
  scheduled_class_id: string | null
  attendance_records: SessionRecord[]
}

/** A class the teacher can see: a scheduled one, or an ad-hoc session. */
interface Row {
  key: string
  scheduled: ScheduledClass | null
  session: Session | null
  status: ClassStatus
  when: Date
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  day: "numeric",
  month: "short",
})

function csvField(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function downloadCsv(session: Session, subject: Subject | null, when: Date) {
  const rows = [...session.attendance_records]
    .sort((a, b) =>
      (a.profiles?.full_name ?? "").localeCompare(b.profiles?.full_name ?? "")
    )
    .map((r) => [
      r.profiles?.full_name ?? "Unknown",
      r.is_present ? "Present" : "Absent",
      r.confidence !== null ? `${Math.round(r.confidence * 100)}%` : "",
    ])

  const csv = [["Student", "Status", "Confidence"], ...rows]
    .map((row) => row.map(csvField).join(","))
    .join("\n")

  const slug = (subject?.code ?? "attendance").replace(/[^a-z0-9]+/gi, "-")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${slug}-${when.toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export default function TeacherSubjectClassesPage() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const { profile } = useAuth()

  const [subject, setSubject] = useState<Subject | null>(null)
  const [scheduled, setScheduled] = useState<ScheduledClass[] | null>(null)
  const [sessions, setSessions] = useState<Session[] | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selected, setSelected] = useState<ClassDetail | null>(null)

  const load = async () => {
    if (!subjectId) return

    const [{ data: sub }, { data: cls }, { data: sess }] = await Promise.all([
      supabase.from("subjects").select("*").eq("id", subjectId).maybeSingle(),
      supabase.from("scheduled_classes").select("*").eq("subject_id", subjectId),
      supabase
        .from("attendance_sessions")
        .select(
          "id, method, taken_at, scheduled_class_id, attendance_records(id, student_id, is_present, confidence, profiles(full_name))"
        )
        .eq("subject_id", subjectId),
    ])

    setSubject((sub as Subject | null) ?? null)
    setScheduled((cls as ScheduledClass[] | null) ?? [])
    setSessions((sess as unknown as Session[] | null) ?? [])
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, profile])

  const loading = scheduled === null || sessions === null

  const sessionByClassId = new Map(
    (sessions ?? [])
      .filter((s) => s.scheduled_class_id)
      .map((s) => [s.scheduled_class_id as string, s])
  )

  const now = new Date()

  const allRows: Row[] = [
    ...(scheduled ?? []).map((cls) => {
      const session = sessionByClassId.get(cls.id) ?? null
      return {
        key: cls.id,
        scheduled: cls,
        session,
        status: deriveStatus(cls, !!session, now),
        when: classStart(cls),
      }
    }),
    // Attendance taken without a timetable entry still belongs here.
    ...(sessions ?? [])
      .filter((s) => !s.scheduled_class_id)
      .map((s) => ({
        key: s.id,
        scheduled: null,
        session: s,
        status: "completed" as ClassStatus,
        when: new Date(s.taken_at),
      })),
  ]

  // Split rather than one long list: a term's worth of future classes
  // sorted newest-first would bury what just happened. Soonest upcoming
  // first, then the most recent past class at the top of its own group.
  const upcomingRows = allRows
    .filter((r) => r.when > now && r.status !== "pending")
    .sort((a, b) => a.when.getTime() - b.when.getTime())
  const pastRows = allRows
    .filter((r) => !(r.when > now && r.status !== "pending"))
    .sort((a, b) => b.when.getTime() - a.when.getTime())

  // Attendance rate ignores cancelled classes by construction: they never
  // have a session, so they contribute no records.
  const allRecords = (sessions ?? []).flatMap((s) => s.attendance_records)
  const presentCount = allRecords.filter((r) => r.is_present).length
  const overallRate = attendanceRate(presentCount, allRecords.length)
  const conducted = allRows.filter((r) => r.status === "completed").length

  const perStudent = (() => {
    const map = new Map<string, { name: string; present: number; total: number }>()
    for (const session of sessions ?? []) {
      for (const record of session.attendance_records) {
        const entry = map.get(record.student_id) ?? {
          name: record.profiles?.full_name ?? "Unknown",
          present: 0,
          total: 0,
        }
        entry.total += 1
        if (record.is_present) entry.present += 1
        map.set(record.student_id, entry)
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  })()

  const renderRow = (row: Row) => {
          const expanded = expandedId === row.key
          const canExpand = !!row.session

          return (
            <Card key={row.key} className="rounded-2xl">
              <CardContent>
                <div className="flex w-full flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={!canExpand}
                    onClick={() =>
                      canExpand && setExpandedId(expanded ? null : row.key)
                    }
                    className="flex flex-1 items-center gap-3 text-left disabled:cursor-default"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {dateFormatter.format(row.when)}
                        <span className="text-muted-foreground font-normal">
                          {" · "}
                          {row.scheduled
                            ? formatTime(row.scheduled.start_time)
                            : row.when.toLocaleTimeString(undefined, {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                        </span>
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <Badge className={STATUS_CLASS[row.status]}>
                          {STATUS_LABEL[row.status]}
                        </Badge>
                        {row.session && (
                          <Badge className="bg-success/15 text-success">
                            {
                              row.session.attendance_records.filter(
                                (r) => r.is_present
                              ).length
                            }{" "}
                            present
                          </Badge>
                        )}
                        {row.scheduled &&
                          groupLabel(
                            row.scheduled.branch,
                            row.scheduled.year
                          ) && (
                            <Badge variant="outline">
                              {groupLabel(
                                row.scheduled.branch,
                                row.scheduled.year
                              )}
                            </Badge>
                          )}
                        {!row.scheduled && (
                          <Badge variant="outline">Not on timetable</Badge>
                        )}
                        {row.scheduled?.cancel_reason && (
                          <span className="text-muted-foreground text-xs">
                            {row.scheduled.cancel_reason}
                          </span>
                        )}
                      </div>
                    </div>
                    {canExpand &&
                      (expanded ? (
                        <ChevronUp className="text-muted-foreground size-4 shrink-0" />
                      ) : (
                        <ChevronDown className="text-muted-foreground size-4 shrink-0" />
                      ))}
                  </button>

                  <div className="flex items-center gap-2">
                    {row.status === "pending" && row.scheduled && (
                      <Button asChild size="sm">
                        <Link
                          to={`/t/attendance/${row.scheduled.subject_id}?classId=${row.scheduled.id}`}
                        >
                          Take attendance
                        </Link>
                      </Button>
                    )}
                    {row.status === "upcoming" && row.scheduled && subject && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setSelected({
                            id: row.scheduled!.id,
                            subject_id: row.scheduled!.subject_id,
                            slot_id: row.scheduled!.slot_id,
                            class_date: row.scheduled!.class_date,
                            start_time: row.scheduled!.start_time,
                            end_time: row.scheduled!.end_time,
                            room: row.scheduled!.room,
                            branch: row.scheduled!.branch,
                            year: row.scheduled!.year,
                            cancel_reason: row.scheduled!.cancel_reason,
                            status: row.status,
                            subjectName: subject.name,
                            subjectCode: subject.code,
                            subjectSection: subject.section,
                          })
                        }
                      >
                        View
                      </Button>
                    )}
                    {row.session && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          downloadCsv(row.session!, subject, row.when)
                        }
                      >
                        <Download />
                        CSV
                      </Button>
                    )}
                  </div>
                </div>

                {expanded && row.session && (
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
                        {[...row.session.attendance_records]
                          .sort((a, b) =>
                            (a.profiles?.full_name ?? "").localeCompare(
                              b.profiles?.full_name ?? ""
                            )
                          )
                          .map((record) => (
                            <TableRow key={record.id}>
                              <TableCell className="font-medium">
                                {record.profiles?.full_name ?? "Unknown"}
                              </TableCell>
                              <TableCell>
                                {record.is_present ? (
                                  <span className="text-success">Present</span>
                                ) : (
                                  <span className="text-destructive">
                                    Absent
                                  </span>
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
  }

  return (
    <div className="mx-auto max-w-3xl py-8">
      <Link
        to="/t/subjects"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Subjects
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Classes &amp; attendance
            {subject && ` — ${subject.name}`}
          </h1>
          {subject && (
            <p className="text-muted-foreground mt-1 text-sm">
              {subject.code} · Section {subject.section}
            </p>
          )}
        </div>
        {subjectId && (
          <Button asChild size="sm">
            <Link to={`/t/attendance/${subjectId}`}>
              <ScanFace />
              Take attendance
            </Link>
          </Button>
        )}
      </div>

      {!loading && allRecords.length > 0 && (
        <Card className="mt-6 rounded-2xl">
          <CardContent>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-muted-foreground text-sm">Attendance</p>
                <p className="mt-1 text-sm">
                  {conducted} {conducted === 1 ? "class" : "classes"} conducted ·{" "}
                  {presentCount} present · {allRecords.length - presentCount}{" "}
                  absent
                </p>
              </div>
              <p
                className={`text-3xl font-semibold tabular-nums ${rateTone(overallRate)}`}
              >
                {overallRate}%
              </p>
            </div>

            <div className="mt-4 rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Attended</TableHead>
                    <TableHead className="text-right">Attendance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {perStudent.map((student) => {
                    const rate = attendanceRate(student.present, student.total)
                    return (
                      <TableRow key={student.name}>
                        <TableCell className="font-medium">
                          {student.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground tabular-nums">
                          {student.present} / {student.total}
                        </TableCell>
                        <TableCell
                          className={`text-right font-medium tabular-nums ${rateTone(rate)}`}
                        >
                          {rate}%
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <h2 className="mt-8 text-lg font-semibold tracking-tight">Classes</h2>

      {loading ? (
        <div className="mt-3 space-y-3">
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
        </div>
      ) : allRows.length === 0 ? (
        <div className="flex flex-col items-center gap-5 py-12 text-center">
          <BlobIllustration icon={CalendarRange} className="scale-75" />
          <div>
            <h3 className="text-lg font-semibold tracking-tight">
              No classes yet
            </h3>
            <p className="text-muted-foreground mt-1 max-w-sm text-balance">
              Add this subject to your timetable, or take attendance directly.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/t/timetable">Set up timetable</Link>
          </Button>
        </div>
      ) : (
        <>
          {pastRows.length > 0 && (
            <div className="mt-3 space-y-3">{pastRows.map(renderRow)}</div>
          )}

          {upcomingRows.length > 0 && (
            <>
              <h3 className="text-muted-foreground mt-8 text-xs font-medium tracking-wide uppercase">
                Upcoming
              </h3>
              <div className="mt-3 space-y-3">{upcomingRows.map(renderRow)}</div>
            </>
          )}
        </>
      )}

      <ClassDetailDialog
        cls={selected}
        onOpenChange={(open) => !open && setSelected(null)}
        onChanged={load}
      />
    </div>
  )
}
