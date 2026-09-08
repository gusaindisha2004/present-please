import { Camera, ClipboardList, Mic } from "lucide-react"

import type { AttendanceMethod } from "@/types/database"

export const METHOD_ICON: Record<AttendanceMethod, typeof Camera> = {
  face: Camera,
  voice: Mic,
  manual: ClipboardList,
}

export const METHOD_LABEL: Record<AttendanceMethod, string> = {
  face: "Face",
  voice: "Voice",
  manual: "Manual",
}

export const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
})

/** The minimum-attendance line the whole app measures against. */
export const REQUIRED_ATTENDANCE = 75

export function attendanceRate(present: number, total: number): number {
  return total === 0 ? 0 : Math.round((present / total) * 100)
}

// Anything under half is worth flagging outright.
export function rateTone(rate: number): string {
  if (rate >= REQUIRED_ATTENDANCE) return "text-success"
  if (rate >= 50) return "text-warning"
  return "text-destructive"
}

/**
 * A short, human line about where a student stands, to sit beside the cold
 * percentage. Deliberately gentlest where the news is worst: someone below
 * the line already knows it, and doesn't need a joke at their expense.
 */
export function attendanceRemark(rate: number): string {
  if (rate >= 95) return "Practically part of the furniture."
  if (rate >= 85) return "Comfortably clear. Keep it up."
  if (rate >= REQUIRED_ATTENDANCE) return "Just above the line."
  if (rate >= 60) return "Not far off — a few classes will do it."
  if (rate >= 40) return "Worth a course correction this week."
  return "Let's build this back up, one class at a time."
}

/**
 * How many further classes can be missed while staying at or above the
 * requirement. Solves P / (C + x) >= R for the largest whole x.
 * Returns 0 when even one more absence would drop them below.
 */
export function classesCanMiss(
  present: number,
  conducted: number,
  required = REQUIRED_ATTENDANCE
): number {
  if (conducted === 0 || required <= 0) return 0
  const r = required / 100
  return Math.max(0, Math.floor(present / r - conducted))
}

/**
 * How many consecutive future classes must be attended to climb back to the
 * requirement. Solves (P + n) / (C + n) >= R for the smallest whole n.
 * Null when that's unreachable (a 100% requirement you've already missed).
 */
export function classesNeededToReach(
  present: number,
  conducted: number,
  required = REQUIRED_ATTENDANCE
): number | null {
  const r = required / 100
  if (r >= 1) return present === conducted ? 0 : null
  const needed = Math.ceil((r * conducted - present) / (1 - r))
  return Math.max(0, needed)
}
