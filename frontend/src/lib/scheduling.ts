import type {
  Branch,
  ScheduledClass,
  TimetableSlot,
  YearOfStudy,
} from "@/types/database"

// Upcoming / pending / completed are never stored — they're a function of
// the clock and of whether attendance was actually taken. Only "cancelled"
// is a real stored decision. Deriving the rest here keeps every screen
// agreeing with itself and with reality.
export type ClassStatus =
  | "upcoming"
  | "in_progress"
  | "pending"
  | "completed"
  | "cancelled"

export const STATUS_LABEL: Record<ClassStatus, string> = {
  upcoming: "Upcoming",
  in_progress: "In progress",
  pending: "Attendance pending",
  completed: "Completed",
  cancelled: "Cancelled",
}

// Subtle, not shouty — matches the existing badge treatment elsewhere.
export const STATUS_CLASS: Record<ClassStatus, string> = {
  upcoming: "bg-accent text-accent-foreground",
  in_progress: "bg-primary/10 text-primary",
  pending: "bg-warning/15 text-warning",
  completed: "bg-success/15 text-success",
  cancelled: "bg-muted text-muted-foreground line-through",
}

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]

export const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

// The groups a teacher schedules for. Kept beside the other timetable
// vocabulary so every screen offers and labels them the same way.
export const BRANCHES: Branch[] = ["CSE", "ECE", "AIML", "AIDS", "IIOT"]

export const YEARS: YearOfStudy[] = [1, 2, 3, 4]

export const YEAR_LABEL: Record<YearOfStudy, string> = {
  1: "1st year",
  2: "2nd year",
  3: "3rd year",
  4: "4th year",
}

/** "CSE · 2nd year", or just whichever half is set. Empty if neither is. */
export function groupLabel(
  branch: Branch | null,
  year: YearOfStudy | null
): string {
  return [branch, year ? YEAR_LABEL[year] : null].filter(Boolean).join(" · ")
}

/** Timetable times are wall-clock local, so build a local Date (no "Z"). */
export function classStart(cls: {
  class_date: string
  start_time: string
}): Date {
  return new Date(`${cls.class_date}T${cls.start_time}`)
}

export function classEnd(cls: { class_date: string; end_time: string }): Date {
  return new Date(`${cls.class_date}T${cls.end_time}`)
}

export function deriveStatus(
  cls: Pick<ScheduledClass, "class_date" | "start_time" | "end_time" | "status">,
  hasSession: boolean,
  now: Date = new Date()
): ClassStatus {
  if (cls.status === "cancelled") return "cancelled"
  if (hasSession) return "completed"
  if (now < classStart(cls)) return "upcoming"
  // Between the bells. Worth its own status: a class happening right now is
  // neither still upcoming nor yet overdue, and it is the moment attendance
  // is most likely to be taken.
  if (now <= classEnd(cls)) return "in_progress"
  // The end time has passed and nobody took attendance, so it's pending —
  // surfaced, never silently hidden.
  return "pending"
}

/** How long after a class ends attendance can still be taken. */
export const ATTENDANCE_WINDOW_HOURS = 24

/**
 * Attendance opens when the class starts and stays open for a day after it
 * ends — long enough to mark a class you were too busy to mark in the room,
 * without leaving every past class markable forever.
 *
 * Deliberately separate from deriveStatus: whether you *can* mark a class is
 * a different question from what the class *is*, and a class whose window has
 * closed unmarked is still "attendance pending", never "absent".
 */
export function isAttendanceOpen(
  cls: Pick<ScheduledClass, "class_date" | "start_time" | "end_time">,
  status: ClassStatus,
  now: Date = new Date()
): boolean {
  if (status === "cancelled" || status === "completed") return false
  const closesAt = new Date(
    classEnd(cls).getTime() + ATTENDANCE_WINDOW_HOURS * 60 * 60 * 1000
  )
  return classStart(cls) <= now && now <= closesAt
}

/** "09:00:00" -> "9:00 AM" */
export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number)
  const date = new Date()
  date.setHours(h, m, 0, 0)
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })
}

export function toDateKey(date: Date): string {
  // Local YYYY-MM-DD; toISOString() would shift across the date line.
  const m = `${date.getMonth() + 1}`.padStart(2, "0")
  const d = `${date.getDate()}`.padStart(2, "0")
  return `${date.getFullYear()}-${m}-${d}`
}

/** Sunday-based start of the week containing `date`. */
export function startOfWeek(date: Date): Date {
  const out = new Date(date)
  out.setDate(out.getDate() - out.getDay())
  out.setHours(0, 0, 0, 0)
  return out
}

export function addDays(date: Date, days: number): Date {
  const out = new Date(date)
  out.setDate(out.getDate() + days)
  return out
}

/**
 * Concrete dates for a slot over a rolling horizon. Occurrences have to be
 * real rows — you can't cancel, or attach attendance to, a row that only
 * exists as a computed guess.
 */
export function occurrenceDates(
  slot: Pick<TimetableSlot, "day_of_week">,
  weeks: number,
  from: Date = new Date()
): string[] {
  const dates: string[] = []
  const cursor = new Date(from)
  cursor.setHours(0, 0, 0, 0)
  // step forward to the first matching weekday (today counts)
  while (cursor.getDay() !== slot.day_of_week) cursor.setDate(cursor.getDate() + 1)

  for (let i = 0; i < weeks; i++) {
    dates.push(toDateKey(cursor))
    cursor.setDate(cursor.getDate() + 7)
  }
  return dates
}

export const OCCURRENCE_HORIZON_WEEKS = 12

export const CANCEL_REASONS = [
  "Faculty unavailable",
  "Holiday / event",
  "Room unavailable",
  "Other",
]
