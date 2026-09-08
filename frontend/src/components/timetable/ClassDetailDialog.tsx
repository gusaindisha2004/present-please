import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { CalendarX2, Loader2, MapPin, ScanFace } from "lucide-react"
import { toast } from "sonner"

import { supabase } from "@/lib/supabase"
import {
  CANCEL_REASONS,
  STATUS_CLASS,
  STATUS_LABEL,
  classStart,
  formatTime,
  type ClassStatus,
} from "@/lib/scheduling"
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
  class_date: string
  start_time: string
  end_time: string
  room: string | null
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
}: {
  cls: ClassDetail | null
  onOpenChange: (open: boolean) => void
  onChanged: () => void
}) {
  const navigate = useNavigate()
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const [reason, setReason] = useState("")
  const [saving, setSaving] = useState(false)

  const close = () => {
    setConfirmingCancel(false)
    setReason("")
    onOpenChange(false)
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

  // Attendance is only offered once the class is actually due — a future
  // class shouldn't be markable.
  const canTakeAttendance = cls.status === "pending"
  const canCancel = cls.status === "upcoming"

  return (
    <Dialog open={!!cls} onOpenChange={(next) => !next && close()}>
      <DialogContent>
        {confirmingCancel ? (
          <>
            <DialogHeader>
              <DialogTitle>Cancel class?</DialogTitle>
              <DialogDescription>
                {cls.subjectName} · {dayFormatter.format(classStart(cls))} ·{" "}
                {formatTime(cls.start_time)} · Section {cls.subjectSection}
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
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{cls.subjectName}</DialogTitle>
              <DialogDescription>
                {cls.subjectCode} · Section {cls.subjectSection}
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
