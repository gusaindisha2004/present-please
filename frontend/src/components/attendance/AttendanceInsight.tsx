import { Info, TriangleAlert } from "lucide-react"

import {
  REQUIRED_ATTENDANCE,
  classesCanMiss,
  classesNeededToReach,
} from "@/lib/attendance"

/**
 * Turns the numbers into the sentence a student actually wants. Every
 * branch is derived from real counts — when there's nothing conducted yet
 * there's nothing honest to say, so it renders nothing at all.
 */
export function AttendanceInsight({
  present,
  conducted,
  className = "",
}: {
  present: number
  conducted: number
  className?: string
}) {
  if (conducted === 0) return null

  const rate = (present / conducted) * 100
  const meetsRequirement = rate >= REQUIRED_ATTENDANCE

  let message: string
  if (meetsRequirement) {
    const canMiss = classesCanMiss(present, conducted)
    message =
      canMiss > 0
        ? `You're above the ${REQUIRED_ATTENDANCE}% requirement. You can miss ${canMiss} more ${canMiss === 1 ? "class" : "classes"} and stay at or above it.`
        : `You're at the ${REQUIRED_ATTENDANCE}% requirement. Missing even one more class would take you below it.`
  } else {
    const needed = classesNeededToReach(present, conducted)
    message =
      needed === null
        ? `Your attendance is below the ${REQUIRED_ATTENDANCE}% requirement.`
        : `Your attendance is below the ${REQUIRED_ATTENDANCE}% requirement. Attend the next ${needed} ${needed === 1 ? "class" : "classes"} to reach it.`
  }

  const Icon = meetsRequirement ? Info : TriangleAlert

  return (
    <div
      className={`flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-sm ${
        meetsRequirement
          ? "bg-accent text-accent-foreground"
          : "bg-warning/10 text-warning-foreground"
      } ${className}`}
    >
      <Icon
        className={`mt-0.5 size-4 shrink-0 ${meetsRequirement ? "" : "text-warning"}`}
      />
      <div>
        <p>{message}</p>
        <p className="text-muted-foreground mt-0.5">
          You've attended {present} of {conducted}{" "}
          {conducted === 1 ? "class" : "classes"} conducted so far.
        </p>
      </div>
    </div>
  )
}
