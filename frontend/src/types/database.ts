// Row shapes matching supabase/schema.sql, used for manual annotations at
// each Supabase query call site (see src/lib/supabase.ts for why we don't
// pass these through createClient<Database>()).

export type Role = "teacher" | "student"
export type AttendanceMethod = "face" | "voice" | "manual"

export interface Profile {
  id: string
  role: Role
  full_name: string
  email: string
  roll_number: string | null
  avatar_url: string | null
  created_at: string
}

export interface Subject {
  id: string
  teacher_id: string
  code: string
  name: string
  section: string
  join_code: string
  created_at: string
}

export interface Enrollment {
  id: string
  subject_id: string
  student_id: string
  created_at: string
}

export interface AttendanceSession {
  id: string
  subject_id: string
  taken_by: string
  method: AttendanceMethod
  taken_at: string
  note: string | null
  scheduled_class_id: string | null
}

// A recurring weekly slot: "Operating System, Mondays 9–10, Lab 3".
// Which group of students sits in the room. Stored per timetable slot,
// because one subject can be taught to several branches/years.
export type Branch = "CSE" | "ECE" | "AIML" | "AIDS" | "IIOT"
export type YearOfStudy = 1 | 2 | 3 | 4

export interface TimetableSlot {
  id: string
  subject_id: string
  day_of_week: number // 0 = Sunday
  start_time: string // "09:00:00"
  end_time: string
  room: string | null
  branch: Branch | null
  year: YearOfStudy | null
  created_at: string
}

// One concrete occurrence of a slot on one date. Only scheduled/cancelled
// is stored — upcoming/pending/completed are derived (see lib/scheduling).
export interface ScheduledClass {
  id: string
  subject_id: string
  slot_id: string | null
  class_date: string // "2026-09-14"
  start_time: string
  end_time: string
  room: string | null
  branch: Branch | null
  year: YearOfStudy | null
  status: "scheduled" | "cancelled"
  cancel_reason: string | null
  created_at: string
}

export interface AttendanceRecord {
  id: string
  session_id: string
  student_id: string
  is_present: boolean
  detected_by: AttendanceMethod | null
  confidence: number | null
}
