import { useCallback, useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import { classStart, deriveStatus, type ClassStatus } from "@/lib/scheduling"
import type { ScheduledClass, Subject } from "@/types/database"

export type SubjectWithCount = Subject & { enrollments: { count: number }[] }

export interface ClassView {
  id: string
  subject_id: string
  class_date: string
  start_time: string
  end_time: string
  room: string | null
  cancel_reason: string | null
  status: ClassStatus
  start: Date
  subject: SubjectWithCount
}

export interface SubjectStats {
  /** Classes that actually happened — cancelled ones are excluded. */
  conducted: number
  completed: number
  pending: number
  rate: number
  presentRecords: number
  totalRecords: number
  nextClass: ClassView | null
}

/**
 * One place that assembles the teacher's whole picture: subjects, the
 * classes scheduled for them, and which of those actually had attendance
 * taken. Every teacher screen derives what it needs from this rather than
 * re-querying (and risking a different answer on each page).
 */
export function useTeacherSchedule() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [subjects, setSubjects] = useState<SubjectWithCount[]>([])
  const [classes, setClasses] = useState<ClassView[]>([])
  const [statsBySubject, setStatsBySubject] = useState<
    Record<string, SubjectStats>
  >({})

  const load = useCallback(async () => {
    if (!profile) return
    setLoading(true)

    const { data: subjectRows } = await supabase
      .from("subjects")
      .select("*, enrollments(count)")
      .eq("teacher_id", profile.id)
      .order("created_at", { ascending: false })

    const subjectList = (subjectRows as SubjectWithCount[] | null) ?? []
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
        supabase
          .from("attendance_records")
          .select("is_present, attendance_sessions!inner(subject_id)")
          .in("attendance_sessions.subject_id", subjectIds),
      ])

    const sessions =
      (sessionRows as { subject_id: string; scheduled_class_id: string | null }[]) ??
      []
    // A class is "completed" precisely when an attendance session points at
    // it — not when its time has passed.
    const completedClassIds = new Set(
      sessions.map((s) => s.scheduled_class_id).filter(Boolean) as string[]
    )

    const subjectById = new Map(subjectList.map((s) => [s.id, s]))
    const now = new Date()

    const classList: ClassView[] = ((classRows as ScheduledClass[] | null) ?? [])
      .map((row) => ({
        id: row.id,
        subject_id: row.subject_id,
        class_date: row.class_date,
        start_time: row.start_time,
        end_time: row.end_time,
        room: row.room,
        cancel_reason: row.cancel_reason,
        status: deriveStatus(row, completedClassIds.has(row.id), now),
        start: classStart(row),
        subject: subjectById.get(row.subject_id)!,
      }))
      .filter((c) => c.subject)
      .sort((a, b) => a.start.getTime() - b.start.getTime())

    // Attendance rate per subject, from the records themselves.
    const records =
      (recordRows as unknown as {
        is_present: boolean
        attendance_sessions: { subject_id: string }
      }[]) ?? []

    const stats: Record<string, SubjectStats> = {}
    for (const subject of subjectList) {
      const own = classList.filter((c) => c.subject_id === subject.id)
      const subjectRecords = records.filter(
        (r) => r.attendance_sessions?.subject_id === subject.id
      )
      const presentRecords = subjectRecords.filter((r) => r.is_present).length
      const completed = own.filter((c) => c.status === "completed").length
      const pending = own.filter((c) => c.status === "pending").length

      stats[subject.id] = {
        // Cancelled classes never count as conducted.
        conducted: completed,
        completed,
        pending,
        presentRecords,
        totalRecords: subjectRecords.length,
        rate:
          subjectRecords.length === 0
            ? 0
            : Math.round((presentRecords / subjectRecords.length) * 100),
        nextClass:
          own.find((c) => c.status === "upcoming" && c.start >= now) ?? null,
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

  return { loading, subjects, classes, statsBySubject, reload: load }
}
