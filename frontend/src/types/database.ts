// Hand-written to match supabase/schema.sql. Once the schema is applied to
// the real project, this can be regenerated with the Supabase CLI:
//   supabase gen types typescript --project-id <ref> > src/types/database.ts

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

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      subjects: { Row: Subject; Insert: Partial<Subject>; Update: Partial<Subject> }
      enrollments: { Row: Enrollment; Insert: Partial<Enrollment>; Update: Partial<Enrollment> }
      attendance_sessions: {
        Row: AttendanceSession
        Insert: Partial<AttendanceSession>
        Update: Partial<AttendanceSession>
      }
      attendance_records: {
        Row: AttendanceRecord
        Insert: Partial<AttendanceRecord>
        Update: Partial<AttendanceRecord>
      }
    }
  }
}
