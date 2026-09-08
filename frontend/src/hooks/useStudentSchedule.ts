import { useCallback, useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import { attendanceRate } from "@/lib/attendance"
import { classStart, deriveStatus } from "@/lib/scheduling"
import type {
  Enrollment,
  ScheduledClass,
  SubjectWithTeacher,
} from "@/types/database"

/**
 * What a class looks like from the student's side. "completed" splits into
 * present/absent, because for a student that's the only thing that matters —
 * but "pending" stays distinct so a class the teacher hasn't marked yet is
 * never shown as an absence.
 */
export type StudentClassStatus =
  | "upcoming"
  | "in_progress"
  | "pending"
  | "present"
  | "absent"
  | "cancelled"
  | "not-recorded"

export const STUDENT_STATUS_LABEL: Record<StudentClassStatus, string> = {
  upcoming: "Upcoming",
  in_progress: "In progress",
  pending: "Attendance pending",
  present: "Present",
  absent: "Absent",
  cancelled: "Cancelled",
  "not-recorded": "Not recorded",
}

export const STUDENT_STATUS_CLASS: Record<StudentClassStatus, string> = {
  upcoming: "bg-accent text-accent-foreground",
  in_progress: "bg-primary/10 text-primary",
  pending: "bg-warning/15 text-warning",
  present: "bg-success/15 text-success",
  absent: "bg-destructive/15 text-destructive",
  cancelled: "bg-muted text-muted-foreground line-through",
  "not-recorded": "bg-muted text-muted-foreground",
}

export interface StudentClassView {
  id: string
  subject_id: string
  class_date: string
  start_time: string
  end_time: string
  room: string | null
  cancel_reason: string | null
  status: StudentClassStatus
  start: Date
  subject: SubjectWithTeacher
}

export interface StudentSubjectStats {
  present: number
  absent: number
  /** Classes that actually counted: cancelled and upcoming never do. */
  conducted: number
  rate: number
  nextClass: StudentClassView | null
}

export function useStudentSchedule() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [subjects, setSubjects] = useState<SubjectWithTeacher[]>([])
  const [classes, setClasses] = useState<StudentClassView[]>([])
  const [statsBySubject, setStatsBySubject] = useState<
    Record<string, StudentSubjectStats>
  >({})

  const load = useCallback(async () => {
    if (!profile) return
    setLoading(true)

    const { data: enrolmentRows } = await supabase
      .from("enrollments")
      .select("*, subjects(*, profiles(full_name))")
      .eq("student_id", profile.id)

    const enrolments =
      (enrolmentRows as (Enrollment & { subjects: SubjectWithTeacher })[] | null) ??
      []
    const subjectList = enrolments.map((e) => e.subjects).filter(Boolean)
    const subjectIds = subjectList.map((s) => s.id)

    if (subjectIds.length === 0) {
      setSubjects([])
      setClasses([])
      setStatsBySubject({})
      setLoading(false)
      return
    }

    const [{ data: classRows }, { data: sessionRows }, { data: recordRows }] =
      await Promise.all([
        supabase
          .from("scheduled_classes")
          .select("*")
          .in("subject_id", subjectIds),
        supabase
          .from("attendance_sessions")
          .select("id, subject_id, scheduled_class_id")
          .in("subject_id", subjectIds),
        // RLS limits this to the student's own records.
        supabase
          .from("attendance_records")
          .select("session_id, is_present")
          .eq("student_id", profile.id),
      ])

    const sessions =
      (sessionRows as {
        id: string
        subject_id: string
        scheduled_class_id: string | null
      }[]) ?? []
    const records =
      (recordRows as { session_id: string; is_present: boolean }[]) ?? []

    const myRecordBySession = new Map(
      records.map((r) => [r.session_id, r.is_present])
    )
    const sessionByClassId = new Map(
      sessions
        .filter((s) => s.scheduled_class_id)
        .map((s) => [s.scheduled_class_id as string, s])
    )

    const subjectById = new Map(subjectList.map((s) => [s.id, s]))
    const now = new Date()

    const classList: StudentClassView[] = (
      (classRows as ScheduledClass[] | null) ?? []
    )
      .map((row) => {
        const session = sessionByClassId.get(row.id) ?? null
        const base = deriveStatus(row, !!session, now)

        let status: StudentClassStatus
        if (
          base === "cancelled" ||
          base === "upcoming" ||
          base === "in_progress" ||
          base === "pending"
        ) {
          status = base
        } else if (session && myRecordBySession.has(session.id)) {
          status = myRecordBySession.get(session.id) ? "present" : "absent"
        } else {
          // Attendance was taken, but this student wasn't on the roster —
          // e.g. they enrolled after the class ran. Not an absence.
          status = "not-recorded"
        }

        return {
          id: row.id,
          subject_id: row.subject_id,
          class_date: row.class_date,
          start_time: row.start_time,
          end_time: row.end_time,
          room: row.room,
          cancel_reason: row.cancel_reason,
          status,
          start: classStart(row),
          subject: subjectById.get(row.subject_id)!,
        }
      })
      .filter((c) => c.subject)
      .sort((a, b) => a.start.getTime() - b.start.getTime())

    // Counts come from the student's own records, so cancelled, upcoming and
    // not-yet-marked classes are excluded without any special-casing.
    const sessionSubject = new Map(sessions.map((s) => [s.id, s.subject_id]))
    const stats: Record<string, StudentSubjectStats> = {}

    for (const subject of subjectList) {
      const own = records.filter(
        (r) => sessionSubject.get(r.session_id) === subject.id
      )
      const present = own.filter((r) => r.is_present).length
      stats[subject.id] = {
        present,
        absent: own.length - present,
        conducted: own.length,
        rate: attendanceRate(present, own.length),
        nextClass:
          classList.find(
            (c) =>
              c.subject_id === subject.id &&
              c.status === "upcoming" &&
              c.start >= now
          ) ?? null,
      }
    }

    setSubjects(subjectList)
    setClasses(classList)
    setStatsBySubject(stats)
    setLoading(false)
  }, [profile])

  useEffect(() => {
    load()
  }, [load])

  const totals = Object.values(statsBySubject).reduce(
    (acc, s) => ({
      present: acc.present + s.present,
      conducted: acc.conducted + s.conducted,
    }),
    { present: 0, conducted: 0 }
  )

  return {
    loading,
    subjects,
    classes,
    statsBySubject,
    overall: {
      ...totals,
      rate: attendanceRate(totals.present, totals.conducted),
    },
    reload: load,
  }
}
