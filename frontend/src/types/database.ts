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
}

export interface AttendanceRecord {
  id: string
  session_id: string
  student_id: string
  is_present: boolean
  detected_by: AttendanceMethod | null
  confidence: number | null
}
