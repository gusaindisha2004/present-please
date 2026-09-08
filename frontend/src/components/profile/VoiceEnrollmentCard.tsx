import { useEffect, useState } from "react"
import { Mic, Square, CheckCircle2, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { apiFetch, ApiError } from "@/lib/api"
import { useAudioRecorder } from "@/hooks/useAudioRecorder"
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface VoiceStatus {
  enrolled: boolean
  created_at: string | null
}

export function VoiceEnrollmentCard() {
  const { profile } = useAuth()
  const [status, setStatus] = useState<VoiceStatus | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const recorder = useAudioRecorder()

  // A fixed enrolment passage, read by every student. Two things make a
  // voice profile reliable, and both come down to the audio we capture
  // rather than anything in the pipeline: length, and variety of sounds.
  // The encoder averages its embedding over the whole utterance, so ~15
  // seconds of ordinary, phonetically varied speech gives a far more
  // stable profile than one short phrase.
  const scriptLines = [
    `Hello, my name is ${profile?.full_name || "..."}, and I am present in class today.`,
    "I am recording my voice so that my teacher can mark my attendance.",
    "I will attend my classes regularly and always try to be on time.",
  ]

  const loadStatus = async () => {
    try {
      const res = await apiFetch<VoiceStatus>("/api/voice/status")
      setStatus(res)
    } catch {
      toast.error("Couldn't load your voice profile status")
      setStatus({ enrolled: false, created_at: null })
    }
  }

  useEffect(() => {
    loadStatus()
  }, [])

  const handleSave = async () => {
    if (!recorder.wavBlob) return
    setSubmitting(true)

    const formData = new FormData()
    formData.append("file", recorder.wavBlob, "voice.wav")

    try {
      await apiFetch("/api/voice/enroll", { method: "POST", body: formData })
      toast.success("Voice profile saved")
      recorder.reset()
      await loadStatus()
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Couldn't save your voice profile"
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await apiFetch("/api/voice", { method: "DELETE" })
      toast.success("Voice profile removed")
      await loadStatus()
    } catch {
      toast.error("Couldn't remove your voice profile")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="text-primary size-5" />
          Voice profile
        </CardTitle>
        <CardDescription>
          Optional — read the short passage below so your teacher can take
          attendance by voice roll-call.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status !== null && !recorder.wavBlob && (
          <div className="mb-5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-xs font-medium tracking-wide uppercase">
                Read all three lines out loud
              </p>
              <span className="text-muted-foreground text-xs">
                takes about 15 seconds
              </span>
            </div>

            <blockquote className="bg-accent text-accent-foreground border-primary/40 mt-2 space-y-2 rounded-lg border-l-2 px-4 py-3 text-base font-medium">
              {scriptLines.map((line, i) => (
                <p key={i} className="text-balance">
                  <span className="text-muted-foreground mr-2 text-sm tabular-nums">
                    {i + 1}.
                  </span>
                  {line}
                </p>
              ))}
            </blockquote>

            <ul className="text-muted-foreground mt-3 space-y-1 text-sm">
              <li>
                • Read <strong>all three lines</strong> — the more it hears,
                the better it learns your voice.
              </li>
              <li>
                • Speak naturally, at normal volume, somewhere quiet.
              </li>
              <li>
                • Press Stop when you finish the last line.
              </li>
            </ul>
          </div>
        )}

        {status === null ? (
          <Skeleton className="h-20 rounded-xl" />
        ) : recorder.wavBlob ? (
          <div className="flex flex-col items-center gap-4 py-2">
            {recorder.previewUrl && (
              <audio controls src={recorder.previewUrl} className="w-full" />
            )}
            <div className="flex w-full gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={recorder.reset}
                disabled={submitting}
              >
                Discard
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={submitting}>
                {submitting && <Loader2 className="animate-spin" />}
                Save recording
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            {recorder.state === "recording" ? (
              <>
                <span className="bg-destructive/10 text-destructive flex size-16 items-center justify-center rounded-full">
                  <span className="bg-destructive size-3 animate-pulse rounded-full" />
                </span>
                <p className="text-muted-foreground text-sm">
                  Recording… read all three lines above, then press Stop
                </p>
                <Button variant="outline" onClick={recorder.stop}>
                  <Square className="fill-current" />
                  Stop
                </Button>
              </>
            ) : recorder.state === "processing" ? (
              <>
                <Loader2 className="text-primary size-8 animate-spin" />
                <p className="text-muted-foreground text-sm">Processing recording…</p>
              </>
            ) : status.enrolled ? (
              <>
                <span className="bg-success/15 text-success flex size-16 items-center justify-center rounded-full">
                  <CheckCircle2 className="size-7" />
                </span>
                <p className="text-sm font-medium">Voice profile enrolled</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={recorder.start}>
                    <Mic />
                    Re-record
                  </Button>
                  <Button
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
                    Remove
                  </Button>
                </div>
              </>
            ) : (
              <>
                <span className="bg-accent text-accent-foreground flex size-16 items-center justify-center rounded-full">
                  <Mic className="size-7" />
                </span>
                <p className="text-muted-foreground max-w-xs text-sm text-balance">
                  No voice profile yet. Read the lines above to enable
                  voice roll-call.
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
        )}
      </CardContent>
    </Card>
  )
}
