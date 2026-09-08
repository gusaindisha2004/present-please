import { useEffect, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  Camera,
  Check,
  Loader2,
  Mic,
  ScanFace,
  Square,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { apiFetch, ApiError } from "@/lib/api"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import { useAudioRecorder } from "@/hooks/useAudioRecorder"
import type { AttendanceMethod, Subject } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface ScanRow {
  student_id: string
  full_name: string
  confidence: number | null
  photo_index: number | null
  present: boolean
}

interface FaceScanResponse {
  present: { student_id: string; full_name: string; confidence: number; photo_index: number }[]
  absent: { student_id: string; full_name: string }[]
  unmatched_faces: number
}

interface VoiceScanResponse {
  present: { student_id: string; full_name: string; confidence: number }[]
  absent: { student_id: string; full_name: string }[]
  unmatched_segments: number
}

export default function TeacherAttendancePage() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recorder = useAudioRecorder()

  const [subject, setSubject] = useState<Subject | null>(null)
  const [method, setMethod] = useState<AttendanceMethod>("face")
  const [photos, setPhotos] = useState<File[]>([])
  const [scanning, setScanning] = useState(false)
  const [saving, setSaving] = useState(false)
  const [rows, setRows] = useState<ScanRow[] | null>(null)
  const [unmatchedCount, setUnmatchedCount] = useState(0)
  const [scannedMethod, setScannedMethod] = useState<AttendanceMethod>("face")

  useEffect(() => {
    if (!subjectId) return
    supabase
      .from("subjects")
      .select("*")
      .eq("id", subjectId)
      .single()
      .then(({ data }) => setSubject(data as Subject | null))
  }, [subjectId])

  const addPhotos = (fileList: FileList) => {
    setPhotos((prev) => [...prev, ...Array.from(fileList)])
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleScan = async () => {
    if (!subjectId) return
    if (method === "face" && photos.length === 0) return
    if (method === "voice" && !recorder.wavBlob) return

    setScanning(true)

    try {
      if (method === "face") {
        const formData = new FormData()
        formData.append("subject_id", subjectId)
        photos.forEach((photo) => formData.append("files", photo))

        const res = await apiFetch<FaceScanResponse>("/api/attendance/face/scan", {
          method: "POST",
          body: formData,
        })

        const presentRows: ScanRow[] = res.present.map((p) => ({ ...p, present: true }))
        const absentRows: ScanRow[] = res.absent.map((a) => ({
          ...a,
          confidence: null,
          photo_index: null,
          present: false,
        }))
        setRows(
          [...presentRows, ...absentRows].sort((a, b) =>
            a.full_name.localeCompare(b.full_name)
          )
        )
        setUnmatchedCount(res.unmatched_faces)
      } else {
        const formData = new FormData()
        formData.append("subject_id", subjectId)
        formData.append("file", recorder.wavBlob!, "rollcall.wav")

        const res = await apiFetch<VoiceScanResponse>("/api/attendance/voice/scan", {
          method: "POST",
          body: formData,
        })

        const presentRows: ScanRow[] = res.present.map((p) => ({
          ...p,
          photo_index: null,
          present: true,
        }))
        const absentRows: ScanRow[] = res.absent.map((a) => ({
          ...a,
          confidence: null,
          photo_index: null,
          present: false,
        }))
        setRows(
          [...presentRows, ...absentRows].sort((a, b) =>
            a.full_name.localeCompare(b.full_name)
          )
        )
        setUnmatchedCount(res.unmatched_segments)
      }
      setScannedMethod(method)
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Scan failed")
    } finally {
      setScanning(false)
    }
  }

  const toggleRow = (studentId: string) => {
    setRows(
      (prev) =>
        prev?.map((row) =>
          row.student_id === studentId ? { ...row, present: !row.present } : row
        ) ?? null
    )
  }

  const handleConfirm = async () => {
    if (!subjectId || !profile || !rows) return
    setSaving(true)

    const { data: session, error: sessionError } = await supabase
      .from("attendance_sessions")
      .insert({ subject_id: subjectId, taken_by: profile.id, method: scannedMethod })
      .select()
      .single()

    if (sessionError || !session) {
      toast.error("Couldn't create the attendance session")
      setSaving(false)
      return
    }

    const { error: recordsError } = await supabase.from("attendance_records").insert(
      rows.map((row) => ({
        session_id: session.id,
        student_id: row.student_id,
        is_present: row.present,
        detected_by: row.confidence !== null ? scannedMethod : null,
        confidence: row.confidence,
      }))
    )

    setSaving(false)

    if (recordsError) {
      toast.error("Couldn't save attendance records")
      return
    }

    toast.success("Attendance saved!")
    navigate("/t/subjects")
  }

  const presentCount = rows?.filter((r) => r.present).length ?? 0

  return (
    <div className="mx-auto max-w-3xl py-8">
      <Link
        to="/t/subjects"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Subjects
      </Link>

      <div className="mt-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Take attendance{subject && ` — ${subject.name}`}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {method === "face"
            ? "Capture one or more classroom photos. AI drafts who's present — you review and confirm before anything is saved."
            : "Record the roll call. AI drafts who's present — you review and confirm before anything is saved."}
        </p>
      </div>

      {rows === null ? (
        <div className="mt-8 space-y-4">
          <Tabs
            value={method}
            onValueChange={(value) => setMethod(value as AttendanceMethod)}
          >
            <TabsList>
              <TabsTrigger value="face" disabled={scanning}>
                <Camera />
                Face
              </TabsTrigger>
              <TabsTrigger value="voice" disabled={scanning}>
                <Mic />
                Voice
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {method === "face" ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && addPhotos(e.target.files)}
              />

              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {photos.map((photo, index) => (
                    <div
                      key={`${photo.name}-${index}`}
                      className="group ring-foreground/10 relative aspect-square overflow-hidden rounded-xl ring-1"
                    >
                      <img
                        src={URL.createObjectURL(photo)}
                        alt=""
                        className="size-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="bg-background/80 text-destructive absolute inset-0 flex items-center justify-center opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
                      >
                        <Trash2 className="size-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={scanning}
                >
                  <Camera />
                  {photos.length > 0 ? "Add another photo" : "Add classroom photo"}
                </Button>
                <Button
                  onClick={handleScan}
                  disabled={photos.length === 0 || scanning}
                >
                  {scanning ? <Loader2 className="animate-spin" /> : <ScanFace />}
                  Scan for attendance
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-xl border p-6">
                <div className="flex flex-col items-center gap-4 py-2 text-center">
                  {recorder.state === "recording" ? (
                    <>
                      <span className="bg-destructive/10 text-destructive flex size-16 items-center justify-center rounded-full">
                        <span className="bg-destructive size-3 animate-pulse rounded-full" />
                      </span>
                      <p className="text-muted-foreground max-w-sm text-sm text-balance">
                        Recording… one student at a time, each answering in
                        a full sentence, with a pause in between.
                      </p>
                      <Button variant="outline" onClick={recorder.stop}>
                        <Square className="fill-current" />
                        Stop
                      </Button>
                    </>
                  ) : recorder.state === "processing" ? (
                    <>
                      <Loader2 className="text-primary size-8 animate-spin" />
                      <p className="text-muted-foreground text-sm">
                        Processing recording…
                      </p>
                    </>
                  ) : recorder.wavBlob ? (
                    <div className="flex w-full flex-col items-center gap-4">
                      {recorder.previewUrl && (
                        <audio controls src={recorder.previewUrl} className="w-full" />
                      )}
                      <Button
                        variant="outline"
                        onClick={recorder.reset}
                        disabled={scanning}
                      >
                        <Trash2 />
                        Discard
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="bg-accent text-accent-foreground flex size-16 items-center justify-center rounded-full">
                        <Mic className="size-7" />
                      </span>
                      <p className="text-muted-foreground max-w-sm text-sm text-balance">
                        Call the roll one student at a time. Ask each to
                        answer in a full sentence — "My name is [name] and
                        I am present" — rather than a single word, and
                        leave a clear pause before the next student, since
                        the recording is split on silence.
                      </p>
                      <Button onClick={recorder.start}>
                        <Mic />
                        Start recording
                      </Button>
                    </>
                  )}

                  {recorder.error && (
                    <p className="text-destructive text-sm">{recorder.error}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleScan}
                  disabled={!recorder.wavBlob || scanning}
                >
                  {scanning ? <Loader2 className="animate-spin" /> : <Mic />}
                  Scan for attendance
                </Button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-success/15 text-success">
              {presentCount} present
            </Badge>
            <Badge className="bg-destructive/15 text-destructive">
              {rows.length - presentCount} absent
            </Badge>
            {unmatchedCount > 0 && (
              <Badge className="bg-warning/15 text-warning">
                {unmatchedCount} unmatched{" "}
                {scannedMethod === "face"
                  ? `face${unmatchedCount > 1 ? "s" : ""}`
                  : `voice segment${unmatchedCount > 1 ? "s" : ""}`}{" "}
                detected
              </Badge>
            )}
          </div>

          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Confidence</TableHead>
                  {scannedMethod === "face" && <TableHead>Photo</TableHead>}
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.student_id}>
                    <TableCell className="font-medium">{row.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.confidence !== null
                        ? `${Math.round(row.confidence * 100)}%`
                        : "—"}
                    </TableCell>
                    {scannedMethod === "face" && (
                      <TableCell className="text-muted-foreground">
                        {row.photo_index !== null ? `#${row.photo_index + 1}` : "—"}
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={row.present ? "outline" : "outline"}
                        className={
                          row.present
                            ? "border-success/30 text-success hover:bg-success/10"
                            : "border-destructive/30 text-destructive hover:bg-destructive/10"
                        }
                        onClick={() => toggleRow(row.student_id)}
                      >
                        {row.present ? <Check /> : <X />}
                        {row.present ? "Present" : "Absent"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setRows(null)} disabled={saving}>
              Rescan
            </Button>
            <Button onClick={handleConfirm} disabled={saving}>
              {saving && <Loader2 className="animate-spin" />}
              Confirm & save attendance
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
