import { useEffect, useState } from "react"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import { supabase } from "@/lib/supabase"
import {
  BRANCHES,
  OCCURRENCE_HORIZON_WEEKS,
  WEEKDAYS,
  YEARS,
  YEAR_LABEL,
  occurrenceDates,
} from "@/lib/scheduling"
import type { Branch, Subject, YearOfStudy } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/** The weekly slot behind a class, as the edit form needs it. */
export interface SlotEdit {
  id: string
  subject_id: string
  day_of_week: number
  start_time: string
  end_time: string
  room: string | null
  branch: Branch | null
  year: YearOfStudy | null
}

/** "09:00:00" -> "09:00", which is what <input type="time"> expects. */
const toInputTime = (time: string) => time.slice(0, 5)

/**
 * Add a weekly class, or fix one that was entered wrong.
 *
 * In edit mode the dialog is controlled by the caller (it opens from a
 * class, not from a trigger button) and the subject is fixed — changing it
 * would strand the classes already taken under the old subject, so that is
 * a delete-and-re-add instead.
 */
export function SlotDialog({
  subjects,
  onSaved,
  slot = null,
  open,
  onOpenChange,
}: {
  subjects: Subject[]
  onSaved: () => void
  slot?: SlotEdit | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const editing = slot !== null
  const [selfOpen, setSelfOpen] = useState(false)
  const isOpen = editing ? (open ?? false) : selfOpen
  const setOpen = (next: boolean) => {
    if (editing) onOpenChange?.(next)
    else setSelfOpen(next)
  }

  const [saving, setSaving] = useState(false)
  const [subjectId, setSubjectId] = useState("")
  const [branch, setBranch] = useState("")
  const [year, setYear] = useState("")
  const [day, setDay] = useState("1")
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("10:00")
  const [room, setRoom] = useState("")

  const reset = () => {
    setSubjectId("")
    setBranch("")
    setYear("")
    setDay("1")
    setStartTime("09:00")
    setEndTime("10:00")
    setRoom("")
  }

  // Load the slot being edited into the form whenever it changes.
  useEffect(() => {
    if (!slot) return
    setSubjectId(slot.subject_id)
    setBranch(slot.branch ?? "")
    setYear(slot.year ? String(slot.year) : "")
    setDay(String(slot.day_of_week))
    setStartTime(toInputTime(slot.start_time))
    setEndTime(toInputTime(slot.end_time))
    setRoom(slot.room ?? "")
  }, [slot])

  const slotValues = () => ({
    day_of_week: Number(day),
    start_time: startTime,
    end_time: endTime,
    room: room.trim() || null,
    branch: branch as Branch,
    year: Number(year) as YearOfStudy,
  })

  // Occurrences have to be real rows — a class you cannot cancel, or attach
  // attendance to, is not much use.
  const occurrenceRows = (slotId: string) =>
    occurrenceDates({ day_of_week: Number(day) }, OCCURRENCE_HORIZON_WEEKS).map(
      (class_date) => ({
        subject_id: subjectId,
        slot_id: slotId,
        class_date,
        start_time: startTime,
        end_time: endTime,
        room: room.trim() || null,
        branch: branch as Branch,
        year: Number(year) as YearOfStudy,
      })
    )

  // Dates a class already occupies are skipped rather than fought over, so
  // regenerating a series cannot collide with the classes it kept.
  const writeOccurrences = (slotId: string) =>
    supabase.from("scheduled_classes").upsert(occurrenceRows(slotId), {
      onConflict: "subject_id,class_date,start_time",
      ignoreDuplicates: true,
    })

  const handleSave = async () => {
    if (!subjectId) {
      toast.error("Pick a subject")
      return
    }
    if (!branch || !year) {
      toast.error("Pick the branch and year you are teaching")
      return
    }
    if (endTime <= startTime) {
      toast.error("End time must be after the start time")
      return
    }

    setSaving(true)
    const failed = (error: { code?: string } | null, fallback: string) => {
      setSaving(false)
      toast.error(
        error?.code === "23505"
          ? "That subject already has a class at this time"
          : fallback
      )
    }

    if (editing) {
      const { error } = await supabase
        .from("timetable_slots")
        .update(slotValues())
        .eq("id", slot.id)

      if (error) return failed(error, "Couldn't save your changes")

      // Rebuild the series. Classes that already have attendance are left
      // exactly as they were — that history is not ours to rewrite.
      const { data: occRows } = await supabase
        .from("scheduled_classes")
        .select("id")
        .eq("slot_id", slot.id)

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
        const { error: delError } = await supabase
          .from("scheduled_classes")
          .delete()
          .in("id", removable)
        if (delError) return failed(delError, "Couldn't reschedule the classes")
      }

      const { error: occError } = await writeOccurrences(slot.id)
      setSaving(false)

      if (occError) {
        toast.error("Slot updated, but its dates couldn't be rescheduled")
        return
      }

      toast.success("Timetable updated", {
        description: `${branch} ${YEAR_LABEL[Number(year) as YearOfStudy]} · ${WEEKDAYS[Number(day)]}s · next ${OCCURRENCE_HORIZON_WEEKS} weeks rescheduled.`,
      })
      setOpen(false)
      onSaved()
      return
    }

    const { data: created, error } = await supabase
      .from("timetable_slots")
      .insert({ subject_id: subjectId, ...slotValues() })
      .select()
      .single()

    if (error || !created) return failed(error, "Couldn't add the class")

    const { error: occError } = await writeOccurrences(
      (created as { id: string }).id
    )
    setSaving(false)

    if (occError) {
      toast.error("Class added, but its dates couldn't be scheduled")
      return
    }

    toast.success("Added to your timetable", {
      description: `${branch} ${YEAR_LABEL[Number(year) as YearOfStudy]} · ${WEEKDAYS[Number(day)]}s · next ${OCCURRENCE_HORIZON_WEEKS} weeks scheduled.`,
    })
    reset()
    setOpen(false)
    onSaved()
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next && !editing) reset()
      }}
    >
      {!editing && (
        <DialogTrigger asChild>
          <Button disabled={subjects.length === 0}>
            <Plus />
            Add class
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing
              ? "Edit this weekly class"
              : "Add a class to your timetable"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? `Changes apply to the whole weekly series. Classes that already have attendance stay as they are; the rest are rescheduled for the next ${OCCURRENCE_HORIZON_WEEKS} weeks.`
              : `This repeats weekly. Dates are scheduled for the next ${OCCURRENCE_HORIZON_WEEKS} weeks.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>Subject</Label>
            <Select
              value={subjectId}
              onValueChange={setSubjectId}
              disabled={editing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} · {s.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Branch</Label>
              <Select value={branch} onValueChange={setBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose" />
                </SelectTrigger>
                <SelectContent>
                  {BRANCHES.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose" />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {YEAR_LABEL[y]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Day</Label>
            <Select value={day} onValueChange={setDay}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WEEKDAYS.map((label, index) => (
                  <SelectItem key={label} value={String(index)}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="slot-start">Starts</Label>
              <Input
                id="slot-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slot-end">Ends</Label>
              <Input
                id="slot-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="slot-room">Room (optional)</Label>
            <Input
              id="slot-room"
              placeholder="Lab 3"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            {editing ? "Save changes" : "Add to timetable"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
