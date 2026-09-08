import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  CalendarX2,
  Loader2,
  MapPin,
  Pencil,
  ScanFace,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { supabase } from "@/lib/supabase"
import {
  ATTENDANCE_WINDOW_HOURS,
  CANCEL_REASONS,
  WEEKDAYS,
  groupLabel,
  STATUS_CLASS,
  STATUS_LABEL,
  classStart,
  formatTime,
  isAttendanceOpen,
  type ClassStatus,
} from "@/lib/scheduling"
import type { Branch, YearOfStudy } from "@/types/database"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface ClassDetail {
  id: string
  subject_id: string
  /** The weekly slot this class came from — null for an ad-hoc class. */
  slot_id: string | null
  class_date: string
  start_time: string
  end_time: string
  room: string | null
  branch: Branch | null
  year: YearOfStudy | null
  cancel_reason: string | null
  status: ClassStatus
  subjectName: string
  subjectCode: string
  subjectSection: string
}

const dayFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  day: "numeric",
  month: "long",
})

export function ClassDetailDialog({
  cls,
  onOpenChange,
  onChanged,
  onEditSeries,
}: {
  cls: ClassDetail | null
  onOpenChange: (open: boolean) => void
  onChanged: () => void
  /** Provided by screens that can edit the timetable; omit to hide the
   *  weekly-series actions entirely. */
  onEditSeries?: () => void
}) {
  const navigate = useNavigate()
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [reason, setReason] = useState("")
  const [saving, setSaving] = useState(false)

  const close = () => {
    setConfirmingCancel(false)
    setConfirmingDelete(false)
    setReason("")
    onOpenChange(false)
  }

  /**
   * Remove the weekly class and every one of its dates that never had
   * attendance taken. Classes that were actually conducted are kept — they
   * simply stop belonging to a series — so no attendance record is ever
   * destroyed by tidying up a timetable.
   */
  const handleDeleteSeries = async () => {
    if (!cls?.slot_id) return
    setSaving(true)

    const { data: occRows, error: occError } = await supabase
      .from("scheduled_classes")
      .select("id")
      .eq("slot_id", cls.slot_id)

    if (occError) {
      setSaving(false)
      toast.error("Couldn't remove the class")
      return
    }

    const occIds = ((occRows as { id: string }[] | null) ?? []).map((o) => o.id)

    const { data: sessionRows } = occIds.length
      ? await supabase
          .from("attendance_sessions")
          .select("scheduled_class_id")
          .in("scheduled_class_id", occIds)
      : { data: [] }

    const taken = new Set(
      ((sessionRows as { scheduled_class_id: string }[] | null) ?? []).map(
        (s) => s.scheduled_class_id
      )
    )
    const removable = occIds.filter((id) => !taken.has(id))

    if (removable.length) {
      const { error } = await supabase
        .from("scheduled_classes")
        .delete()
        .in("id", removable)
      if (error) {
        setSaving(false)
        toast.error("Couldn't remove the scheduled dates")
        return
      }
    }

    const { error } = await supabase
      .from("timetable_slots")
      .delete()
      .eq("id", cls.slot_id)

    setSaving(false)

    if (error) {
      toast.error("Couldn't remove the class from your timetable")
      return
    }

    toast.success("Removed from your timetable", {
      description: taken.size
        ? `${taken.size} class${taken.size === 1 ? "" : "es"} with attendance already taken ${taken.size === 1 ? "was" : "were"} kept.`
        : "All of its scheduled dates were removed.",
    })
    close()
    onChanged()
  }

  const handleCancel = async () => {
    if (!cls) return
    setSaving(true)

    const { error } = await supabase
      .from("scheduled_classes")
      .update({ status: "cancelled", cancel_reason: reason || null })
      .eq("id", cls.id)

    setSaving(false)

    if (error) {
      toast.error("Couldn't cancel the class")
      return
    }

    toast.success("Class cancelled", {
      description: "It stays on your timetable and won't count towards attendance.",
    })
    close()
    onChanged()
  }

  if (!cls) return null

  // Attendance is offered from the moment the class starts until a day
  // after it ends — a future class shouldn't be markable, and a class from
  // weeks ago shouldn't still be quietly markable either.
  const canTakeAttendance = isAttendanceOpen(cls, cls.status)
  const windowClosed = cls.status === "pending" && !canTakeAttendance
  // A class already under way can still be called off — someone deciding at
  // five past that nobody turned up is exactly when this gets used.
  const canCancel = cls.status === "upcoming" || cls.status === "in_progress"

  return (
    <Dialog open={!!cls} onOpenChange={(next) => !next && close()}>
      <DialogContent>
        {confirmingCancel ? (
          <>
            <DialogHeader>
              <DialogTitle>Cancel class?</DialogTitle>
              <DialogDescription>
                {[
                  cls.subjectName,
                  groupLabel(cls.branch, cls.year),
                  dayFormatter.format(classStart(cls)),
                  formatTime(cls.start_time),
                  `Section ${cls.subjectSection}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-2">
              <Label>Reason (optional)</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="No reason given" />
                </SelectTrigger>
                <SelectContent>
                  {CANCEL_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-sm">
                The class stays visible on your timetable, marked cancelled.
                It won't count as a conducted class or affect attendance.
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmingCancel(false)}
                disabled={saving}
              >
                Keep class
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={saving}
              >
                {saving && <Loader2 className="animate-spin" />}
                Cancel class
              </Button>
            </DialogFooter>
          </>
        ) : confirmingDelete ? (
          <>
            <DialogHeader>
              <DialogTitle>Remove this weekly class?</DialogTitle>
              <DialogDescription>
                {[
                  cls.subjectName,
                  groupLabel(cls.branch, cls.year),
                  `${WEEKDAYS[classStart(cls).getDay()]}s`,
                  formatTime(cls.start_time),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </DialogDescription>
            </DialogHeader>

            <p className="text-muted-foreground text-sm">
              This takes the class off your timetable and removes every date
              that never had attendance taken. Classes you already marked are
              kept, along with their attendance records.
            </p>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmingDelete(false)}
                disabled={saving}
              >
                Keep it
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteSeries}
                disabled={saving}
              >
                {saving && <Loader2 className="animate-spin" />}
                Remove class
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{cls.subjectName}</DialogTitle>
              <DialogDescription>
                {[
                  cls.subjectCode,
                  groupLabel(cls.branch, cls.year),
                  `Section ${cls.subjectSection}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={STATUS_CLASS[cls.status]}>
                  {STATUS_LABEL[cls.status]}
                </Badge>
                {cls.room && (
                  <Badge variant="outline">
                    <MapPin className="size-3" />
                    {cls.room}
                  </Badge>
                )}
              </div>

              <p className="text-sm">
                {dayFormatter.format(classStart(cls))}
                <span className="text-muted-foreground">
                  {" · "}
                  {formatTime(cls.start_time)} – {formatTime(cls.end_time)}
                </span>
              </p>

              {cls.status === "cancelled" && cls.cancel_reason && (
                <p className="text-muted-foreground text-sm">
                  Reason: {cls.cancel_reason}
                </p>
              )}

              {cls.status === "upcoming" && (
                <p className="text-muted-foreground text-sm">
                  Attendance can be taken once the class has started.
                </p>
              )}

              {windowClosed && (
                <p className="text-muted-foreground text-sm">
                  {`Attendance was never taken, and the ${ATTENDANCE_WINDOW_HOURS}-hour window for marking it has closed.`}
                </p>
              )}

              {cls.slot_id && onEditSeries && (
                <div className="flex flex-wrap items-center gap-1 border-t pt-3">
                  <p className="text-muted-foreground mr-auto text-xs">
                    Repeats weekly
                  </p>
                  <Button variant="ghost" size="sm" onClick={onEditSeries}>
                    <Pencil />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setConfirmingDelete(true)}
                  >
                    <Trash2 />
                    Remove
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter>
              {canCancel && (
                <Button
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setConfirmingCancel(true)}
                >
                  <CalendarX2 />
                  Cancel class
                </Button>
              )}
              {canTakeAttendance && (
                <Button
                  onClick={() =>
                    navigate(`/t/attendance/${cls.subject_id}?classId=${cls.id}`)
                  }
                >
                  <ScanFace />
                  Take attendance
                </Button>
              )}
              {cls.status === "completed" && (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/t/subjects/${cls.subject_id}/classes`)}
                >
                  View attendance
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
