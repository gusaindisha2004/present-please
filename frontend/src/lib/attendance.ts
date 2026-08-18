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
