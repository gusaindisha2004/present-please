import { useState } from "react"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import { supabase } from "@/lib/supabase"
import {
  OCCURRENCE_HORIZON_WEEKS,
  WEEKDAYS,
  occurrenceDates,
} from "@/lib/scheduling"
import type { Subject } from "@/types/database"
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

export function AddSlotDialog({
  subjects,
  onCreated,
}: {
  subjects: Subject[]
  onCreated: () => void
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [subjectId, setSubjectId] = useState("")
  const [day, setDay] = useState("1")
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("10:00")
  const [room, setRoom] = useState("")

  const reset = () => {
    setSubjectId("")
    setDay("1")
    setStartTime("09:00")
    setEndTime("10:00")
    setRoom("")
  }

  const handleSave = async () => {
    if (!subjectId) {
      toast.error("Pick a subject")
      return
    }
    if (endTime <= startTime) {
      toast.error("End time must be after the start time")
      return
    }

    setSaving(true)

    const { data: slot, error } = await supabase
      .from("timetable_slots")
      .insert({
        subject_id: subjectId,
        day_of_week: Number(day),
        start_time: startTime,
        end_time: endTime,
        room: room.trim() || null,
      })
      .select()
      .single()

    if (error || !slot) {
      setSaving(false)
      toast.error(
        error?.code === "23505"
          ? "That subject already has a class at this time"
          : "Couldn't add the class"
      )
      return
    }

    // Materialise the occurrences. They have to be real rows — a class you
    // can't cancel or attach attendance to isn't much use.
    const slotRow = slot as { id: string }
    const occurrences = occurrenceDates(
      { day_of_week: Number(day) },
      OCCURRENCE_HORIZON_WEEKS
    ).map((class_date) => ({
      subject_id: subjectId,
      slot_id: slotRow.id,
      class_date,
      start_time: startTime,
      end_time: endTime,
      room: room.trim() || null,
    }))

    const { error: occError } = await supabase
      .from("scheduled_classes")
      .insert(occurrences)

    setSaving(false)

    if (occError) {
      toast.error("Class added, but its dates couldn't be scheduled")
      return
    }

    toast.success("Added to your timetable", {
      description: `${WEEKDAYS[Number(day)]}s · next ${OCCURRENCE_HORIZON_WEEKS} weeks scheduled.`,
    })
    reset()
    setOpen(false)
    onCreated()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button disabled={subjects.length === 0}>
          <Plus />
          Add class
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a class to your timetable</DialogTitle>
          <DialogDescription>
            This repeats weekly. Dates are scheduled for the next{" "}
            {OCCURRENCE_HORIZON_WEEKS} weeks.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>Subject</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
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
            Add to timetable
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
