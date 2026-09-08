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

export function attendanceRate(present: number, total: number): number {
  return total === 0 ? 0 : Math.round((present / total) * 100)
}

// 75% is the usual minimum-attendance line, so it's the healthy cutoff here.
// Anything under half is worth flagging outright.
export function rateTone(rate: number): string {
  if (rate >= 75) return "text-success"
  if (rate >= 50) return "text-warning"
  return "text-destructive"
}
